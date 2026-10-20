<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate a staff user (super_admin / admin) and issue an API token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
        ]);

        $identifier = trim($request->input('identifier'));

        $user = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('member_id', $identifier)
            ->first();

        // Check if identifier belongs to a Member record directly
        $member = Member::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('member_id', $identifier)
            ->first();

        if ($member && $member->status === 'inactive') {
            return response()->json([
                'message' => 'Your library account is currently inactive. Please contact the library administrator.',
            ], 403);
        }

        if ($member && $member->status === 'suspended') {
            return response()->json([
                'message' => 'Your library account is currently suspended. Please contact the library administrator.',
            ], 403);
        }

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials. Please verify your email / username and password.',
            ], 401);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'message' => 'Your library account is currently inactive. Please contact the library administrator.',
            ], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your library account is currently suspended. Please contact the library administrator.',
            ], 403);
        }

        if ($user->role === 'member') {
            return response()->json([
                'message' => 'Library member accounts do not have access to the staff dashboard. Web portal access is restricted to Super Admin and Admin staff.',
            ], 403);
        }

        // Invalidate previous tokens so only one active session token exists at a time.
        $user->tokens()->delete();
        $token = $user->createToken('bpl-staff-portal')->plainTextToken;

        try {
            AuditLog::create([
                'action' => 'USER_LOGIN',
                'category' => 'Admin',
                'details' => "{$user->name} ({$user->role}) signed in to the staff dashboard.",
                'performed_by' => $user->name,
                'ip_address' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Login audit log recording failed: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user->toPublicArray(),
            'token' => $token,
        ]);
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->toPublicArray());
    }

    /**
     * Update the currently authenticated user's profile information.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:255',
        ]);

        $user->update($validated);

        if ($user->member_id) {
            $member = Member::where('member_id', $user->member_id)->first();
            if ($member) {
                $member->update([
                    'full_name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? $member->phone,
                ]);
            }
        }

        try {
            AuditLog::create([
                'action' => 'USER_PROFILE_UPDATED',
                'category' => 'Profile',
                'details' => "{$user->name} updated their profile credentials.",
                'performed_by' => $user->name,
                'ip_address' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Ignored
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->toPublicArray(),
        ]);
    }

    /**
     * Change the currently authenticated user's password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();
        if (!$user || !Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'message' => 'The current password provided is incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('new_password')),
        ]);

        try {
            AuditLog::create([
                'action' => 'USER_PASSWORD_CHANGED',
                'category' => 'Security',
                'details' => "{$user->name} ({$user->role}) changed their account password.",
                'performed_by' => $user->name,
                'ip_address' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Ignored
        }

        return response()->json([
            'message' => 'Password has been successfully changed.',
        ]);
    }
}
