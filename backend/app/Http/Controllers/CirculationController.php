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
        // Automatically sync overdue status: Any active or renewed loans past due date without return date
        CirculationTransaction::whereIn('status', ['Active', 'Renewed'])
            ->whereNull('return_date')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'Overdue']);

        $transactions = CirculationTransaction::latest()->get();
        return response()->json($transactions);
    }

    protected function getMemberMaxLoans(Member $member): int
    {
        $type = strtolower($member->membership_type ?? '');
        return match (true) {
            str_contains($type, 'faculty') => 10,
            str_contains($type, 'researcher') => 8,
            str_contains($type, 'senior') || str_contains($type, 'pwd') => 5,
            str_contains($type, 'community') => 4,
            default => 3, // Students & General
        };
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
                return response()->json([
                    'success' => false,
                    'message' => "Member account is {$member->status} and cannot borrow books. Please resolve account standing first."
                ], 422);
            }

            $overdueLoans = CirculationTransaction::where('member_id', $member->member_id)
                ->where(function ($q) {
                    $q->where('status', 'Overdue')
                      ->orWhere(function ($sub) {
                          $sub->whereIn('status', ['Active', 'Renewed'])
                              ->whereNull('return_date')
                              ->where('due_date', '<', now()->toDateString());
                      });
                })
                ->count();

            if ($overdueLoans > 0) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Borrowing restricted: Member has {$overdueLoans} overdue book(s) that must be settled before new loans can be issued."
                ], 422);
            }

            $maxAllowed = $this->getMemberMaxLoans($member);
            $activeLoansCount = CirculationTransaction::where('member_id', $member->member_id)
                ->whereIn('status', ['Active', 'Renewed', 'Overdue'])
                ->whereNull('return_date')
                ->count();

            if ($activeLoansCount + count($barcodes) > $maxAllowed) {
                \Illuminate\Support\Facades\DB::rollBack();
                $remaining = max(0, $maxAllowed - $activeLoansCount);
                return response()->json([
                    'success' => false,
                    'message' => "Loan limit reached: Member currently holds {$activeLoansCount} active loan(s) and can only borrow {$remaining} more (Maximum permitted for {$member->membership_type}: {$maxAllowed})."
                ], 422);
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

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $transaction = CirculationTransaction::where(function ($query) use ($request) {
                $query->where('barcode', $request->barcode)
                      ->orWhere('accession_number', $request->barcode);
            })
            ->whereIn('status', ['Active', 'Overdue', 'Renewed'])
            ->whereNull('return_date')
            ->latest()
            ->lockForUpdate()
            ->first();

            if (!$transaction) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "No active or overdue borrowing record found for book identifier '{$request->barcode}'."
                ], 404);
            }

            $now = Carbon::now()->startOfDay();
            $dueDate = Carbon::parse($transaction->due_date)->startOfDay();
            $daysLate = 0;
            $fine = 0;

            if ($now->gt($dueDate)) {
                $daysLate = (int) $now->diffInDays($dueDate);
                $fine = $daysLate * 5; // ₱5.00/day municipal policy fine
            }

            $returnDateStr = now()->toDateString();
            $transaction->update([
                'status' => 'Returned',
                'return_date' => $returnDateStr,
            ]);

            // Update physical copy status back to Available
            $copy = PhysicalCopy::where('barcode', $transaction->barcode)
                ->orWhere('accession_number', $transaction->accession_number)
                ->first();
            if ($copy) {
                $copy->update(['status' => 'Available']);
            }

            $processedBy = auth()->user()?->name ?? 'Staff Desk';

            AuditLog::create([
                'action' => 'Book Returned',
                'category' => 'Circulation',
                'details' => "Copy {$transaction->barcode} ('{$transaction->book_title}') returned by {$transaction->member_name}" . ($daysLate > 0 ? " ({$daysLate} day(s) overdue, penalty: ₱{$fine}.00)" : ""),
                'performed_by' => $processedBy,
                'ip_address' => $request->ip(),
            ]);

            Notification::create([
                'title' => 'Book Returned Successfully',
                'message' => "Return processed for '{$transaction->book_title}'." . ($daysLate > 0 ? " Overdue penalty: ₱{$fine}.00 ({$daysLate} days)." : " Thank you for returning on time!"),
                'type' => 'info',
                'target_member_id' => $transaction->member_id,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Book '{$transaction->book_title}' successfully returned and released to shelf." . ($daysLate > 0 ? " (Overdue: {$daysLate} day(s), penalty: ₱{$fine}.00)" : ""),
                'transaction' => $transaction,
                'fine' => $fine,
                'days_late' => $daysLate,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing the book return: ' . $e->getMessage()
            ], 500);
        }
    }

    public function renew(Request $request)
    {
        $request->validate(['transaction_id' => 'required|string']);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $tx = CirculationTransaction::where('transaction_id', $request->transaction_id)
                ->orWhere('id', $request->transaction_id)
                ->lockForUpdate()
                ->first();

            if (!$tx) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Transaction record not found.'], 404);
            }

            if (!in_array($tx->status, ['Active', 'Renewed']) || $tx->return_date) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => "Cannot renew loan in status '{$tx->status}'."], 422);
            }

            // Check if overdue
            $due = Carbon::parse($tx->due_date)->startOfDay();
            if (Carbon::now()->startOfDay()->gt($due)) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Overdue loans cannot be renewed. Please return the book to the circulation desk.'
                ], 422);
            }

            if ($tx->renewal_count >= 2) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Maximum renewal limit (2 times) has already been reached for this loan.'], 422);
            }

            // Check if another member has reserved this book
            $hasReservation = \App\Models\BookReservation::where('book_id', $tx->book_id)
                ->whereIn('status', ['Pending Approval', 'Waiting', 'Ready for Pickup'])
                ->exists();

            if ($hasReservation) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot renew this book because another patron has placed a hold reservation on it.'
                ], 422);
            }

            $newDue = Carbon::parse($tx->due_date)->addDays(14)->toDateString();
            $newCount = $tx->renewal_count + 1;
            $tx->update([
                'due_date' => $newDue,
                'renewal_count' => $newCount,
                'status' => 'Renewed',
            ]);

            $processedBy = auth()->user()?->name ?? 'Staff Desk';

            AuditLog::create([
                'action' => 'Book Loan Renewed',
                'category' => 'Circulation',
                'details' => "Loan {$tx->transaction_id} ('{$tx->book_title}') renewed for {$tx->member_name}. New due date: {$newDue} (Renewal #{$newCount})",
                'performed_by' => $processedBy,
                'ip_address' => $request->ip(),
            ]);

            Notification::create([
                'title' => 'Loan Successfully Renewed',
                'message' => "Your borrowing period for '{$tx->book_title}' has been extended. New due date: {$newDue}.",
                'type' => 'success',
                'target_member_id' => $tx->member_id,
            ]);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Loan renewed successfully. New due date is {$newDue} (Renewal #{$newCount}).",
                'transaction' => $tx,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing loan renewal: ' . $e->getMessage()
            ], 500);
        }
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
