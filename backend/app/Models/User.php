<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'status', 'username', 'member_id', 'department', 'phone', 'address', 'privileges'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = [
        'memberId',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'privileges' => 'array',
        ];
    }

    public function getMemberIdAttribute() { return $this->attributes['member_id'] ?? null; }

    public function getEffectivePrivileges(): array
    {
        if (is_array($this->privileges) && !empty($this->privileges)) {
            return array_merge([
                'circulationDesk' => true,
                'inventoryManagement' => $this->role !== 'volunteer',
                'memberManagement' => true,
                'servicesManagement' => true,
                'reportsExport' => $this->role === 'super_admin' || $this->role === 'admin',
                'auditView' => $this->role === 'super_admin',
            ], $this->privileges);
        }

        if ($this->role === 'super_admin') {
            return [
                'circulationDesk' => true,
                'inventoryManagement' => true,
                'memberManagement' => true,
                'servicesManagement' => true,
                'reportsExport' => true,
                'auditView' => true,
            ];
        }

        if ($this->role === 'volunteer') {
            return [
                'circulationDesk' => true,
                'inventoryManagement' => false,
                'memberManagement' => true,
                'servicesManagement' => true,
                'reportsExport' => false,
                'auditView' => false,
            ];
        }

        return [
            'circulationDesk' => true,
            'inventoryManagement' => true,
            'memberManagement' => true,
            'servicesManagement' => true,
            'reportsExport' => true,
            'auditView' => false,
        ];
    }

    /**
     * Shape this user for the frontend's User type (camelCase, no password).
     */
    public function toPublicArray(): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'role' => $this->role,
            'status' => $this->status,
            'memberId' => $this->member_id,
            'phone' => $this->phone,
            'address' => $this->address,
            'department' => $this->department,
            'privileges' => $this->getEffectivePrivileges(),
            'createdAt' => optional($this->created_at)->toDateString(),
        ];
    }

    public function member()
    {
        return $this->hasOne(Member::class);
    }
}
