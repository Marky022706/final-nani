import React, { useState } from 'react';
import type { Book, PhysicalCopy, UserRole } from '../../types';
import { BookDetailModal } from './BookDetailModal';
import { AddBookModal } from './AddBookModal';
import {
  Search,
  Plus,
  Filter,
  Layers,
  BookOpen,
  LayoutGrid,
  List
} from 'lucide-react';

interface BookListProps {
  books: Book[];
  userRole: UserRole;
  onBookAdded: (newBook: Book) => void;
  onAddCopy: (bookId: string, copy: PhysicalCopy) => void;
  onReserveBook?: (book: Book) => void;
  onRequestBorrow?: (book: Book, copy?: PhysicalCopy) => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  userRole,
  onBookAdded,
  onAddCopy,
  onReserveBook,
  onRequestBorrow
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm) ||
      book.classification.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || book.category === selectedCategory;

    const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
    const matchesAvailability =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Available' && availableCopies > 0) ||
      (availabilityFilter === 'Borrowed' && availableCopies === 0);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  const handleOpenDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">
            {userRole === 'member' ? 'Library Book Catalog' : 'Book Management'}
          </div>
          <div className="page-subtitle">
            {userRole === 'member'
              ? 'Browse bibliographic catalog, check shelf availability, and place hold reservations'
              : 'Catalog publications, manage physical copies, and print barcode accession labels'}
          </div>
        </div>

        <div className="page-actions">
          {userRole !== 'member' && (
            <button onClick={() => setIsAddOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Catalog Book (ISBN)</span>
            </button>
          )}

          <div style={{ display: 'flex', border: '1px solid var(--border-main)', borderRadius: 'var(--radius-md)', padding: 2, background: 'var(--bg-surface)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`btn btn-ghost btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ padding: '5px 8px', background: viewMode === 'grid' ? 'var(--bg-subtle)' : 'transparent' }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`btn btn-ghost btn-sm ${viewMode === 'table' ? 'active' : ''}`}
              style={{ padding: '5px 8px', background: viewMode === 'table' ? 'var(--bg-subtle)' : 'transparent' }}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by title, author, ISBN, or classification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Borrowed">Currently Borrowed</option>
          </select>
        </div>
      </div>

      {/* Books Content */}
      {filteredBooks.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={36} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
            No books found
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto 16px' }}>
            {searchTerm ? `No results match "${searchTerm}". Try adjusting filters.` : 'The library catalog is currently empty.'}
          </p>
          {userRole !== 'member' && (
            <button onClick={() => setIsAddOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Catalog First Book</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredBooks.map((book) => {
            const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
            const isAvail = availableCopies > 0;

            return (
              <div
                key={book.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onClick={() => handleOpenDetail(book)}
              >
                <div
                  style={{
                    height: '160px',
                    backgroundColor: 'var(--bg-subtle)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Layers size={36} color="var(--text-subtle)" />
                    </div>
                  )}
                  <span
                    className="badge badge-neutral"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {book.classification}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {book.category}
                    </span>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: '4px 0 6px',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {book.title}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      by {book.author}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span className={`badge ${isAvail ? 'badge-success' : 'badge-warning'}`}>
                      {availableCopies} / {book.copies.length} Copies Avail
                    </span>
                    {userRole === 'member' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAvail && onRequestBorrow) {
                              onRequestBorrow(book);
                            } else if (onReserveBook) {
                              onReserveBook(book);
                            }
                          }}
                          className={`btn btn-sm ${isAvail ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: 600 }}
                          title={isAvail ? 'Request to borrow this book' : 'Place reservation hold'}
                        >
                          {isAvail ? 'Borrow' : 'Reserve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(book);
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          Details
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(book);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title / Author</th>
                <th>ISBN</th>
                <th>Classification</th>
                <th>Category</th>
                <th>Copies Available</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => {
                const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
                const isAvail = availableCopies > 0;

                return (
                  <tr key={book.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{book.author}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{book.isbn}</code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{book.classification}</span>
                    </td>
                    <td>{book.category}</td>
                    <td>
                      <span className={`badge ${isAvail ? 'badge-success' : 'badge-warning'}`}>
                        {availableCopies} / {book.copies.length} Available
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {userRole === 'member' && (
                          <button
                            onClick={() => {
                              if (isAvail && onRequestBorrow) {
                                onRequestBorrow(book);
                              } else if (onReserveBook) {
                                onReserveBook(book);
                              }
                            }}
                            className={`btn btn-sm ${isAvail ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            {isAvail ? 'Borrow' : 'Reserve'}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(book)}
                          className="btn btn-secondary btn-sm"
                        >
                          View Info & Copies
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        userRole={userRole}
        onAddCopy={onAddCopy}
        onReserveBook={onReserveBook}
        onRequestBorrow={onRequestBorrow}
      />

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onBookAdded={onBookAdded}
        existingBooksCount={books.length}
      />
    </div>
  );
};
