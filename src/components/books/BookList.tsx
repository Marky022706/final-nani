import React, { useState, useRef, useEffect } from 'react';
import type { Book, PhysicalCopy, UserRole } from '../../types';
import { BookDetailModal } from './BookDetailModal';
import { AddBookModal } from './AddBookModal';
import { EditBookModal } from './EditBookModal';
import { BookSelectionToolbar } from './BookSelectionToolbar';
import { ArchiveBookDialog } from './ArchiveBookDialog';
import { DeleteBookDialog } from './DeleteBookDialog';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';
import {
  Search,
  Plus,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2
} from 'lucide-react';

interface BookListProps {
  books: Book[];
  userRole: UserRole;
  onBookAdded: (newBook: Book) => void;
  onAddCopy: (bookId: string, copy: PhysicalCopy) => void;
  onReserveBook?: (book: Book) => void;
  onRequestBorrow?: (book: Book, copy?: PhysicalCopy) => void;
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onToggleArchive?: (bookId: string) => void;
  onArchiveBooks?: (bookIds: string[]) => void | Promise<void>;
  onRestoreBooks?: (bookIds: string[]) => void | Promise<void>;
  onDeleteBooks?: (bookIds: string[]) => void | Promise<void>;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  userRole,
  onBookAdded,
  onAddCopy,
  onReserveBook,
  onRequestBorrow,
  onEditBook,
  onDeleteBook,
  onToggleArchive,
  onArchiveBooks,
  onRestoreBooks,
  onDeleteBooks,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  // Controlled Selection System
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  // Archive / Restore Dialog State
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState<boolean>(false);
  const [archiveDialogMode, setArchiveDialogMode] = useState<'archive' | 'restore'>('archive');
  const [booksToArchiveOrRestore, setBooksToArchiveOrRestore] = useState<Book[]>([]);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [booksToDelete, setBooksToDelete] = useState<Book[]>([]);
  const [isDialogSubmitting, setIsDialogSubmitting] = useState<boolean>(false);

  // Ref for indeterminate header checkbox
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  // Dynamic Breadcrumb synchronization
  const { setSubTrail, clearSubTrail } = useBreadcrumbs();

  useEffect(() => {
    if (isDetailOpen && selectedBook) {
      setSubTrail([
        {
          label: selectedBook.title,
          current: true
        }
      ]);
    } else if (isEditOpen && editingBook) {
      setSubTrail([
        {
          label: `Edit: "${editingBook.title}"`,
          current: true
        }
      ]);
    } else if (isAddOpen) {
      setSubTrail([
        {
          label: 'Catalog New Book',
          current: true
        }
      ]);
    } else if (archiveFilter === 'archived') {
      setSubTrail([
        {
          label: 'Archived Books',
          current: true
        }
      ]);
    } else if (archiveFilter === 'all') {
      setSubTrail([
        {
          label: 'All Inventory',
          current: true
        }
      ]);
    } else {
      setSubTrail([]);
    }

    return () => {
      clearSubTrail();
    };
  }, [
    isDetailOpen,
    selectedBook,
    isEditOpen,
    editingBook,
    isAddOpen,
    archiveFilter,
    setSubTrail,
    clearSubTrail
  ]);

  // Filtering
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm) ||
      (book.accessionNumber && book.accessionNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.classification && book.classification.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || book.category === selectedCategory;

    const matchesArchive =
      archiveFilter === 'all' ||
      (archiveFilter === 'active' && !book.isArchived) ||
      (archiveFilter === 'archived' && book.isArchived);

    const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
    const matchesAvailability =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Available' && availableCopies > 0) ||
      (availabilityFilter === 'Borrowed' && availableCopies === 0) ||
      (availabilityFilter === 'Archived' && book.isArchived);

    return matchesSearch && matchesCategory && matchesArchive && matchesAvailability;
  });

  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  // Derived Selection Properties
  const visibleBookIds = filteredBooks.map((b) => b.id);
  const visibleSelectedCount = visibleBookIds.filter((id) => selectedBooks.includes(id)).length;
  const isAllVisibleSelected = visibleBookIds.length > 0 && visibleSelectedCount === visibleBookIds.length;
  const isIndeterminate = visibleSelectedCount > 0 && !isAllVisibleSelected;

  // Sync indeterminate state on DOM checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const selectedBookObjects = books.filter((book) => selectedBooks.includes(book.id));
  const selectedCount = selectedBooks.length;
  const isSingleSelection = selectedCount === 1;
  const hasActiveBooks = selectedBookObjects.some((book) => !book.isArchived);
  const hasArchivedBooks = selectedBookObjects.some((book) => book.isArchived);
  const allSelectedBooksArchived =
    selectedCount > 0 && selectedBookObjects.every((book) => book.isArchived);

  // Action permission rules:
  // Single active: Edit, Archive, Clear
  // Multiple active: Archive, Clear (no edit)
  // Single archived: Edit, Restore, Delete, Clear
  // Multiple archived: Restore, Delete, Clear
  // Mixed active + archived: Archive (for active), Restore (for archived), Clear. DELETE STRICTLY DISABLED!
  const canEdit = isSingleSelection;
  const canArchive = hasActiveBooks;
  const canRestore = hasArchivedBooks && !hasActiveBooks;
  const canDelete = allSelectedBooksArchived; // Never allow active book to be directly deleted!

  // Handlers for Selection
  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedBooks((prev) => prev.filter((id) => !visibleBookIds.includes(id)));
    } else {
      setSelectedBooks((prev) => Array.from(new Set([...prev, ...visibleBookIds])));
    }
  };

  const handleToggleSelectBook = (bookId: string) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleClearSelection = () => {
    setSelectedBooks([]);
  };

  // Detail & Edit Modals
  const handleOpenDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
  };

  const handleStartEdit = (book: Book) => {
    setEditingBook(book);
    setIsEditOpen(true);
  };

  // Toolbar Actions
  const handleToolbarEdit = () => {
    if (selectedBookObjects.length === 1) {
      handleStartEdit(selectedBookObjects[0]);
    }
  };

  const handleToolbarArchive = () => {
    const toArchive = selectedBookObjects.filter((b) => !b.isArchived);
    if (toArchive.length > 0) {
      setBooksToArchiveOrRestore(toArchive);
      setArchiveDialogMode('archive');
      setIsArchiveDialogOpen(true);
    }
  };

  const handleToolbarRestore = () => {
    const toRestore = selectedBookObjects.filter((b) => b.isArchived);
    if (toRestore.length > 0) {
      setBooksToArchiveOrRestore(toRestore);
      setArchiveDialogMode('restore');
      setIsArchiveDialogOpen(true);
    }
  };

  const handleToolbarDelete = () => {
    if (allSelectedBooksArchived && selectedBookObjects.length > 0) {
      setBooksToDelete(selectedBookObjects);
      setIsDeleteDialogOpen(true);
    } else if (hasActiveBooks) {
      if (onShowToast) {
        onShowToast(
          'error',
          'Cannot Delete Active Books',
          'Active books cannot be deleted directly. Please archive them first.'
        );
      }
    }
  };

  // Single Row / Card Actions
  const handleSingleArchiveOrRestore = (book: Book) => {
    setBooksToArchiveOrRestore([book]);
    setArchiveDialogMode(book.isArchived ? 'restore' : 'archive');
    setIsArchiveDialogOpen(true);
  };

  const handleSingleDelete = (book: Book) => {
    if (!book.isArchived) {
      if (onShowToast) {
        onShowToast(
          'warning',
          'Cannot Delete Active Book',
          `"${book.title}" is currently active. Please archive the book first before deleting.`
        );
      }
      return;
    }
    setBooksToDelete([book]);
    setIsDeleteDialogOpen(true);
  };

  // Dialog Confirmations
  const handleConfirmArchiveOrRestore = async () => {
    try {
      setIsDialogSubmitting(true);
      const targetIds = booksToArchiveOrRestore.map((b) => b.id);
      const count = targetIds.length;

      if (archiveDialogMode === 'archive') {
        if (onArchiveBooks) {
          await onArchiveBooks(targetIds);
        } else if (onToggleArchive) {
          targetIds.forEach((id) => onToggleArchive(id));
        }
        if (onShowToast) {
          onShowToast(
            'success',
            'Book Archived',
            count === 1 ? 'Book archived successfully.' : `${count} books archived successfully.`
          );
        }
      } else {
        if (onRestoreBooks) {
          await onRestoreBooks(targetIds);
        } else if (onToggleArchive) {
          targetIds.forEach((id) => onToggleArchive(id));
        }
        if (onShowToast) {
          onShowToast(
            'success',
            'Book Restored',
            count === 1 ? 'Book restored successfully.' : `${count} books restored successfully.`
          );
        }
      }

      setSelectedBooks((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsArchiveDialogOpen(false);
      setBooksToArchiveOrRestore([]);
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('error', 'Operation Failed', err?.message || 'Unable to update book status.');
      }
    } finally {
      setIsDialogSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDialogSubmitting(true);
      const targetIds = booksToDelete.map((b) => b.id);
      const count = targetIds.length;
      const singleTitle = booksToDelete[0]?.title || 'Book';

      if (onDeleteBooks) {
        await onDeleteBooks(targetIds);
      } else if (onDeleteBook) {
        targetIds.forEach((id) => onDeleteBook(id));
      }

      if (onShowToast) {
        onShowToast(
          'success',
          'Book Deleted',
          count === 1
            ? `Book "${singleTitle}" has been deleted successfully.`
            : `${count} books deleted successfully.`
        );
      }

      setSelectedBooks((prev) => prev.filter((id) => !targetIds.includes(id)));
      setIsDeleteDialogOpen(false);
      setBooksToDelete([]);
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(
          'error',
          'Deletion Failed',
          err?.message || 'Unable to delete the selected book(s). Please try again.'
        );
      }
    } finally {
      setIsDialogSubmitting(false);
    }
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
              : 'Catalog publications, edit metadata, manage physical copies, and archive or retire records'}
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
          marginBottom: '18px',
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
            placeholder="Search by title, author, ISBN, or accession no..."
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
            <option value="All">All Availability</option>
            <option value="Available">Available Only</option>
            <option value="Borrowed">Currently Borrowed</option>
          </select>

          {userRole !== 'member' && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '140px' }}
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value as any)}
            >
              <option value="active">Active Catalog</option>
              <option value="archived">Archived Books</option>
              <option value="all">All (Inc. Archived)</option>
            </select>
          )}
        </div>
      </div>

      {/* Action Toolbar (Appears naturally below search controls and directly above books/table ONLY when items are selected) */}
      {userRole !== 'member' && (
        <BookSelectionToolbar
          selectedCount={selectedCount}
          onEdit={handleToolbarEdit}
          onArchive={handleToolbarArchive}
          onRestore={handleToolbarRestore}
          onDelete={handleToolbarDelete}
          onClearSelection={handleClearSelection}
          canEdit={canEdit}
          canArchive={canArchive}
          canRestore={canRestore}
          canDelete={canDelete}
          hasActiveBooks={hasActiveBooks}
          hasArchivedBooks={hasArchivedBooks}
        />
      )}

      {/* Books Content */}
      {filteredBooks.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <Layers size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            {archiveFilter === 'archived' ? 'No Archived Books Found' : 'No books found'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px' }}>
            {archiveFilter === 'archived'
              ? 'There are currently no retired or archived books in the municipal library collection.'
              : searchTerm || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria, category filters, or search keywords.'
              : 'Begin by cataloging physical publications with their ISBN and generated accession labels.'}
          </p>
          {userRole !== 'member' && archiveFilter !== 'archived' && (
            <button onClick={() => setIsAddOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Catalog First Book</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredBooks.map((book) => {
            const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
            const isAvail = availableCopies > 0;
            const isSelected = selectedBooks.includes(book.id);

            return (
              <div
                key={book.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  opacity: book.isArchived ? 0.75 : 1,
                  borderColor: isSelected ? 'var(--brand-forest)' : undefined,
                  boxShadow: isSelected ? '0 0 0 1px var(--brand-forest)' : undefined
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
                  {/* Grid Item Checkbox (For Staff / Admin) */}
                  {userRole !== 'member' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '3px 5px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectBook(book.id)}
                        aria-label={`Select book ${book.title}`}
                        style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--brand-forest)', margin: 0 }}
                      />
                    </div>
                  )}

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
                  {book.isArchived && (
                    <span
                      className="badge badge-warning"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: userRole !== 'member' ? '44px' : '10px',
                        fontWeight: 700
                      }}
                    >
                      ARCHIVED
                    </span>
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
                    {book.classification || 'General'}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {book.category}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px', padding: '1px 6px' }}>
                        {book.format || 'Paperback'}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: '4px 0 4px',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {book.title}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      by <strong>{book.author}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {book.publisher} • {book.publicationYear}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-forest)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <span>Acc: <strong>{book.accessionNumber || book.copies[0]?.accessionNumber || 'N/A'}</strong></span>
                      <span>ISBN: <code>{book.isbn}</code></span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span className={`badge ${book.isArchived ? 'badge-neutral' : isAvail ? 'badge-success' : 'badge-warning'}`}>
                      {book.isArchived ? 'Archived' : (book.availability || (isAvail ? 'Available' : 'Borrowed'))} ({availableCopies}/{book.copies.length})
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
                          disabled={!isAvail}
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
                      <div style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(book);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 7px', fontSize: '11.5px' }}
                        >
                          Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(book);
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 6px', color: 'var(--brand-forest)' }}
                          title="Edit Book Record"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleArchiveOrRestore(book);
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 6px', color: book.isArchived ? 'var(--brand-forest)' : 'var(--text-secondary)' }}
                          title={book.isArchived ? 'Restore book to catalog' : 'Archive book'}
                        >
                          {book.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(book);
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: '4px 6px',
                            color: book.isArchived ? 'var(--danger)' : 'var(--text-subtle)',
                            cursor: book.isArchived ? 'pointer' : 'not-allowed',
                            opacity: book.isArchived ? 1 : 0.4
                          }}
                          title={book.isArchived ? 'Delete Book' : 'Active books must be archived first before deletion'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
                {userRole !== 'member' && (
                  <th style={{ width: '42px', textAlign: 'center', paddingLeft: '14px', paddingRight: '6px' }}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all visible books"
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--brand-forest)' }}
                    />
                  </th>
                )}
                <th>Title / Author</th>
                <th>Category</th>
                <th>Publisher & Year</th>
                <th>ISBN</th>
                <th>Accession No.</th>
                <th>Format</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => {
                const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
                const isAvail = availableCopies > 0;
                const isSelected = selectedBooks.includes(book.id);

                return (
                  <tr
                    key={book.id}
                    style={{
                      opacity: book.isArchived ? 0.75 : 1,
                      backgroundColor: isSelected ? 'rgba(22, 101, 52, 0.04)' : undefined
                    }}
                  >
                    {userRole !== 'member' && (
                      <td
                        style={{ textAlign: 'center', width: '42px', paddingLeft: '14px', paddingRight: '6px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectBook(book.id)}
                          aria-label={`Select book ${book.title}`}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--brand-forest)' }}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{book.author}</div>
                      {book.isArchived && (
                        <span className="badge badge-warning" style={{ fontSize: '10px', marginTop: '2px' }}>ARCHIVED</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{book.category}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{book.publisher}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{book.publicationYear}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '11.5px' }}>{book.isbn}</code>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-forest)' }}>
                        {book.accessionNumber || book.copies[0]?.accessionNumber || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{book.format || 'Paperback'}</span>
                    </td>
                    <td>
                      <span className={`badge ${book.isArchived ? 'badge-neutral' : isAvail ? 'badge-success' : 'badge-warning'}`}>
                        {book.isArchived ? 'Archived' : (book.availability || (isAvail ? 'Available' : 'Borrowed'))} ({availableCopies}/{book.copies.length})
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
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
                            disabled={!isAvail}
                          >
                            {isAvail ? 'Borrow' : 'Reserve'}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(book)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          View
                        </button>
                        {userRole !== 'member' && (
                          <>
                            <button
                              onClick={() => handleStartEdit(book)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 6px', color: 'var(--brand-forest)' }}
                              title="Edit Book"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleSingleArchiveOrRestore(book)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 6px', color: book.isArchived ? 'var(--brand-forest)' : 'var(--text-secondary)' }}
                              title={book.isArchived ? 'Restore book' : 'Archive book'}
                            >
                              {book.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                            </button>
                            <button
                              onClick={() => handleSingleDelete(book)}
                              className="btn btn-ghost btn-sm"
                              style={{
                                padding: '4px 6px',
                                color: book.isArchived ? 'var(--danger)' : 'var(--text-subtle)',
                                cursor: book.isArchived ? 'pointer' : 'not-allowed',
                                opacity: book.isArchived ? 1 : 0.4
                              }}
                              title={book.isArchived ? 'Delete Book' : 'Active books must be archived first before deletion'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
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
        onEditBook={(book) => handleStartEdit(book)}
        onDeleteBook={onDeleteBook}
        onToggleArchive={onToggleArchive}
      />

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onBookAdded={onBookAdded}
        existingBooksCount={books.length}
      />

      {/* Edit Book Modal (Reused existing modal) */}
      <EditBookModal
        book={editingBook}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingBook(null);
        }}
        onBookUpdated={(updated) => {
          if (onEditBook) onEditBook(updated);
          setSelectedBooks([]);
          setIsEditOpen(false);
          setEditingBook(null);
          if (onShowToast) {
            onShowToast('success', 'Book Updated', 'Book updated successfully.');
          }
        }}
      />

      {/* Archive / Restore Confirmation Dialog */}
      <ArchiveBookDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => {
          if (!isDialogSubmitting) {
            setIsArchiveDialogOpen(false);
            setBooksToArchiveOrRestore([]);
          }
        }}
        onConfirm={handleConfirmArchiveOrRestore}
        mode={archiveDialogMode}
        books={booksToArchiveOrRestore}
        isSubmitting={isDialogSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteBookDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (!isDialogSubmitting) {
            setIsDeleteDialogOpen(false);
            setBooksToDelete([]);
          }
        }}
        onConfirm={handleConfirmDelete}
        books={booksToDelete}
        isSubmitting={isDialogSubmitting}
      />
    </div>
  );
};
