<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::with(['transactions', 'reservations'])->latest()->get();
        return response()->json($members);
    }

    public function show($id)
    {
        $member = Member::with(['transactions', 'reservations'])->where('member_id', $id)->orWhere('id', $id)->firstOrFail();
        return response()->json($member);
    }

    public function getByQr($code)
    {
        $member = Member::with(['transactions', 'reservations'])
            ->where('qr_code_data', $code)
            ->orWhere('member_id', $code)
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        return response()->json($member);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'membership_type' => 'nullable|string',
        ]);

        $seq = str_pad(Member::count() + 1, 6, '0', STR_PAD_LEFT);
        $memberId = "MBR-{$seq}";

        $member = Member::create(array_merge($validated, [
            'member_id' => $memberId,
            'qr_code_data' => $memberId,
            'status' => 'active',
            'join_date' => now()->toDateString(),
            'total_borrows' => 0,
            'photo_url' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        ]));

        AuditLog::create([
            'action' => 'Member Registered',
            'category' => 'Members',
            'details' => "Registered patron {$member->full_name} ({$member->member_id})",
            'performed_by' => 'Staff',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($member, 201);
    }
}
