<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'type',
        'read',
        'target_role',
        'target_member_id',
    ];

    protected $casts = [
        'read' => 'boolean',
    ];
}
