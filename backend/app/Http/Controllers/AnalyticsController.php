<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Member;
use App\Models\CirculationTransaction;
use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyticsController extends Controller
{
    /**
     * Resolve the date range based on period query param or custom dates.
     */
    private function resolveDateRange(?string $period, ?string $startDate, ?string $endDate): array
    {
        $now = Carbon::now();

        if ($startDate && $endDate) {
            try {
                $start = Carbon::parse($startDate)->startOfDay();
                $end = Carbon::parse($endDate)->endOfDay();
                if ($start->gt($end)) {
                    $temp = $start;
                    $start = $end;
                    $end = $temp;
                }
                return [$start, $end, 'custom'];
            } catch (\Throwable $e) {
                // fallback to default period below
            }
        }

        return match ($period) {
            '7d' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay(), '7d'],
            '6m' => [$now->copy()->subMonths(5)->startOfMonth(), $now->copy()->endOfDay(), '6m'],
            '12m' => [$now->copy()->subMonths(11)->startOfMonth(), $now->copy()->endOfDay(), '12m'],
            'all' => [Carbon::create(2020, 1, 1), $now->copy()->endOfDay(), 'all'],
            default => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay(), '30d'],
        };
    }

    /**
     * Verify staff or administrative privileges.
     */
    private function authorizeAnalytics(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['super_admin', 'admin', 'volunteer', 'staff'])) {
            return response()->json([
                'error_type' => 'forbidden',
                'message' => 'Unauthorized access to library analytics reports.'
            ], 403);
        }
        return null;
    }

    /**
     * Bar Graph - Library Activity Comparison
     * Compares metrics across categories, status breakdowns, or periods.
     */
    public function getComparison(Request $request)
    {
        if ($authError = $this->authorizeAnalytics($request)) {
            return $authError;
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            Log::error('Analytics DB Connection Failure: ' . $e->getMessage());
            return response()->json([
                'error_type' => 'database_error',
                'message' => 'The library database is temporarily unavailable. Please try again later.'
            ], 503);
        }

        $metric = $request->query('metric', 'books_by_category');
        $periodParam = $request->query('period', 'all');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        [$start, $end, $periodKey] = $this->resolveDateRange($periodParam, $startDate, $endDate);

        try {
            switch ($metric) {
                case 'circulation_by_status':
                    // Group circulation transactions by status in date range
                    $query = CirculationTransaction::query();
                    if ($periodKey !== 'all') {
                        $query->whereBetween('borrow_date', [$start->toDateString(), $end->toDateString()]);
                    }
                    $statusCounts = $query->select('status', DB::raw('count(*) as count'))
                        ->groupBy('status')
                        ->pluck('count', 'status')
                        ->toArray();

                    $standardStatuses = ['Active', 'Returned', 'Overdue', 'Renewed', 'Pending Approval', 'Rejected'];
                    $data = [];
                    $total = 0;
                    foreach ($standardStatuses as $status) {
                        $count = (int) ($statusCounts[$status] ?? 0);
                        $total += $count;
                        $data[] = [
                            'name' => $status,
                            'count' => $count,
                        ];
                    }

                    return response()->json([
                        'metric' => 'circulation_by_status',
                        'period' => $periodKey,
                        'title' => 'Circulation Status Breakdown',
                        'subtitle' => 'Distribution of loan transactions across lifecycle statuses',
                        'xAxisLabel' => 'Transaction Status',
                        'yAxisLabel' => 'Number of Transactions',
                        'data' => $data,
                        'series' => [
                            ['key' => 'count', 'label' => 'Transactions', 'color' => '#166534'],
                        ],
                        'total' => $total,
                        'summary' => "{$total} total circulation transactions recorded",
                    ]);

                case 'members_by_tier':
                    // Group members by membership tier
                    $memberCounts = Member::where(function ($q) {
                        $q->whereNull('is_archived')->orWhere('is_archived', false);
                    })
                    ->select('membership_type', DB::raw('count(*) as count'))
                    ->groupBy('membership_type')
                    ->pluck('count', 'membership_type')
                    ->toArray();

                    $standardTiers = ['Student', 'Faculty', 'Community', 'Researcher', 'Senior / PWD'];
                    $data = [];
                    $total = 0;
                    foreach ($standardTiers as $tier) {
                        $count = (int) ($memberCounts[$tier] ?? 0);
                        $total += $count;
                        $data[] = [
                            'name' => $tier,
                            'count' => $count,
                        ];
                    }

                    return response()->json([
                        'metric' => 'members_by_tier',
                        'period' => 'all',
                        'title' => 'Registered Members by Patron Category',
                        'subtitle' => 'Cardholder population across municipal educational and community tiers',
                        'xAxisLabel' => 'Patron Category',
                        'yAxisLabel' => 'Registered Cardholders',
                        'data' => $data,
                        'series' => [
                            ['key' => 'count', 'label' => 'Patrons', 'color' => '#166534'],
                        ],
                        'total' => $total,
                        'summary' => "{$total} active registered municipal patrons",
                    ]);

                case 'borrow_vs_return':
                    // Group borrows vs returns by month or day based on period
                    $isMonthly = in_array($periodKey, ['6m', '12m', 'all']);
                    $txQuery = CirculationTransaction::query();
                    if ($periodKey !== 'all') {
                        $txQuery->where(function ($q) use ($start, $end) {
                            $q->whereBetween('borrow_date', [$start->toDateString(), $end->toDateString()])
                              ->orWhereBetween('return_date', [$start->toDateString(), $end->toDateString()]);
                        });
                    }
                    $allTransactions = $txQuery->get();

                    $buckets = [];
                    if ($isMonthly) {
                        $pStart = $start->copy()->startOfMonth();
                        $pEnd = $end->copy()->endOfMonth();
                        $curr = $pStart->copy();
                        while ($curr->lte($pEnd)) {
                            $key = $curr->format('Y-m');
                            $buckets[$key] = [
                                'name' => $curr->format('M Y'),
                                'rawDate' => $key,
                                'borrowed' => 0,
                                'returned' => 0,
                            ];
                            $curr->addMonth();
                        }
                        foreach ($allTransactions as $tx) {
                            if ($tx->borrow_date) {
                                $bMonth = Carbon::parse($tx->borrow_date)->format('Y-m');
                                if (isset($buckets[$bMonth])) $buckets[$bMonth]['borrowed']++;
                            }
                            if ($tx->return_date) {
                                $rMonth = Carbon::parse($tx->return_date)->format('Y-m');
                                if (isset($buckets[$rMonth])) $buckets[$rMonth]['returned']++;
                            }
                        }
                    } else {
                        // Daily buckets
                        $curr = $start->copy();
                        while ($curr->lte($end)) {
                            $key = $curr->format('Y-m-d');
                            $buckets[$key] = [
                                'name' => $curr->format('M d'),
                                'rawDate' => $key,
                                'borrowed' => 0,
                                'returned' => 0,
                            ];
                            $curr->addDay();
                        }
                        foreach ($allTransactions as $tx) {
                            if ($tx->borrow_date) {
                                $bDay = Carbon::parse($tx->borrow_date)->format('Y-m-d');
                                if (isset($buckets[$bDay])) $buckets[$bDay]['borrowed']++;
                            }
                            if ($tx->return_date) {
                                $rDay = Carbon::parse($tx->return_date)->format('Y-m-d');
                                if (isset($buckets[$rDay])) $buckets[$rDay]['returned']++;
                            }
                        }
                    }

                    $data = array_values($buckets);
                    $totalBorrows = array_sum(array_column($data, 'borrowed'));
                    $totalReturns = array_sum(array_column($data, 'returned'));

                    return response()->json([
                        'metric' => 'borrow_vs_return',
                        'period' => $periodKey,
                        'title' => 'Circulation Comparison: Borrowed vs Returned',
                        'subtitle' => 'Volume of checked-out books compared against processed returns',
                        'xAxisLabel' => $isMonthly ? 'Month' : 'Date',
                        'yAxisLabel' => 'Books Count',
                        'data' => $data,
                        'series' => [
                            ['key' => 'borrowed', 'label' => 'Borrowed', 'color' => '#166534'],
                            ['key' => 'returned', 'label' => 'Returned', 'color' => '#22C55E'],
                        ],
                        'total' => $totalBorrows + $totalReturns,
                        'summary' => "{$totalBorrows} borrowed and {$totalReturns} returned in selected range",
                    ]);

                case 'books_by_category':
                default:
                    // Total books and copies by category
                    $books = Book::where('is_archived', false)->with('copies')->get();
                    $categoryMap = [];

                    foreach ($books as $b) {
                        $cat = trim($b->category ?: 'General Collection');
                        if (!isset($categoryMap[$cat])) {
                            $categoryMap[$cat] = [
                                'name' => $cat,
                                'titles' => 0,
                                'availableCopies' => 0,
                                'borrowedCopies' => 0,
                                'totalCopies' => 0,
                            ];
                        }
                        $categoryMap[$cat]['titles'] += 1;
                        foreach ($b->copies as $copy) {
                            $categoryMap[$cat]['totalCopies'] += 1;
                            if ($copy->status === 'Available') {
                                $categoryMap[$cat]['availableCopies'] += 1;
                            } elseif ($copy->status === 'Borrowed') {
                                $categoryMap[$cat]['borrowedCopies'] += 1;
                            }
                        }
                    }

                    // Sort descending by title count
                    uasort($categoryMap, fn ($a, $b) => $b['titles'] <=> $a['titles']);
                    $data = array_values($categoryMap);
                    $totalTitles = array_sum(array_column($data, 'titles'));
                    $totalCopies = array_sum(array_column($data, 'totalCopies'));

                    return response()->json([
                        'metric' => 'books_by_category',
                        'period' => 'all',
                        'title' => 'Catalog Holdings by Category',
                        'subtitle' => 'Volume of cataloged titles and physical copies across collections',
                        'xAxisLabel' => 'Book Category',
                        'yAxisLabel' => 'Volume Count',
                        'data' => $data,
                        'series' => [
                            ['key' => 'titles', 'label' => 'Catalog Titles', 'color' => '#166534'],
                            ['key' => 'availableCopies', 'label' => 'Available Copies', 'color' => '#22C55E'],
                        ],
                        'total' => $totalTitles,
                        'summary' => "{$totalTitles} titles across " . count($data) . " catalog categories ({$totalCopies} physical copies)",
                    ]);
            }
        } catch (\Throwable $e) {
            Log::error('Analytics getComparison error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'error_type' => 'server_error',
                'message' => 'Unable to calculate analytics comparison. Please try again later.'
            ], 500);
        }
    }

    /**
     * Line Graph - Library Activity Trends
     * Historical trends over time using actual database dates.
     */
    public function getTrends(Request $request)
    {
        if ($authError = $this->authorizeAnalytics($request)) {
            return $authError;
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            Log::error('Analytics DB Connection Failure: ' . $e->getMessage());
            return response()->json([
                'error_type' => 'database_error',
                'message' => 'The library database is temporarily unavailable. Please try again later.'
            ], 503);
        }

        $metric = $request->query('metric', 'circulation');
        $periodParam = $request->query('period', '30d');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        [$start, $end, $periodKey] = $this->resolveDateRange($periodParam, $startDate, $endDate);
        $isMonthly = in_array($periodKey, ['6m', '12m', 'all']);

        try {
            switch ($metric) {
                case 'members':
                    // Member registration trend
                    $members = Member::where(function ($q) {
                        $q->whereNull('is_archived')->orWhere('is_archived', false);
                    })->get();

                    $buckets = [];
                    if ($isMonthly) {
                        $curr = $start->copy()->startOfMonth();
                        $pEnd = $end->copy()->endOfMonth();
                        while ($curr->lte($pEnd)) {
                            $key = $curr->format('Y-m');
                            $buckets[$key] = [
                                'date' => $curr->format('M Y'),
                                'rawDate' => $key,
                                'newMembers' => 0,
                            ];
                            $curr->addMonth();
                        }

                        foreach ($members as $m) {
                            $joinDate = $m->join_date ? Carbon::parse($m->join_date) : $m->created_at;
                            if ($joinDate) {
                                $mKey = $joinDate->format('Y-m');
                                if (isset($buckets[$mKey])) {
                                    $buckets[$mKey]['newMembers']++;
                                }
                            }
                        }
                    } else {
                        $curr = $start->copy();
                        while ($curr->lte($end)) {
                            $key = $curr->format('Y-m-d');
                            $buckets[$key] = [
                                'date' => $curr->format('M d'),
                                'rawDate' => $key,
                                'newMembers' => 0,
                            ];
                            $curr->addDay();
                        }

                        foreach ($members as $m) {
                            $joinDate = $m->join_date ? Carbon::parse($m->join_date) : $m->created_at;
                            if ($joinDate) {
                                $dKey = $joinDate->format('Y-m-d');
                                if (isset($buckets[$dKey])) {
                                    $buckets[$dKey]['newMembers']++;
                                }
                            }
                        }
                    }

                    $data = array_values($buckets);
                    $totalNew = array_sum(array_column($data, 'newMembers'));

                    return response()->json([
                        'metric' => 'members',
                        'period' => $periodKey,
                        'title' => 'Patron Registration Growth Trend',
                        'subtitle' => 'Daily and monthly new cardholder registrations across Balingasag',
                        'xAxisLabel' => $isMonthly ? 'Month' : 'Date',
                        'yAxisLabel' => 'New Registrations',
                        'data' => $data,
                        'series' => [
                            ['key' => 'newMembers', 'label' => 'New Registrations', 'color' => '#166534'],
                        ],
                        'total' => $totalNew,
                        'summary' => "{$totalNew} new patrons registered during this period",
                    ]);

                case 'attendance':
                    // Patron attendance / visits trend
                    $records = AttendanceRecord::whereBetween('date', [$start->toDateString(), $end->toDateString()])->get();

                    $buckets = [];
                    if ($isMonthly) {
                        $curr = $start->copy()->startOfMonth();
                        $pEnd = $end->copy()->endOfMonth();
                        while ($curr->lte($pEnd)) {
                            $key = $curr->format('Y-m');
                            $buckets[$key] = [
                                'date' => $curr->format('M Y'),
                                'rawDate' => $key,
                                'visits' => 0,
                            ];
                            $curr->addMonth();
                        }

                        foreach ($records as $r) {
                            if ($r->date) {
                                $mKey = Carbon::parse($r->date)->format('Y-m');
                                if (isset($buckets[$mKey])) {
                                    $buckets[$mKey]['visits']++;
                                }
                            }
                        }
                    } else {
                        $curr = $start->copy();
                        while ($curr->lte($end)) {
                            $key = $curr->format('Y-m-d');
                            $buckets[$key] = [
                                'date' => $curr->format('M d'),
                                'rawDate' => $key,
                                'visits' => 0,
                            ];
                            $curr->addDay();
                        }

                        foreach ($records as $r) {
                            if ($r->date) {
                                $dKey = Carbon::parse($r->date)->format('Y-m-d');
                                if (isset($buckets[$dKey])) {
                                    $buckets[$dKey]['visits']++;
                                }
                            }
                        }
                    }

                    $data = array_values($buckets);
                    $totalVisits = array_sum(array_column($data, 'visits'));

                    return response()->json([
                        'metric' => 'attendance',
                        'period' => $periodKey,
                        'title' => 'Library Foot Traffic & Attendance Trend',
                        'subtitle' => 'Daily reading hall visits logged through QR scanner check-ins',
                        'xAxisLabel' => $isMonthly ? 'Month' : 'Date',
                        'yAxisLabel' => 'Patron Visits',
                        'data' => $data,
                        'series' => [
                            ['key' => 'visits', 'label' => 'Library Visits', 'color' => '#166534'],
                        ],
                        'total' => $totalVisits,
                        'summary' => "{$totalVisits} patron visits logged during this timeframe",
                    ]);

                case 'circulation':
                default:
                    // Circulation activity trend: borrow vs return
                    $txs = CirculationTransaction::where(function ($q) use ($start, $end) {
                        $q->whereBetween('borrow_date', [$start->toDateString(), $end->toDateString()])
                          ->orWhereBetween('return_date', [$start->toDateString(), $end->toDateString()]);
                    })->get();

                    $buckets = [];
                    if ($isMonthly) {
                        $curr = $start->copy()->startOfMonth();
                        $pEnd = $end->copy()->endOfMonth();
                        while ($curr->lte($pEnd)) {
                            $key = $curr->format('Y-m');
                            $buckets[$key] = [
                                'date' => $curr->format('M Y'),
                                'rawDate' => $key,
                                'borrowed' => 0,
                                'returned' => 0,
                                'total' => 0,
                            ];
                            $curr->addMonth();
                        }

                        foreach ($txs as $tx) {
                            if ($tx->borrow_date) {
                                $bKey = Carbon::parse($tx->borrow_date)->format('Y-m');
                                if (isset($buckets[$bKey])) {
                                    $buckets[$bKey]['borrowed']++;
                                    $buckets[$bKey]['total']++;
                                }
                            }
                            if ($tx->return_date) {
                                $rKey = Carbon::parse($tx->return_date)->format('Y-m');
                                if (isset($buckets[$rKey])) {
                                    $buckets[$rKey]['returned']++;
                                    $buckets[$rKey]['total']++;
                                }
                            }
                        }
                    } else {
                        $curr = $start->copy();
                        while ($curr->lte($end)) {
                            $key = $curr->format('Y-m-d');
                            $buckets[$key] = [
                                'date' => $curr->format('M d'),
                                'rawDate' => $key,
                                'borrowed' => 0,
                                'returned' => 0,
                                'total' => 0,
                            ];
                            $curr->addDay();
                        }

                        foreach ($txs as $tx) {
                            if ($tx->borrow_date) {
                                $bKey = Carbon::parse($tx->borrow_date)->format('Y-m-d');
                                if (isset($buckets[$bKey])) {
                                    $buckets[$bKey]['borrowed']++;
                                    $buckets[$bKey]['total']++;
                                }
                            }
                            if ($tx->return_date) {
                                $rKey = Carbon::parse($tx->return_date)->format('Y-m-d');
                                if (isset($buckets[$rKey])) {
                                    $buckets[$rKey]['returned']++;
                                    $buckets[$rKey]['total']++;
                                }
                            }
                        }
                    }

                    $data = array_values($buckets);
                    $totalBorrows = array_sum(array_column($data, 'borrowed'));
                    $totalReturns = array_sum(array_column($data, 'returned'));

                    return response()->json([
                        'metric' => 'circulation',
                        'period' => $periodKey,
                        'title' => 'Circulation Activity & Borrowing Trends',
                        'subtitle' => 'Daily and monthly checkouts and returns logged across municipal collections',
                        'xAxisLabel' => $isMonthly ? 'Month' : 'Date',
                        'yAxisLabel' => 'Transactions',
                        'data' => $data,
                        'series' => [
                            ['key' => 'borrowed', 'label' => 'Books Borrowed', 'color' => '#166534'],
                            ['key' => 'returned', 'label' => 'Books Returned', 'color' => '#22C55E'],
                        ],
                        'total' => $totalBorrows + $totalReturns,
                        'summary' => "{$totalBorrows} borrows and {$totalReturns} returns across this timeframe",
                    ]);
            }
        } catch (\Throwable $e) {
            Log::error('Analytics getTrends error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'error_type' => 'server_error',
                'message' => 'Unable to calculate analytics trends. Please try again later.'
            ], 500);
        }
    }
}
