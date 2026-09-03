<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'member_id',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'username',
        'date_of_birth',
        'gender',
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
        'userId',
        'memberId',
        'firstName',
        'middleName',
        'lastName',
        'fullName',
        'username',
        'dateOfBirth',
        'gender',
        'membershipType',
        'photoUrl',
        'qrCodeData',
        'joinDate',
        'totalBorrows',
    ];

    public function getUserIdAttribute() { return $this->attributes['user_id'] ?? null; }
    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getFirstNameAttribute() { return $this->attributes['first_name'] ?? null; }
    public function getMiddleNameAttribute() { return $this->attributes['middle_name'] ?? null; }
    public function getLastNameAttribute() { return $this->attributes['last_name'] ?? null; }
    public function getFullNameAttribute() { return $this->attributes['full_name'] ?? null; }
    public function getUsernameAttribute() { return $this->attributes['username'] ?? null; }
    public function getDateOfBirthAttribute() { return $this->attributes['date_of_birth'] ?? null; }
    public function getGenderAttribute() { return $this->attributes['gender'] ?? null; }
    public function getMembershipTypeAttribute() { return $this->attributes['membership_type'] ?? null; }
    public function getPhotoUrlAttribute() { return $this->attributes['photo_url'] ?? null; }
    public function getQrCodeDataAttribute() { return $this->attributes['qr_code_data'] ?? null; }
    public function getJoinDateAttribute() { return $this->attributes['join_date'] ?? null; }
    public function getTotalBorrowsAttribute() { return $this->attributes['total_borrows'] ?? 0; }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

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
