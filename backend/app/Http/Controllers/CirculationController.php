<?php

namespace App\Http\Controllers;

use App\Models\CirculationTransaction;
use App\Models\PhysicalCopy;
use App\Models\Member;
use App\Models\Book;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CirculationController extends Controller
{
    public function getTransactions()
    {
        $transactions = CirculationTransaction::latest()->get();
        return response()->json($transactions);
    }

    public function borrow(Request $request)
    {
        $request->validate([
            'member_id' => 'required|string',
            'barcode' => 'required|string',
            'due_date' => 'nullable|date',
        ]);

        $member = Member::where('member_id', $request->member_id)->first();
        if (!$member) {
            return response()->json(['success' => false, 'message' => "Member '{$request->member_id}' not found."], 404);
        }

        if ($member->status !== 'active') {
            return response()->json(['success' => false, 'message' => "Member account is inactive or suspended."], 422);
        }

        $activeLoans = CirculationTransaction::where('member_id', $member->member_id)
            ->whereIn('status', ['Active', 'Overdue'])
            ->count();

        if ($activeLoans >= 3) {
            return response()->json(['success' => false, 'message' => "Member has reached the maximum borrowing limit (3 books)."], 422);
        }

        $overdueLoans = CirculationTransaction::where('member_id', $member->member_id)
            ->where('status', 'Overdue')
            ->count();

        if ($overdueLoans > 0) {
            return response()->json(['success' => false, 'message' => "Member has overdue loans that must be settled first."], 422);
        }

        $copy = PhysicalCopy::with('book')
            ->where('barcode', $request->barcode)
            ->orWhere('accession_number', $request->barcode)
            ->first();

        if (!$copy) {
            return response()->json(['success' => false, 'message' => "Physical book copy '{$request->barcode}' not found."], 404);
        }

        if ($copy->status !== 'Available') {
            return response()->json(['success' => false, 'message' => "Book copy '{$request->barcode}' is not available (Status: {$copy->status})."], 422);
        }

        // Generate Transaction ID
        $count = CirculationTransaction::count() + 1;
        $txId = 'BRW-2026-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        $borrowDate = now()->toDateString();
        $dueDate = $request->due_date ? Carbon::parse($request->due_date)->toDateString() : now()->addDays(7)->toDateString();

        $transaction = CirculationTransaction::create([
            'transaction_id' => $txId,
            'book_id' => $copy->book_id,
            'book_title' => $copy->book ? $copy->book->title : 'Library Book',
            'book_author' => $copy->book ? $copy->book->author : '',
            'accession_number' => $copy->accession_number,
            'barcode' => $copy->barcode,
            'member_id' => $member->member_id,
            'member_name' => $member->full_name,
            'borrow_date' => $borrowDate,
            'due_date' => $dueDate,
            'status' => 'Active',
            'renewal_count' => 0,
            'processed_by' => 'Staff Desk',
        ]);

        // Update physical copy status
        $copy->update(['status' => 'Borrowed']);

        // Increment member borrows
        $member->increment('total_borrows');

        // Audit Log
        AuditLog::create([
            'action' => 'Book Borrowed',
            'category' => 'Circulation',
            'details' => "Loan {$txId}: '{$transaction->book_title}' ({$copy->barcode}) issued to {$member->full_name}",
            'performed_by' => 'Staff Desk',
            'ip_address' => $request->ip(),
        ]);

        // Member Notification
        Notification::create([
            'title' => 'Book Issued',
            'message' => "You have borrowed '{$transaction->book_title}'. Due date: {$dueDate}.",
            'type' => 'success',
            'target_member_id' => $member->member_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Book successfully issued to {$member->full_name}. Due on {$dueDate}.",
            'transaction' => $transaction,
        ]);
    }

    public function returnBook(Request $request)
    {
        $request->validate(['barcode' => 'required|string']);

        $transaction = CirculationTransaction::where(function ($query) use ($request) {
            $query->where('barcode', $request->barcode)
                  ->orWhere('accession_number', $request->barcode);
        })
        ->whereIn('status', ['Active', 'Overdue'])
        ->latest()
        ->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => "No active loan found for barcode '{$request->barcode}'."], 404);
        }

        $now = now();
        $dueDate = Carbon::parse($transaction->due_date);
        $fine = 0;
        if ($now->gt($dueDate)) {
            $daysLate = $now->diffInDays($dueDate);
            $fine = $daysLate * 10; // ₱10/day
        }

        $transaction->update([
            'status' => 'Returned',
            'return_date' => $now->toDateString(),
        ]);

        // Update physical copy
        $copy = PhysicalCopy::where('barcode', $transaction->barcode)->first();
        if ($copy) {
            $copy->update(['status' => 'Available']);
        }

        AuditLog::create([
            'action' => 'Book Returned',
            'category' => 'Circulation',
            'details' => "Copy {$transaction->barcode} ('{$transaction->book_title}') returned by {$transaction->member_name}" . ($fine > 0 ? " with fine ₱{$fine}.00" : ""),
            'performed_by' => 'Staff Desk',
            'ip_address' => $request->ip(),
        ]);

        Notification::create([
            'title' => 'Book Returned',
            'message' => "Return processed for '{$transaction->book_title}'." . ($fine > 0 ? " Overdue penalty: ₱{$fine}.00." : ""),
            'type' => 'info',
            'target_member_id' => $transaction->member_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Book '{$transaction->book_title}' successfully returned." . ($fine > 0 ? " Overdue fine: ₱{$fine}.00 assessed." : ""),
            'transaction' => $transaction,
            'fine' => $fine,
        ]);
    }

    public function renew(Request $request)
    {
        $request->validate(['transaction_id' => 'required|string']);

        $tx = CirculationTransaction::where('transaction_id', $request->transaction_id)
            ->orWhere('id', $request->transaction_id)
            ->first();

        if (!$tx) {
            return response()->json(['success' => false, 'message' => 'Transaction not found.'], 404);
        }

        if ($tx->status !== 'Active') {
            return response()->json(['success' => false, 'message' => "Cannot renew loan in status {$tx->status}."], 422);
        }

        if ($tx->renewal_count >= 2) {
            return response()->json(['success' => false, 'message' => 'Maximum renewals (2) reached for this loan.'], 422);
        }

        $newDue = Carbon::parse($tx->due_date)->addDays(7)->toDateString();
        $tx->update([
            'due_date' => $newDue,
            'renewal_count' => $tx->renewal_count + 1,
            'status' => 'Renewed',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Loan renewed. New due date is {$newDue}.",
            'transaction' => $tx,
        ]);
    }

    public function requestBorrow(Request $request)
    {
        $request->validate([
            'member_id' => 'required|string',
            'book_id' => 'required',
        ]);

        $member = Member::where('member_id', $request->member_id)->firstOrFail();
        $book = Book::with('copies')->findOrFail($request->book_id);

        $availableCopy = $book->copies->where('status', 'Available')->first();
        if (!$availableCopy) {
            return response()->json(['success' => false, 'message' => 'No copies currently available on shelf.'], 422);
        }

        $count = CirculationTransaction::count() + 1;
        $txId = 'REQ-2026-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        $tx = CirculationTransaction::create([
            'transaction_id' => $txId,
            'book_id' => $book->id,
            'book_title' => $book->title,
            'book_author' => $book->author,
            'accession_number' => $availableCopy->accession_number,
            'barcode' => $availableCopy->barcode,
            'member_id' => $member->member_id,
            'member_name' => $member->full_name,
            'borrow_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'Pending Approval',
            'renewal_count' => 0,
            'processed_by' => 'Member Online OPAC',
            'request_date' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Borrow request submitted. Awaiting librarian approval.',
            'transaction' => $tx,
        ]);
    }

    public function approveBorrow($id)
    {
        $tx = CirculationTransaction::where('transaction_id', $id)->orWhere('id', $id)->firstOrFail();
        $tx->update([
            'status' => 'Active',
            'transaction_id' => str_replace('REQ-', 'BRW-', $tx->transaction_id),
            'borrow_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'processed_by' => 'Admin Approval',
        ]);

        PhysicalCopy::where('barcode', $tx->barcode)->update(['status' => 'Borrowed']);

        Notification::create([
            'title' => 'Borrow Request Approved',
            'message' => "Your borrow request for '{$tx->book_title}' has been approved. Please collect it from the desk.",
            'type' => 'success',
            'target_member_id' => $tx->member_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Borrow request approved.', 'transaction' => $tx]);
    }

    public function rejectBorrow(Request $request, $id)
    {
        $tx = CirculationTransaction::where('transaction_id', $id)->orWhere('id', $id)->firstOrFail();
        $tx->update([
            'status' => 'Rejected',
            'rejection_reason' => $request->input('reason', 'Policy constraint'),
        ]);

        return response()->json(['success' => true, 'message' => 'Borrow request rejected.']);
    }
}
