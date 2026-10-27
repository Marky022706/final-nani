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
        $clean = trim($code);
        $member = Member::with(['transactions', 'reservations'])
            ->where('qr_code_data', $clean)
            ->orWhere('member_id', $clean)
            ->orWhere('id', $clean)
            ->orWhereRaw('LOWER(qr_code_data) = ?', [strtolower($clean)])
            ->orWhereRaw('LOWER(member_id) = ?', [strtolower($clean)])
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        return response()->json($member);
    }

    public function store(Request $request)
    {
        $input = $request->all();
        if (isset($input['firstName']) && !isset($input['first_name'])) $input['first_name'] = $input['firstName'];
        if (isset($input['middleName']) && !isset($input['middle_name'])) $input['middle_name'] = $input['middleName'];
        if (isset($input['lastName']) && !isset($input['last_name'])) $input['last_name'] = $input['lastName'];
        if (isset($input['fullName']) && !isset($input['full_name'])) $input['full_name'] = $input['fullName'];
        if (isset($input['suffix'])) $input['suffix'] = $input['suffix'];
        if (isset($input['sex']) && !isset($input['gender'])) $input['gender'] = $input['sex'];
        if (isset($input['contactNumber']) && !isset($input['phone'])) $input['phone'] = $input['contactNumber'];
        if (isset($input['photoUrl']) && !isset($input['photo_url'])) $input['photo_url'] = $input['photoUrl'];
        if (isset($input['membershipStatus']) && !isset($input['status'])) $input['status'] = $input['membershipStatus'];
        if (isset($input['dateRegistered']) && !isset($input['join_date'])) $input['join_date'] = $input['dateRegistered'];
        if (isset($input['membershipType']) && !isset($input['membership_type'])) $input['membership_type'] = $input['membershipType'];
        if (isset($input['school'])) $input['school'] = $input['school'];
        if (isset($input['dateOfBirth']) && !isset($input['date_of_birth'])) $input['date_of_birth'] = $input['dateOfBirth'];
        if (isset($input['qrCodeData']) && !isset($input['qr_code_data'])) $input['qr_code_data'] = $input['qrCodeData'];
        if (isset($input['memberId']) && !isset($input['member_id'])) $input['member_id'] = $input['memberId'];
        if (isset($input['temporaryPassword']) && !isset($input['temporary_password'])) $input['temporary_password'] = $input['temporaryPassword'];

        $validated = validator($input, [
            'member_id' => 'nullable|string',
            'first_name' => 'nullable|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'suffix' => 'nullable|string|max:50',
            'full_name' => 'nullable|string|max:255',
            'email' => 'required|email',
            'username' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:30',
            'membership_type' => 'nullable|string',
            'school' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,suspended',
            'photo_url' => 'nullable|string',
            'join_date' => 'nullable|date',
            'temporary_password' => 'nullable|string|min:6',
        ])->validate();

        $firstName = $validated['first_name'] ?? '';
        $middleName = $validated['middle_name'] ?? '';
        $lastName = $validated['last_name'] ?? '';
        $suffix = $validated['suffix'] ?? '';

        $nameParts = array_filter([$firstName, $middleName, $lastName]);
        $baseName = implode(' ', $nameParts);
        if ($suffix) {
            $baseName .= ' ' . $suffix;
        }
        $fullName = $validated['full_name'] ?? $baseName;
        if (empty($fullName)) {
            $fullName = 'New Library Member';
        }

        $memberId = $validated['member_id'] ?? null;
        if (!$memberId) {
            $year = date('Y');
            $seq = str_pad(Member::count() + 1, 4, '0', STR_PAD_LEFT);
            $memberId = "BPL-{$year}-{$seq}";
        }

        $status = $validated['status'] ?? 'active';
        $username = $validated['username'] ?? $validated['email'];
        $tempPass = $validated['temporary_password'] ?? 'P@ssword123';
        $joinDate = !empty($validated['join_date']) ? $validated['join_date'] : now()->toDateString();
        $defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        $photoUrl = !empty($validated['photo_url']) ? $validated['photo_url'] : $defaultPhoto;

        // Create or update linked User account
        $user = User::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $fullName,
                'username' => $username,
                'password' => Hash::make($tempPass),
                'role' => 'member',
                'status' => $status,
                'member_id' => $memberId,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]
        );

        $member = Member::updateOrCreate(
            ['member_id' => $memberId],
            [
                'user_id' => $user->id,
                'first_name' => $firstName ?: null,
                'middle_name' => $middleName ?: null,
                'last_name' => $lastName ?: null,
                'suffix' => $suffix ?: null,
                'full_name' => $fullName,
                'username' => $username,
                'date_of_birth' => !empty($validated['date_of_birth']) ? $validated['date_of_birth'] : null,
                'gender' => !empty($validated['gender']) ? $validated['gender'] : 'Other',
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'membership_type' => $validated['membership_type'] ?? 'Student',
                'school' => $validated['school'] ?? null,
                'status' => $status,
                'qr_code_data' => $validated['qr_code_data'] ?? $memberId,
                'join_date' => $joinDate,
                'total_borrows' => 0,
                'photo_url' => $photoUrl,
            ]
        );

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

        $input = $request->all();
        if (isset($input['isArchived']) && !isset($input['is_archived'])) {
            $input['is_archived'] = $input['isArchived'];
        }

        $validated = validator($input, [
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
            'school' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,suspended',
            'photo_url' => 'nullable|string',
            'is_archived' => 'nullable|boolean',
        ])->validate();

        $oldStatus = $member->status;
        $member->update($validated);

        // Sync linked user status / details if exists
        $user = null;
        if ($member->user_id) {
            $user = User::find($member->user_id);
        }
        if (!$user) {
            $user = User::where('member_id', $member->member_id)
                ->orWhere('email', $member->email)
                ->first();
        }

        if ($user) {
            $userUpdates = [
                'name' => $member->full_name,
                'email' => $member->email,
            ];
            if (isset($validated['status'])) {
                $userUpdates['status'] = $member->status;
            }
            $user->update($userUpdates);

            // Automatic Deactivation: Revoke active session tokens when status becomes inactive or suspended
            if ($member->status !== 'active') {
                $user->tokens()->delete();
            }
        }

        $auditAction = 'MEMBER_UPDATED';
        $auditDetails = "Updated member information for {$member->full_name} ({$member->member_id})";

        if (array_key_exists('is_archived', $validated)) {
            $auditAction = $validated['is_archived'] ? 'MEMBER_ARCHIVED' : 'MEMBER_RESTORED';
            $auditDetails = ($validated['is_archived'] ? 'Archived' : 'Restored') . " member account for {$member->full_name} ({$member->member_id})";
        } elseif (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $auditAction = 'MEMBER_STATUS_CHANGED';
            $auditDetails = "Changed account status for member {$member->full_name} ({$member->member_id}) from '{$oldStatus}' to '{$member->status}' (Automatic deactivation: " . ($member->status === 'inactive' ? 'Enabled' : 'Disabled') . ")";
        }

        AuditLog::create([
            'action' => $auditAction,
            'category' => 'Members',
            'details' => $auditDetails,
            'performed_by' => optional($request->user())->name ?? 'Library Administrator',
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
