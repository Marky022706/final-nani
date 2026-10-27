<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Book;
use App\Models\CirculationTransaction;
use App\Models\Member;
use App\Models\PhysicalCopy;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * 1. Attendance Report with Real-time Filtering & Summary
     */
    public function attendance(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $memberSearch = $request->query('member');
        $status = $request->query('status'); // all, inside, completed

        $query = AttendanceRecord::query();

        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        if ($memberSearch) {
            $search = '%' . trim($memberSearch) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('member_name', 'like', $search)
                  ->orWhere('member_id', 'like', $search);
            });
        }
        if ($status === 'inside') {
            $query->where(function ($q) {
                $q->whereNull('time_out')
                  ->orWhere('time_out', '')
                  ->orWhere('status', 'Inside');
            });
        } elseif ($status === 'completed') {
            $query->whereNotNull('time_out')
                  ->where('time_out', '!=', '')
                  ->where('status', '!=', 'Inside');
        }

        $records = $query->orderBy('date', 'desc')->orderBy('time_in', 'desc')->get();

        // Calculate Summary KPIs
        $totalRecords = $records->count();
        $uniqueVisitors = $records->pluck('member_id')->unique()->count();
        $insideCount = $records->filter(function ($r) {
            return empty($r->time_out) || strtolower($r->status) === 'inside';
        })->count();
        $completedCount = $totalRecords - $insideCount;

        // Daily trend breakdown
        $dailySummary = $records->groupBy('date')->map(function ($dayRecords, $date) {
            return [
                'date' => $date,
                'total' => $dayRecords->count(),
                'inside' => $dayRecords->filter(fn($r) => empty($r->time_out))->count(),
                'completed' => $dayRecords->filter(fn($r) => !empty($r->time_out))->count(),
            ];
        })->values();

        return response()->json([
            'records' => $records,
            'summary' => [
                'total_records' => $totalRecords,
                'unique_visitors' => $uniqueVisitors,
                'currently_inside' => $insideCount,
                'completed_visits' => $completedCount,
            ],
            'daily_summary' => $dailySummary,
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * 2. Book Inventory Report
     */
    public function inventory(Request $request)
    {
        $search = $request->query('search');
        $category = $request->query('category');
        $status = $request->query('status'); // all, Available, Borrowed, Archived, Lost, Under Repair

        $query = Book::with('copies');

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($search) {
            $s = '%' . trim($search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', $s)
                  ->orWhere('author', 'like', $s)
                  ->orWhere('isbn', 'like', $s)
                  ->orWhere('publisher', 'like', $s)
                  ->orWhere('classification', 'like', $s)
                  ->orWhereHas('copies', function ($cq) use ($s) {
                      $cq->where('accession_number', 'like', $s)
                         ->orWhere('barcode', 'like', $s);
                  });
            });
        }

        if ($status && $status !== 'all') {
            if ($status === 'Archived') {
                $query->where('is_archived', true);
            } else {
                $query->where('is_archived', false)
                      ->whereHas('copies', function ($cq) use ($status) {
                          $cq->where('status', $status);
                      });
            }
        }

        $books = $query->orderBy('title', 'asc')->get();

        // Calculate granular copy inventory without double counting
        $allCopies = PhysicalCopy::all();
        $totalRegisteredTitles = Book::count();
        $activeTitles = Book::where('is_archived', false)->count();
        $archivedTitles = Book::where('is_archived', true)->count();

        $totalCopies = $allCopies->count();
        $availableCopies = $allCopies->where('status', 'Available')->count();
        $borrowedCopies = $allCopies->where('status', 'Borrowed')->count();
        $reservedCopies = $allCopies->where('status', 'Reserved')->count();
        $archivedCopies = $allCopies->where('status', 'Archived')->count();
        $damagedOrLost = $allCopies->whereIn('status', ['Lost', 'Under Repair'])->count();

        // Category breakdown
        $categories = Book::where('is_archived', false)
            ->selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        return response()->json([
            'books' => $books,
            'summary' => [
                'total_titles' => $totalRegisteredTitles,
                'active_titles' => $activeTitles,
                'archived_titles' => $archivedTitles,
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'borrowed_copies' => $borrowedCopies,
                'reserved_copies' => $reservedCopies,
                'archived_copies' => $archivedCopies,
                'damaged_or_lost_copies' => $damagedOrLost,
            ],
            'categories' => $categories,
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * 3. Overdue Book Report
     */
    public function overdue(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $search = $request->query('search');
        $bracket = $request->query('bracket'); // 1-7, 8-14, 15-30, 30+

        $today = Carbon::now()->startOfDay();

        // Only active/overdue loans that haven't been returned
        $query = CirculationTransaction::whereIn('status', ['Active', 'Overdue', 'Renewed'])
            ->whereNull('return_date')
            ->where('due_date', '<', $today->toDateString());

        if ($startDate) {
            $query->where('due_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('due_date', '<=', $endDate);
        }
        if ($search) {
            $s = '%' . trim($search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('member_name', 'like', $s)
                  ->orWhere('member_id', 'like', $s)
                  ->orWhere('book_title', 'like', $s)
                  ->orWhere('barcode', 'like', $s)
                  ->orWhere('accession_number', 'like', $s);
            });
        }

        $loans = $query->orderBy('due_date', 'asc')->get();

        // Augment with calculated overdue days
        $augmented = $loans->map(function ($loan) use ($today) {
            $due = Carbon::parse($loan->due_date)->startOfDay();
            $days = max(1, (int) $due->diffInDays($today));
            $fineRate = 5.00; // Standard 5 PHP/day
            $fine = $days * $fineRate;

            return [
                'id' => $loan->transaction_id ?? (string) $loan->id,
                'transaction_id' => $loan->transaction_id,
                'member_id' => $loan->member_id,
                'member_name' => $loan->member_name,
                'book_title' => $loan->book_title,
                'book_author' => $loan->book_author,
                'barcode' => $loan->barcode,
                'accession_number' => $loan->accession_number,
                'borrow_date' => $loan->borrow_date,
                'due_date' => $loan->due_date,
                'overdue_days' => $days,
                'fine_rate' => $fineRate,
                'estimated_fine' => $fine,
                'processed_by' => $loan->processed_by,
                'status' => 'Overdue',
            ];
        });

        // Filter by overdue bracket if provided
        if ($bracket && $bracket !== 'all') {
            $augmented = $augmented->filter(function ($item) use ($bracket) {
                $d = $item['overdue_days'];
                if ($bracket === '1-7') return $d >= 1 && $d <= 7;
                if ($bracket === '8-14') return $d >= 8 && $d <= 14;
                if ($bracket === '15-30') return $d >= 15 && $d <= 30;
                if ($bracket === '30+') return $d > 30;
                return true;
            })->values();
        }

        $totalOverdue = $augmented->count();
        $uniquePatrons = $augmented->pluck('member_id')->unique()->count();
        $totalEstimatedFines = $augmented->sum('estimated_fine');
        $longestOverdue = $augmented->max('overdue_days') ?? 0;

        return response()->json([
            'records' => $augmented,
            'summary' => [
                'total_overdue' => $totalOverdue,
                'unique_patrons' => $uniquePatrons,
                'total_estimated_fines' => $totalEstimatedFines,
                'longest_overdue_days' => $longestOverdue,
            ],
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * 4. Executive Summary Report with Period-over-Period Comparison
     */
    public function executiveSummary(Request $request)
    {
        $period = $request->query('period', 'this_month'); // today, this_week, this_month, this_quarter, this_year, custom
        $startDateParam = $request->query('start_date');
        $endDateParam = $request->query('end_date');

        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                $prevStart = $start->copy()->subDay();
                $prevEnd = $end->copy()->subDay();
                $periodLabel = 'Today (' . $start->format('M d, Y') . ')';
                break;
            case 'this_week':
                $start = $now->copy()->startOfWeek();
                $end = $now->copy()->endOfWeek();
                $prevStart = $start->copy()->subWeek();
                $prevEnd = $end->copy()->subWeek();
                $periodLabel = 'This Week (' . $start->format('M d') . ' - ' . $end->format('M d, Y') . ')';
                break;
            case 'this_quarter':
                $start = $now->copy()->firstOfQuarter();
                $end = $now->copy()->lastOfQuarter();
                $prevStart = $start->copy()->subQuarter();
                $prevEnd = $end->copy()->subQuarter();
                $periodLabel = 'This Quarter (' . $start->format('M Y') . ' - ' . $end->format('M Y') . ')';
                break;
            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                $prevStart = $start->copy()->subYear();
                $prevEnd = $end->copy()->subYear();
                $periodLabel = 'This Year (' . $now->year . ')';
                break;
            case 'custom':
                $start = $startDateParam ? Carbon::parse($startDateParam)->startOfDay() : $now->copy()->startOfMonth();
                $end = $endDateParam ? Carbon::parse($endDateParam)->endOfDay() : $now->copy()->endOfDay();
                $daysDiff = max(1, $end->diffInDays($start));
                $prevEnd = $start->copy()->subDay();
                $prevStart = $prevEnd->copy()->subDays($daysDiff);
                $periodLabel = $start->format('M d, Y') . ' - ' . $end->format('M d, Y');
                break;
            case 'this_month':
            default:
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                $prevStart = $start->copy()->subMonth()->startOfMonth();
                $prevEnd = $start->copy()->subMonth()->endOfMonth();
                $periodLabel = 'This Month (' . $now->format('F Y') . ')';
                break;
        }

        $startStr = $start->toDateString();
        $endStr = $end->toDateString();
        $prevStartStr = $prevStart->toDateString();
        $prevEndStr = $prevEnd->toDateString();

        // 1. Members
        $totalMembers = Member::count();
        $activeMembers = Member::where('status', 'active')->count();
        $newMembersCurrent = Member::whereBetween('created_at', [$start, $end])->count();
        $newMembersPrev = Member::whereBetween('created_at', [$prevStart, $prevEnd])->count();

        // 2. Books & Inventory
        $totalTitles = Book::count();
        $totalCopies = PhysicalCopy::count();
        $availableCopies = PhysicalCopy::where('status', 'Available')->count();
        $borrowedCopies = PhysicalCopy::where('status', 'Borrowed')->count();

        // 3. Attendance
        $attendanceCurrent = AttendanceRecord::whereBetween('date', [$startStr, $endStr])->count();
        $attendancePrev = AttendanceRecord::whereBetween('date', [$prevStartStr, $prevEndStr])->count();
        $uniqueVisitorsCurrent = AttendanceRecord::whereBetween('date', [$startStr, $endStr])
            ->pluck('member_id')->unique()->count();

        // 4. Circulation
        $borrowsCurrent = CirculationTransaction::whereBetween('borrow_date', [$startStr, $endStr])->count();
        $borrowsPrev = CirculationTransaction::whereBetween('borrow_date', [$prevStartStr, $prevEndStr])->count();

        $returnsCurrent = CirculationTransaction::whereBetween('return_date', [$startStr, $endStr])->count();
        $returnsPrev = CirculationTransaction::whereBetween('return_date', [$prevStartStr, $prevEndStr])->count();

        // 5. Active & Overdue
        $todayStr = Carbon::now()->toDateString();
        $activeLoans = CirculationTransaction::whereIn('status', ['Active', 'Overdue', 'Renewed'])
            ->whereNull('return_date')->count();

        $overdueLoans = CirculationTransaction::whereIn('status', ['Active', 'Overdue', 'Renewed'])
            ->whereNull('return_date')
            ->where('due_date', '<', $todayStr)->count();

        // Calculate Growth Rates
        $calcGrowth = function ($current, $previous) {
            if ($previous == 0) {
                return $current > 0 ? 100 : 0;
            }
            return round((($current - $previous) / $previous) * 100, 1);
        };

        return response()->json([
            'period_label' => $periodLabel,
            'start_date' => $startStr,
            'end_date' => $endStr,
            'metrics' => [
                'total_members' => [
                    'current' => $totalMembers,
                    'active' => $activeMembers,
                    'new_in_period' => $newMembersCurrent,
                    'previous_new' => $newMembersPrev,
                    'growth' => $calcGrowth($newMembersCurrent, $newMembersPrev),
                ],
                'book_inventory' => [
                    'total_titles' => $totalTitles,
                    'total_copies' => $totalCopies,
                    'available_copies' => $availableCopies,
                    'borrowed_copies' => $borrowedCopies,
                    'utilization_rate' => $totalCopies > 0 ? round(($borrowedCopies / $totalCopies) * 100, 1) : 0,
                ],
                'attendance' => [
                    'current' => $attendanceCurrent,
                    'previous' => $attendancePrev,
                    'growth' => $calcGrowth($attendanceCurrent, $attendancePrev),
                    'unique_visitors' => $uniqueVisitorsCurrent,
                ],
                'circulation' => [
                    'borrows_current' => $borrowsCurrent,
                    'borrows_previous' => $borrowsPrev,
                    'borrows_growth' => $calcGrowth($borrowsCurrent, $borrowsPrev),
                    'returns_current' => $returnsCurrent,
                    'returns_previous' => $returnsPrev,
                    'active_loans' => $activeLoans,
                    'overdue_loans' => $overdueLoans,
                    'overdue_rate' => $activeLoans > 0 ? round(($overdueLoans / $activeLoans) * 100, 1) : 0,
                ],
            ],
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * 5. System Activity Report (Audit Logs)
     */
    public function activityLogs(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $user = $request->query('user');
        $category = $request->query('category');
        $search = $request->query('search');

        $query = AuditLog::query();

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        if ($user && $user !== 'all') {
            $query->where('performed_by', $user);
        }
        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }
        if ($search) {
            $s = '%' . trim($search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('action', 'like', $s)
                  ->orWhere('details', 'like', $s)
                  ->orWhere('performed_by', 'like', $s);
            });
        }

        $records = $query->orderBy('created_at', 'desc')->take(250)->get();

        // Calculate Summary Metrics
        $totalActivities = $records->count();
        $uniqueUsers = $records->pluck('performed_by')->unique()->filter()->values();
        $moduleCounts = $records->groupBy('category')->map->count();

        return response()->json([
            'records' => $records,
            'summary' => [
                'total_activities' => $totalActivities,
                'unique_users' => $uniqueUsers,
                'module_breakdown' => $moduleCounts,
            ],
            'generated_at' => Carbon::now()->toIso8601String(),
        ]);
    }
}
