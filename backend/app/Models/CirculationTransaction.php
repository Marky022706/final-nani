<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CirculationTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'book_id',
        'book_title',
        'book_author',
        'accession_number',
        'barcode',
        'member_id',
        'member_name',
        'borrow_date',
        'due_date',
        'return_date',
        'status',
        'renewal_count',
        'processed_by',
        'request_date',
        'rejection_reason',
    ];

    protected $casts = [
        'renewal_count' => 'integer',
    ];

    protected $appends = [
        'bookTitle',
        'bookAuthor',
        'accessionNumber',
        'memberId',
        'memberName',
        'borrowDate',
        'dueDate',
        'returnDate',
        'renewalCount',
        'processedBy',
    ];

    public function getBookTitleAttribute() { return $this->attributes['book_title'] ?? null; }
    public function getBookAuthorAttribute() { return $this->attributes['book_author'] ?? null; }
    public function getAccessionNumberAttribute() { return $this->attributes['accession_number'] ?? null; }
    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }
    public function getMemberNameAttribute() { return $this->attributes['member_name'] ?? null; }
    public function getBorrowDateAttribute() { return $this->attributes['borrow_date'] ?? null; }
    public function getDueDateAttribute() { return $this->attributes['due_date'] ?? null; }
    public function getReturnDateAttribute() { return $this->attributes['return_date'] ?? null; }
    public function getRenewalCountAttribute() { return $this->attributes['renewal_count'] ?? 0; }
    public function getProcessedByAttribute() { return $this->attributes['processed_by'] ?? 'Staff'; }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'member_id');
    }
}
