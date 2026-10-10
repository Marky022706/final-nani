<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LibraryService extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_key',
        'name',
        'category',
        'description',
        'icon_name',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    protected $appends = [
        'iconName',
        'isAvailable',
    ];

    public function getIconNameAttribute() { return $this->attributes['icon_name'] ?? 'Search'; }
    public function getIsAvailableAttribute() { return (bool) ($this->attributes['is_available'] ?? true); }

    public function records()
    {
        return $this->hasMany(ServiceRecord::class, 'service_id');
    }
}
