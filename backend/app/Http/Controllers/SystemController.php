<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Book;
use App\Models\PhysicalCopy;
use App\Models\Member;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    public function auditLogs()
    {
        return response()->json(AuditLog::latest()->take(100)->get());
    }

    public function notifications(Request $request)
    {
        $memberId = $request->query('member_id');
        $query = Notification::latest();
        if ($memberId) {
            $query->where(function ($q) use ($memberId) {
                $q->where('target_member_id', $memberId)
                  ->orWhere('target_role', 'all');
            });
        }
        return response()->json($query->take(50)->get());
    }

    public function markNotificationRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read' => true]);
        return response()->json($notification);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $memberId = $request->input('member_id');
        $query = Notification::where('read', false);
        if ($memberId) {
            $query->where(function ($q) use ($memberId) {
                $q->where('target_member_id', $memberId)
                  ->orWhere('target_role', 'all');
            });
        }
        $query->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function publicStats()
    {
        $booksCount = PhysicalCopy::where('status', 'Available')->count();
        if ($booksCount === 0) {
            $booksCount = Book::where('is_archived', false)->count();
        }

        $membersCount = Member::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('is_archived')->orWhere('is_archived', false);
            })->count();

        $foundingYear = 1994;
        $currentYear = (int) date('Y');
        $yearsServing = max(1, $currentYear - $foundingYear);

        return response()->json([
            'books_available' => $booksCount,
            'active_members' => $membersCount,
            'founding_year' => $foundingYear,
            'years_serving' => $yearsServing,
        ]);
    }
}
