<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\LibraryService;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for live operations.
     */
    public function run(): void
    {
        // 1. Seed Official Administrative Accounts (idempotent: safe to re-run)
        User::updateOrCreate(
            ['email' => 'superadmin@balingasag.gov.ph'],
            [
                'name' => 'Eleanor Vance',
                'username' => 'superadmin',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'status' => 'active',
                'department' => 'Municipal Information Office',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin.arquita@balingasag.gov.ph'],
            [
                'name' => 'Ms. Arquita',
                'username' => 'admin.arquita',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'active',
                'department' => 'Head Librarian / Library Administration',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin.roberto@balingasag.gov.ph'],
            [
                'name' => 'Roberto Gomez',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'active',
                'department' => 'Library Operations',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin1@balingasag.gov.ph'],
            [
                'name' => 'Balong Long',
                'username' => 'balonglong',
                'password' => Hash::make('admin123'),
                'role' => 'volunteer',
                'status' => 'active',
                'department' => 'Volunteer Desk Relief Operations',
            ]
        );

        // 2. Standard Municipal Library Services Catalog
        $services = [
            ['service_key' => 'srv-1', 'name' => 'Research Assistance', 'category' => 'Academic Support', 'description' => 'One-on-one assistance finding academic journals, regional archives, and library databases.', 'icon_name' => 'Search'],
            ['service_key' => 'srv-2', 'name' => 'Computer & Internet Station', 'category' => 'Technology', 'description' => 'High-speed internet access workstation for academic research, government filings, and digital learning.', 'icon_name' => 'Monitor'],
            ['service_key' => 'srv-3', 'name' => 'Quiet Reading Room', 'category' => 'Facilities', 'description' => 'Dedicated air-conditioned quiet area for concentrated studying and book reading.', 'icon_name' => 'BookOpen'],
            ['service_key' => 'srv-4', 'name' => 'Printing & Photocopying', 'category' => 'Document Services', 'description' => 'Official document printing, scanning, and photocopying for educational materials.', 'icon_name' => 'Printer'],
            ['service_key' => 'srv-5', 'name' => 'Reference & Heritage Desk', 'category' => 'Historical & Reference', 'description' => 'Specialized consultation on local Balingasag history, municipal records, and rare book collections.', 'icon_name' => 'Landmark'],
            ['service_key' => 'srv-6', 'name' => 'Library Orientation & Card Renewal', 'category' => 'Member Services', 'description' => 'Guided tour for new members, orientation on Dewey Decimal system, and digital card replacements.', 'icon_name' => 'Compass'],
        ];

        foreach ($services as $service) {
            LibraryService::updateOrCreate(
                ['service_key' => $service['service_key']],
                array_merge($service, ['is_available' => true])
            );
        }

        // 3. Initial Audit Record
        AuditLog::firstOrCreate(
            ['action' => 'SYSTEM_INITIALIZED'],
            [
                'category' => 'System',
                'details' => 'Balingasag Municipal Library Management System database initialized for live operations.',
                'performed_by' => 'System Administrator',
                'ip_address' => '127.0.0.1',
            ]
        );
    }
}
