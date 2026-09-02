<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\PhysicalCopy;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index()
    {
        $books = Book::with('copies')->latest()->get();
        return response()->json($books);
    }

    public function show($id)
    {
        $book = Book::with('copies')->findOrFail($id);
        return response()->json($book);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'isbn' => 'required|unique:books,isbn',
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string',
            'publication_year' => 'nullable|integer',
            'edition' => 'nullable|string',
            'language' => 'nullable|string',
            'description' => 'nullable|string',
            'pages' => 'nullable|integer',
            'category' => 'nullable|string',
            'classification' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'copies_count' => 'nullable|integer|min:1',
        ]);

        $book = Book::create($validated);

        $copiesCount = $request->input('copies_count', 1);
        for ($i = 1; $i <= $copiesCount; $i++) {
            $seq = str_pad(PhysicalCopy::count() + 1, 6, '0', STR_PAD_LEFT);
            PhysicalCopy::create([
                'book_id' => $book->id,
                'copy_id' => "cp-{$seq}",
                'accession_number' => "ACC-{$seq}",
                'barcode' => "BPL-{$seq}",
                'shelf_location' => $request->input('shelf_location', 'General Stacks'),
                'classification' => $book->classification,
                'condition' => 'New',
                'status' => 'Available',
                'date_added' => now()->toDateString(),
            ]);
        }

        AuditLog::create([
            'action' => 'Book Cataloged',
            'category' => 'Books',
            'details' => "Book '{$book->title}' cataloged with {$copiesCount} copies",
            'performed_by' => 'Staff',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($book->load('copies'), 201);
    }

    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);
        $book->update($request->all());
        return response()->json($book->load('copies'));
    }

    public function destroy($id)
    {
        $book = Book::findOrFail($id);
        $book->delete();
        return response()->json(['success' => true, 'message' => 'Book deleted successfully.']);
    }

    public function getCopyByBarcode($barcode)
    {
        $copy = PhysicalCopy::with('book')
            ->where('barcode', $barcode)
            ->orWhere('accession_number', $barcode)
            ->first();

        if (!$copy) {
            return response()->json(['message' => 'Copy not found'], 404);
        }

        return response()->json($copy);
    }
}
