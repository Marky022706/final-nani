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
            'barcode' => 'required_without:barcodes|string',
            'barcodes' => 'nullable|array',
            'barcodes.*' => 'string',
            'due_date' => 'nullable|date',
            'processed_by' => 'nullable|string',
        ]);

        $barcodes = $request->input('barcodes', $request->barcode ? [$request->barcode] : []);
        if (empty($barcodes)) {
            return response()->json(['success' => false, 'message' => 'Please provide at least one book barcode.'], 422);
        }

        // Deduplicate barcodes in the input
        $barcodes = array_values(array_unique($barcodes));

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $member = Member::where('member_id', $request->member_id)->lockForUpdate()->first();
            if (!$member) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => "Member '{$request->member_id}' not found."], 404);
            }

            if ($member->status !== 'active') {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => "Member account is {$member->status} and cannot borrow books."], 422);
            }

            $activeLoansCount = CirculationTransaction::where('member_id', $member->member_id)
                ->whereIn('status', ['Active', 'Overdue'])
                ->count();

            if ($activeLoansCount + count($barcodes) > 3) {
                \Illuminate\Support\Facades\DB::rollBack();
                $remaining = max(0, 3 - $activeLoansCount);
                return response()->json([
                    'success' => false,
                    'message' => "Member has {$activeLoansCount} active loans and can only borrow {$remaining} more book(s) (Maximum 3)."
                ], 422);
            }

            $overdueLoans = CirculationTransaction::where('member_id', $member->member_id)
                ->where('status', 'Overdue')
                ->count();

            if ($overdueLoans > 0) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => "Member has {$overdueLoans} overdue loan(s) that must be settled first."], 422);
            }

            $borrowDate = now()->toDateString();
            $dueDate = $request->due_date ? Carbon::parse($request->due_date)->toDateString() : now()->addDays(7)->toDateString();
            $processedBy = $request->input('processed_by', auth()->user()?->name ?? 'Staff Desk');

            $createdTransactions = [];

            foreach ($barcodes as $barcode) {
                $copy = PhysicalCopy::with('book')
                    ->where(function ($q) use ($barcode) {
                        $q->where('barcode', $barcode)
                          ->orWhere('accession_number', $barcode);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$copy) {
                    \Illuminate\Support\Facades\DB::rollBack();
                    return response()->json(['success' => false, 'message' => "Book copy '{$barcode}' was not found in catalog."], 404);
                }

                if ($copy->status !== 'Available') {
                    \Illuminate\Support\Facades\DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Book '{$copy->book?->title}' ({$copy->barcode}) is currently {$copy->status} and cannot be issued."
                    ], 422);
                }

                $count = CirculationTransaction::count() + count($createdTransactions) + 1;
                $txId = 'BRW-2026-' . str_pad($count, 5, '0', STR_PAD_LEFT);

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
                    'processed_by' => $processedBy,
                ]);

                // Update physical copy status
                $copy->update(['status' => 'Borrowed']);
                $createdTransactions[] = $transaction;

                // Audit Log
                AuditLog::create([
                    'action' => 'Book Borrowed',
                    'category' => 'Circulation',
                    'details' => "Loan {$txId}: '{$transaction->book_title}' ({$copy->barcode}) issued to {$member->full_name}",
                    'performed_by' => $processedBy,
                    'ip_address' => $request->ip(),
                ]);
            }

            // Increment member borrows
            $member->increment('total_borrows', count($createdTransactions));

            // Member Notification
            $titlesSummary = count($createdTransactions) === 1
                ? "'{$createdTransactions[0]->book_title}'"
                : count($createdTransactions) . " books";
            Notification::create([
                'title' => 'Book Issued',
                'message' => "You have borrowed {$titlesSummary}. Scheduled due date: {$dueDate}.",
                'type' => 'success',
                'target_member_id' => $member->member_id,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($createdTransactions) === 1
                    ? "Book successfully issued to {$member->full_name}. Due on {$dueDate}."
                    : count($createdTransactions) . " books successfully issued to {$member->full_name}. Due on {$dueDate}.",
                'transaction' => $createdTransactions[0],
                'transactions' => $createdTransactions,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while processing the borrowing transaction: ' . $e->getMessage()
            ], 500);
        }
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

        $member = Member::where('member_id', $request->member_id)->first();
        if (!$member) {
            return response()->json(['success' => false, 'message' => "Member '{$request->member_id}' not found."], 404);
        }

        if ($member->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your library account is currently inactive. Please contact the library administrator.'
            ], 403);
        }

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
