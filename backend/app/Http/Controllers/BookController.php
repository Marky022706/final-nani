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
        $input = $request->all();
        if (isset($input['publicationYear']) && !isset($input['publication_year'])) {
            $input['publication_year'] = $input['publicationYear'];
        }
        if (isset($input['coverImage']) && !isset($input['cover_image'])) {
            $input['cover_image'] = $input['coverImage'];
        }

        $validated = validator($input, [
            'isbn' => 'required',
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
        ])->validate();

        $book = Book::updateOrCreate(['isbn' => $validated['isbn']], $validated);

        if ($request->has('copies') && is_array($request->input('copies')) && count($request->input('copies')) > 0) {
            foreach ($request->input('copies') as $copyData) {
                $barcode = $copyData['barcode'] ?? ('BPL-' . str_pad(PhysicalCopy::count() + 1, 6, '0', STR_PAD_LEFT));
                PhysicalCopy::updateOrCreate(
                    ['barcode' => $barcode],
                    [
                        'book_id' => $book->id,
                        'copy_id' => $copyData['copyId'] ?? $copyData['copy_id'] ?? "{$barcode}-C1",
                        'accession_number' => $copyData['accessionNumber'] ?? $copyData['accession_number'] ?? $barcode,
                        'shelf_location' => $copyData['shelfLocation'] ?? $copyData['shelf_location'] ?? 'General Stacks',
                        'classification' => $copyData['classification'] ?? $book->classification,
                        'condition' => $copyData['condition'] ?? 'New',
                        'status' => $copyData['status'] ?? 'Available',
                        'date_added' => $copyData['dateAdded'] ?? $copyData['date_added'] ?? now()->toDateString(),
                    ]
                );
            }
        } else {
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
        }

        AuditLog::create([
            'action' => 'Book Cataloged',
            'category' => 'Books',
            'details' => "Book '{$book->title}' cataloged with copies",
            'performed_by' => 'Staff',
            'ip_address' => $request->ip(),
        ]);

        return response()->json($book->load('copies'), 201);
    }

    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);

        $input = $request->all();
        if (isset($input['publicationYear']) && !isset($input['publication_year'])) {
            $input['publication_year'] = $input['publicationYear'];
        }
        if (isset($input['coverImage']) && !isset($input['cover_image'])) {
            $input['cover_image'] = $input['coverImage'];
        }
        if (isset($input['isArchived']) && !isset($input['is_archived'])) {
            $input['is_archived'] = $input['isArchived'];
        }

        $validated = validator($input, [
            'isbn' => 'sometimes|required|string',
            'title' => 'sometimes|required|string|max:255',
            'author' => 'sometimes|required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'publisher' => 'nullable|string',
            'publication_year' => 'nullable|integer',
            'edition' => 'nullable|string',
            'language' => 'nullable|string',
            'description' => 'nullable|string',
            'pages' => 'nullable|integer',
            'category' => 'nullable|string',
            'subject' => 'nullable|string',
            'keywords' => 'nullable|array',
            'classification' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'is_archived' => 'nullable|boolean',
        ])->validate();

        $book->update($validated);

        AuditLog::create([
            'action' => $request->boolean('isArchived') || $request->boolean('is_archived') ? 'BOOK_ARCHIVED' : 'BOOK_UPDATED',
            'category' => 'Books',
            'details' => "Updated metadata for \"{$book->title}\" (ISBN: {$book->isbn})",
            'performed_by' => 'Staff',
            'ip_address' => $request->ip(),
        ]);

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
