<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'service_name',
        'member_id',
        'member_name',
        'date',
        'time',
        'notes',
        'recorded_by',
    ];

    protected $appends = [
        'serviceId',
        'serviceName',
        'memberId',
        'memberName',
        'recordedBy',
    ];

    public function getServiceIdAttribute() { return $this->attributes['service_id'] ?? null; }
    public function getServiceNameAttribute() { return $this->attributes['service_name'] ?? null; }
    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getMemberNameAttribute() { return $this->attributes['member_name'] ?? null; }
    public function getRecordedByAttribute() { return $this->attributes['recorded_by'] ?? 'Staff'; }

    public function service()
    {
        return $this->belongsTo(LibraryService::class, 'service_id');
    }
}
