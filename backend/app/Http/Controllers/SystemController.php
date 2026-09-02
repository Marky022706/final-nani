<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
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
}
