<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Book;

$coverMap = [
    'Clean Code' => 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    'To Kill a Mockingbird' => 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
    'Introduction to Algorithms' => 'https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg',
    'Designing Data-Intensive Applications' => 'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
    'The Pragmatic Programmer' => 'https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg',
    'Grapes of wrath' => 'https://covers.openlibrary.org/b/isbn/9780140186406-L.jpg',
    'Philippine Islands' => 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
    'Automated Test Book' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
];

$books = Book::all();
echo "Updating cover images for " . $books->count() . " books...\n";

foreach ($books as $b) {
    $assignedCover = null;
    foreach ($coverMap as $keyword => $url) {
        if (stripos($b->title, $keyword) !== false) {
            $assignedCover = $url;
            break;
        }
    }

    if (!$assignedCover) {
        $assignedCover = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80';
    }

    $b->cover_image = $assignedCover;
    $b->save();
    echo "✓ ID {$b->id}: '{$b->title}' -> {$assignedCover}\n";
}

// Also update SQLite if it exists
try {
    $sqliteFile = __DIR__ . '/../database/database.sqlite';
    if (file_exists($sqliteFile)) {
        $pdo = new PDO('sqlite:' . $sqliteFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        foreach ($books as $b) {
            $stmt = $pdo->prepare("UPDATE books SET cover_image = ? WHERE id = ? OR isbn = ?");
            $stmt->execute([$b->cover_image, $b->id, $b->isbn]);
        }
        echo "✓ SQLite books also updated.\n";
    }
} catch (Exception $e) {
    echo "SQLite update note: " . $e->getMessage() . "\n";
}

echo "=== All book covers updated successfully! ===\n";
