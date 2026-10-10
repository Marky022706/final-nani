<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'isbn',
        'title',
        'subtitle',
        'author',
        'publisher',
        'publication_year',
        'edition',
        'language',
        'description',
        'pages',
        'category',
        'subject',
        'keywords',
        'classification',
        'cover_image',
        'is_archived',
    ];

    protected $casts = [
        'keywords' => 'array',
        'publication_year' => 'integer',
        'pages' => 'integer',
        'is_archived' => 'boolean',
    ];

    protected $appends = [
        'accessionNumber',
        'availability',
        'coverImage',
        'publicationYear',
        'isArchived',
    ];

    public function getAccessionNumberAttribute()
    {
        return $this->copies->first()?->accession_number ?? null;
    }

    public function getAvailabilityAttribute()
    {
        if ($this->copies->isEmpty()) return 'Available';
        $hasAvailable = $this->copies->contains('status', 'Available');
        return $hasAvailable ? 'Available' : 'Borrowed';
    }

    public function getCoverImageAttribute() { return $this->attributes['cover_image'] ?? null; }
    public function getPublicationYearAttribute() { return $this->attributes['publication_year'] ?? null; }
    public function getIsArchivedAttribute() { return (bool) ($this->attributes['is_archived'] ?? false); }

    public function copies()
    {
        return $this->hasMany(PhysicalCopy::class);
    }
}
