<?php
// Transfer SQLite data to Laragon MySQL
$sqlitePdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$mysqlPdo  = new PDO('mysql:host=127.0.0.1;port=3306;dbname=final_nani;charset=utf8mb4', 'root', '');

$tables = [
    'users',
    'members',
    'books',
    'physical_copies',
    'circulation_transactions',
    'book_reservations',
    'attendance_records',
    'notifications',
    'audit_logs'
];

echo "--- SQLite Source Data ---\n";
foreach ($tables as $table) {
    try {
        $count = $sqlitePdo->query("SELECT count(*) FROM {$table}")->fetchColumn();
        echo "SQLite {$table}: {$count} rows\n";
    } catch (Exception $e) {
        echo "SQLite {$table}: (not found or error: " . $e->getMessage() . ")\n";
    }
}

echo "\n--- Laragon MySQL Target Data Before Sync ---\n";
foreach ($tables as $table) {
    try {
        $count = $mysqlPdo->query("SELECT count(*) FROM {$table}")->fetchColumn();
        echo "MySQL {$table}: {$count} rows\n";
    } catch (Exception $e) {
        echo "MySQL {$table}: (not found or error: " . $e->getMessage() . ")\n";
    }
}
