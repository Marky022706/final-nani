<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PhysicalCopy extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'copy_id',
        'accession_number',
        'barcode',
        'shelf_location',
        'classification',
        'condition',
        'status',
        'date_added',
    ];

    protected $appends = [
        'copyId',
        'accessionNumber',
        'shelfLocation',
        'dateAdded',
    ];

    public function getCopyIdAttribute() { return $this->attributes['copy_id'] ?? null; }
    public function getAccessionNumberAttribute() { return $this->attributes['accession_number'] ?? null; }
    public function getShelfLocationAttribute() { return $this->attributes['shelf_location'] ?? null; }
    public function getDateAddedAttribute() { return $this->attributes['date_added'] ?? null; }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }
}
