<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
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
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials. Please verify your email / username and password.',
            ], 401);
        }

        if ($user->role === 'member') {
            return response()->json([
                'message' => 'Library member accounts do not have access to the staff dashboard. Web portal access is restricted to Super Admin and Admin staff.',
            ], 403);
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

        // Invalidate previous tokens so only one active session token exists at a time.
        $user->tokens()->delete();
        $token = $user->createToken('bpl-staff-portal')->plainTextToken;

        AuditLog::create([
            'action' => 'USER_LOGIN',
            'category' => 'Admin',
            'details' => "{$user->name} ({$user->role}) signed in to the staff dashboard.",
            'performed_by' => $user->name,
            'ip_address' => $request->ip(),
        ]);

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
}
