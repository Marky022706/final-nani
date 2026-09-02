<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'full_name',
        'email',
        'phone',
        'address',
        'membership_type',
        'status',
        'photo_url',
        'qr_code_data',
        'join_date',
        'total_borrows',
    ];

    protected $appends = [
        'memberId',
        'fullName',
        'membershipType',
        'photoUrl',
        'qrCodeData',
        'joinDate',
        'totalBorrows',
    ];

    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getFullNameAttribute() { return $this->attributes['full_name'] ?? null; }
    public function getMembershipTypeAttribute() { return $this->attributes['membership_type'] ?? null; }
    public function getPhotoUrlAttribute() { return $this->attributes['photo_url'] ?? null; }
    public function getQrCodeDataAttribute() { return $this->attributes['qr_code_data'] ?? null; }
    public function getJoinDateAttribute() { return $this->attributes['join_date'] ?? null; }
    public function getTotalBorrowsAttribute() { return $this->attributes['total_borrows'] ?? 0; }

    public function transactions()
    {
        return $this->hasMany(CirculationTransaction::class, 'member_id', 'member_id');
    }

    public function reservations()
    {
        return $this->hasMany(BookReservation::class, 'member_id', 'member_id');
    }

    public function attendance()
    {
        return $this->hasMany(AttendanceRecord::class, 'member_id', 'member_id');
    }
}
