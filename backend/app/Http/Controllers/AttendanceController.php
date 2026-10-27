<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Member;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index()
    {
        $records = AttendanceRecord::latest()->get();
        return response()->json($records);
    }

    public function checkIn(Request $request)
    {
        $request->validate(['member_id' => 'required|string']);

        $code = trim($request->member_id);
        $member = Member::where('member_id', $code)
            ->orWhere('qr_code_data', $code)
            ->orWhere('id', $code)
            ->orWhereRaw('LOWER(member_id) = ?', [strtolower($code)])
            ->orWhereRaw('LOWER(qr_code_data) = ?', [strtolower($code)])
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        if ($member->status === 'inactive') {
            return response()->json([
                'message' => 'Your library account is currently inactive. Please contact the library administrator.',
            ], 403);
        }

        if ($member->status === 'suspended') {
            return response()->json([
                'message' => 'Your library account is currently suspended. Please contact the library administrator.',
            ], 403);
        }

        $now = now();
        $record = AttendanceRecord::create([
            'member_id' => $member->member_id,
            'member_name' => $member->full_name,
            'membership_type' => $member->membership_type,
            'date' => $now->toDateString(),
            'time_in' => $now->format('h:i A'),
            'status' => 'Inside',
        ]);

        return response()->json($record, 201);
    }

    public function checkOut($id)
    {
        $record = AttendanceRecord::findOrFail($id);
        $now = now();
        $record->update([
            'time_out' => $now->format('h:i A'),
            'status' => 'Completed',
        ]);

        return response()->json($record);
    }

    /**
     * Admin correction of a recorded attendance entry (time-in/out, notes),
     * with an audit trail of who edited it and why.
     */
    public function update(Request $request, $id)
    {
        $record = AttendanceRecord::findOrFail($id);

        $validated = $request->validate([
            'time_in' => 'nullable|string',
            'time_out' => 'nullable|string',
            'status' => 'nullable|in:Inside,Completed',
            'notes' => 'nullable|string',
            'reason' => 'required|string',
        ]);

        $record->update([
            'time_in' => $validated['time_in'] ?? $record->time_in,
            'time_out' => $validated['time_out'] ?? $record->time_out,
            'status' => $validated['status'] ?? $record->status,
            'notes' => $validated['notes'] ?? $record->notes,
            'edited_by' => optional($request->user())->name ?? 'Staff',
            'edit_reason' => $validated['reason'],
            'edited_at' => now(),
        ]);

        return response()->json($record);
    }
}
