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
    ];

    protected $casts = [
        'keywords' => 'array',
        'publication_year' => 'integer',
        'pages' => 'integer',
    ];

    public function copies()
    {
        return $this->hasMany(PhysicalCopy::class);
    }
}
