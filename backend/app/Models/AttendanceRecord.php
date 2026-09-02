<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'member_name',
        'membership_type',
        'date',
        'time_in',
        'time_out',
        'duration',
        'status',
        'notes',
        'edited_by',
        'edit_reason',
        'edited_at',
    ];

    protected $appends = [
        'memberId',
        'memberName',
        'membershipType',
        'timeIn',
        'timeOut',
    ];

    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getMemberNameAttribute() { return $this->attributes['member_name'] ?? null; }
    public function getMembershipTypeAttribute() { return $this->attributes['membership_type'] ?? null; }
    public function getTimeInAttribute() { return $this->attributes['time_in'] ?? null; }
    public function getTimeOutAttribute() { return $this->attributes['time_out'] ?? null; }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'member_id');
    }
}
