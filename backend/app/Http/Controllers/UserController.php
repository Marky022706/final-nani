<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * List administrative accounts (super_admin / admin). Library members are
     * managed separately via MemberController.
     */
    public function index()
    {
        $users = User::whereIn('role', ['super_admin', 'admin', 'volunteer'])->latest()->get();
        return response()->json($users->map(fn (User $u) => $u->toPublicArray())->values());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'nullable|string|max:100|unique:users,username',
            'role' => 'required|in:super_admin,admin,volunteer',
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        $tempPassword = $validated['password'] ?? ('Admin@' . Str::upper(Str::random(6)));

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? Str::before($validated['email'], '@'),
            'password' => Hash::make($tempPassword),
            'role' => $validated['role'],
            'status' => 'active',
            'department' => $validated['department'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        AuditLog::create([
            'action' => 'ADMIN_ACCOUNT_CREATED',
            'category' => 'Admin',
            'details' => "Created {$user->role} account for {$user->name} ({$user->email})",
            'performed_by' => optional($request->user())->name ?? 'Super Admin',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'user' => $user->toPublicArray(),
            'temporary_password' => $tempPassword,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'department' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive,suspended',
            'privileges' => 'nullable|array',
        ]);

        $user->update($validated);

        AuditLog::create([
            'action' => 'ADMIN_ACCOUNT_UPDATED',
            'category' => 'Admin',
            'details' => "Updated administrator account for {$user->name} ({$user->email})",
            'performed_by' => optional($request->user())->name ?? 'Super Admin',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->toPublicArray());
    }

    public function updatePrivileges(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'privileges' => 'required|array',
        ]);

        $user->update([
            'privileges' => $validated['privileges'],
        ]);

        AuditLog::create([
            'action' => 'LIBRARIAN_PRIVILEGES_UPDATED',
            'category' => 'Admin',
            'details' => "Updated operational privileges for {$user->name} ({$user->role})",
            'performed_by' => optional($request->user())->name ?? 'Super Admin',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->toPublicArray());
    }

    public function toggleStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'status' => $user->status === 'active' ? 'inactive' : 'active',
        ]);

        AuditLog::create([
            'action' => 'ADMIN_STATUS_CHANGED',
            'category' => 'Admin',
            'details' => "Set status of {$user->name} ({$user->email}) to {$user->status}",
            'performed_by' => optional($request->user())->name ?? 'Super Admin',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->toPublicArray());
    }

    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $newPassword = 'Admin@' . Str::upper(Str::random(6));

        $user->update(['password' => Hash::make($newPassword)]);

        $currentTokenId = $request->user()?->currentAccessToken()?->id;
        if ($currentTokenId && $request->user()?->id === $user->id) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        } else {
            $user->tokens()->delete();
        }

        AuditLog::create([
            'action' => 'ADMIN_PASSWORD_RESET',
            'category' => 'Admin',
            'details' => "Reset password for administrator {$user->name} ({$user->email})",
            'performed_by' => optional($request->user())->name ?? 'Super Admin',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => "Temporary credential generated for {$user->email}.",
            'temporary_password' => $newPassword,
        ]);
    }
}
