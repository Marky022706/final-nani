<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookReservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'book_title',
        'member_id',
        'member_name',
        'reservation_date',
        'expiry_date',
        'status',
        'queue_position',
        'notes',
    ];

    protected $casts = [
        'queue_position' => 'integer',
    ];

    protected $appends = [
        'bookTitle',
        'memberId',
        'memberName',
        'reservationDate',
        'expiryDate',
        'queuePosition',
    ];

    public function getBookTitleAttribute() { return $this->attributes['book_title'] ?? null; }
    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getMemberNameAttribute() { return $this->attributes['member_name'] ?? null; }
    public function getReservationDateAttribute() { return $this->attributes['reservation_date'] ?? null; }
    public function getExpiryDateAttribute() { return $this->attributes['expiry_date'] ?? null; }
    public function getQueuePositionAttribute() { return $this->attributes['queue_position'] ?? 1; }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'member_id');
    }
}
