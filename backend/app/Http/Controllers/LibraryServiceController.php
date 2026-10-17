<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\LibraryService;
use App\Models\Member;
use App\Models\ServiceRecord;
use Illuminate\Http\Request;

class LibraryServiceController extends Controller
{
    public function index()
    {
        return response()->json(LibraryService::orderBy('id')->get());
    }

    public function records()
    {
        return response()->json(ServiceRecord::latest()->get());
    }

    public function recordUsage(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required',
            'member_id' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $service = LibraryService::where('id', $validated['service_id'])
            ->orWhere('service_key', $validated['service_id'])
            ->firstOrFail();

        $member = Member::where('member_id', $validated['member_id'])->first();
        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        if ($member->status !== 'active') {
            return response()->json([
                'message' => 'Your library account is currently inactive. Please contact the library administrator.',
            ], 403);
        }

        $now = now();
        $record = ServiceRecord::create([
            'service_id' => $service->id,
            'service_name' => $service->name,
            'member_id' => $member->member_id,
            'member_name' => $member->full_name,
            'date' => $now->toDateString(),
            'time' => $now->format('h:i A'),
            'notes' => $validated['notes'] ?? null,
            'recorded_by' => optional($request->user())->name ?? 'Staff',
        ]);

        AuditLog::create([
            'action' => 'SERVICE_RECORDED',
            'category' => 'Circulation',
            'details' => "Logged service \"{$service->name}\" for patron {$member->full_name} ({$member->member_id})",
            'performed_by' => optional($request->user())->name ?? 'Staff',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($record, 201);
    }
}
