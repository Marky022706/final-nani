<?php

namespace App\Http\Controllers;

use App\Models\BookReservation;
use App\Models\Member;
use App\Models\Book;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index()
    {
        $reservations = BookReservation::latest()->get();
        return response()->json($reservations);
    }

    public function store(Request $request)
    {
        $request->validate([
            'member_id' => 'required|string',
            'book_id' => 'required',
            'notes' => 'nullable|string',
        ]);

        $member = Member::where('member_id', $request->member_id)->firstOrFail();
        $book = Book::findOrFail($request->book_id);

        $queue = BookReservation::where('book_id', $book->id)
            ->whereIn('status', ['Pending Approval', 'Waiting', 'Ready for Pickup'])
            ->count() + 1;

        $reservation = BookReservation::create([
            'book_id' => $book->id,
            'book_title' => $book->title,
            'member_id' => $member->member_id,
            'member_name' => $member->full_name,
            'reservation_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(7)->toDateString(),
            'status' => 'Pending Approval',
            'queue_position' => $queue,
            'notes' => $request->notes,
        ]);

        AuditLog::create([
            'action' => 'Reservation Requested',
            'category' => 'Circulation',
            'details' => "Reservation hold placed on '{$book->title}' for {$member->full_name}",
            'performed_by' => $member->full_name,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Hold reservation placed for '{$book->title}'.",
            'reservation' => $reservation,
        ], 201);
    }

    public function approve($id)
    {
        $res = BookReservation::findOrFail($id);
        $res->update([
            'status' => 'Ready for Pickup',
            'expiry_date' => now()->addDays(3)->toDateString(),
        ]);

        Notification::create([
            'title' => 'Book Ready for Pickup',
            'message' => "Your reserved copy of '{$res->book_title}' is now ready for pickup at the desk. Held until {$res->expiry_date}.",
            'type' => 'success',
            'target_member_id' => $res->member_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Reservation approved and marked Ready for Pickup.']);
    }

    public function cancel($id)
    {
        $res = BookReservation::findOrFail($id);
        $res->update(['status' => 'Cancelled']);

        return response()->json(['success' => true, 'message' => 'Reservation cancelled.']);
    }
}
