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

        $member = Member::where('member_id', $request->member_id)
            ->orWhere('qr_code_data', $request->member_id)
            ->firstOrFail();

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
}
