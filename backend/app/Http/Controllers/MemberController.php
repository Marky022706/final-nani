<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::with(['transactions', 'reservations'])->latest()->get();
        return response()->json($members);
    }

    public function show($id)
    {
        $member = Member::with(['transactions', 'reservations'])
            ->where('member_id', $id)
            ->orWhere('id', $id)
            ->firstOrFail();
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
            'first_name' => 'nullable|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'full_name' => 'nullable|string|max:255',
            'email' => 'required|email',
            'username' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:30',
            'membership_type' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,suspended',
            'temporary_password' => 'nullable|string|min:6',
        ]);

        $firstName = $validated['first_name'] ?? '';
        $middleName = $validated['middle_name'] ?? '';
        $lastName = $validated['last_name'] ?? '';

        $fullName = $validated['full_name'] ?? trim("{$firstName} {$middleName} {$lastName}");
        if (empty($fullName)) {
            $fullName = 'New Library Member';
        }

        // Auto-generate BPL-2026-XXXX format
        $year = date('Y');
        $seq = str_pad(Member::count() + 1, 4, '0', STR_PAD_LEFT);
        $memberId = "BPL-{$year}-{$seq}";

        $status = $validated['status'] ?? 'active';
        $username = $validated['username'] ?? $validated['email'];
        $tempPass = $validated['temporary_password'] ?? Str::random(10);

        // Create linked User account with strictly locked 'member' role
        $user = User::create([
            'name' => $fullName,
            'email' => $validated['email'],
            'username' => $username,
            'password' => Hash::make($tempPass),
            'role' => 'member',
            'status' => $status,
            'member_id' => $memberId,
        ]);

        $member = Member::create([
            'user_id' => $user->id,
            'member_id' => $memberId,
            'first_name' => $firstName ?: null,
            'middle_name' => $middleName ?: null,
            'last_name' => $lastName ?: null,
            'full_name' => $fullName,
            'username' => $username,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? 'Other',
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'membership_type' => $validated['membership_type'] ?? 'Student',
            'status' => $status,
            'qr_code_data' => $memberId,
            'join_date' => now()->toDateString(),
            'total_borrows' => 0,
            'photo_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        ]);

        AuditLog::create([
            'action' => 'MEMBER_REGISTERED',
            'category' => 'Members',
            'details' => "Admin registered member {$member->full_name} ({$member->member_id}) with role 'member'",
            'performed_by' => 'Library Administrator',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'member' => $member,
            'temporary_password' => $tempPass,
            'message' => 'Member account created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $member = Member::where('member_id', $id)->orWhere('id', $id)->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:30',
            'membership_type' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,suspended',
            'photo_url' => 'nullable|string',
        ]);

        $member->update($validated);

        // Sync linked user status / details if exists
        if ($member->user_id) {
            $user = User::find($member->user_id);
            if ($user) {
                $user->update([
                    'name' => $member->full_name,
                    'email' => $member->email,
                    'status' => $member->status,
                ]);
            }
        }

        AuditLog::create([
            'action' => 'MEMBER_UPDATED',
            'category' => 'Members',
            'details' => "Updated member information for {$member->full_name} ({$member->member_id})",
            'performed_by' => 'Library Administrator',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($member);
    }

    public function resetPassword(Request $request, $id)
    {
        $member = Member::where('member_id', $id)->orWhere('id', $id)->firstOrFail();

        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        if ($member->user_id) {
            $user = User::find($member->user_id);
            if ($user) {
                $user->update([
                    'password' => Hash::make($request->input('password')),
                ]);
            }
        }

        AuditLog::create([
            'action' => 'PASSWORD_RESET',
            'category' => 'Members',
            'details' => "Admin reset temporary password for member {$member->full_name} ({$member->member_id})",
            'performed_by' => 'Library Administrator',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function destroy(Request $request, $id)
    {
        $member = Member::where('member_id', $id)->orWhere('id', $id)->firstOrFail();

        if ($member->user_id) {
            User::destroy($member->user_id);
        }

        $fullName = $member->full_name;
        $memberId = $member->member_id;

        $member->delete();

        AuditLog::create([
            'action' => 'MEMBER_DELETED',
            'category' => 'Members',
            'details' => "Deleted member account {$fullName} ({$memberId})",
            'performed_by' => 'Library Administrator',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Member account deleted successfully.']);
    }
}
