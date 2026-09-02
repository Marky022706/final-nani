import React, { useState } from 'react';
import type { Book, PhysicalCopy, UserRole } from '../../types';
import { BarcodeSvg } from '../../utils/barcode';
import { X, Printer, Plus, Bookmark, Layers, BookOpen } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  onAddCopy?: (bookId: string, copy: PhysicalCopy) => void;
  onReserveBook?: (book: Book) => void;
  onRequestBorrow?: (book: Book, copy?: PhysicalCopy) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  userRole,
  onAddCopy,
  onReserveBook,
  onRequestBorrow
}) => {
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const availableCopies = book.copies.filter((c) => c.status === 'Available').length;
  const isAvailable = availableCopies > 0;

  const handlePrintBarcode = (barcode: string) => {
    setSelectedBarcode(barcode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleQuickAddCopy = () => {
    if (!onAddCopy) return;
    const accession = `BPL-${String(Date.now()).slice(-6)}`;
    const newCopy: PhysicalCopy = {
      copyId: `cp-${Date.now()}`,
      accessionNumber: accession,
      barcode: accession,
      shelfLocation: book.copies[0]?.shelfLocation || 'General Stack',
      classification: book.classification,
      condition: 'New',
      status: 'Available',
      dateAdded: new Date().toISOString().split('T')[0]
    };
    onAddCopy(book.id, newCopy);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '800px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '4px' }}>
              {book.category}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{book.title}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px'
              }}
            >
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Layers size={40} color="var(--text-subtle)" />
              )}
            </div>

            <div>
              {book.subtitle && (
                <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {book.subtitle}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Author:</span>{' '}
                  <strong>{book.author}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ISBN:</span>{' '}
                  <code style={{ fontSize: '12px' }}>{book.isbn}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Publisher:</span>{' '}
                  <strong>{book.publisher} ({book.publicationYear})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Classification:</span>{' '}
                  <span className="badge badge-neutral">{book.classification}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Language / Pages:</span>{' '}
                  {book.language} • {book.pages} pp.
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Copies Status:</span>{' '}
                  <span className={`badge ${isAvailable ? 'badge-success' : 'badge-warning'}`}>
                    {availableCopies} of {book.copies.length} Available
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                {book.description || 'No summary provided.'}
              </div>
            </div>
          </div>

          {/* Physical Copies / Barcodes Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 600 }}>Physical Inventory Copies</h4>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Each copy has an individual Accession Number and scannable barcode
                </div>
              </div>
              {userRole !== 'member' && onAddCopy && (
                <button onClick={handleQuickAddCopy} className="btn btn-secondary btn-sm">
                  <Plus size={14} />
                  <span>Add Physical Copy</span>
                </button>
              )}
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Accession #</th>
                    <th>Shelf Location</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Barcode</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {book.copies.map((copy) => (
                    <tr key={copy.copyId}>
                      <td>
                        <code style={{ fontWeight: 600 }}>{copy.accessionNumber}</code>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{copy.shelfLocation}</td>
                      <td>
                        <span className="badge badge-neutral">{copy.condition}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            copy.status === 'Available'
                              ? 'badge-success'
                              : copy.status === 'Borrowed'
                              ? 'badge-info'
                              : 'badge-warning'
                          }`}
                        >
                          {copy.status}
                        </span>
                      </td>
                      <td>
                        <BarcodeSvg value={copy.barcode} height={24} showText={false} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {userRole !== 'member' ? (
                          <button
                            onClick={() => handlePrintBarcode(copy.barcode)}
                            className="btn btn-ghost btn-sm"
                            title="Print Barcode Label"
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </button>
                        ) : copy.status === 'Available' && onRequestBorrow ? (
                          <button
                            onClick={() => {
                              onRequestBorrow(book, copy);
                              onClose();
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11.5px' }}
                            title="Borrow this physical copy"
                          >
                            Borrow Copy
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                            {copy.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {userRole === 'member' && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Borrow requests and reservations require Admin / Librarian approval.
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {userRole === 'member' && (
              <>
                <button
                  onClick={() => {
                    if (onReserveBook) onReserveBook(book);
                    onClose();
                  }}
                  className="btn btn-secondary"
                  title="Place a reservation hold on this title"
                >
                  <Bookmark size={15} />
                  <span>Reserve Book</span>
                </button>
                <button
                  onClick={() => {
                    if (onRequestBorrow) onRequestBorrow(book);
                    onClose();
                  }}
                  className="btn btn-primary"
                  disabled={!isAvailable}
                  title={isAvailable ? 'Submit borrow request for this book' : 'No copies currently available on shelf'}
                >
                  <BookOpen size={15} />
                  <span>{isAvailable ? 'Request to Borrow' : 'Copies Unavailable'}</span>
                </button>
              </>
            )}
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Hidden printable barcode area */}
      {selectedBarcode && (
        <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
          <div className="barcode-sticker printable-card" style={{ padding: 20 }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>BALINGASAG PUBLIC LIBRARY</div>
            <div style={{ fontSize: '11px', marginBottom: '8px' }}>{book.title.slice(0, 30)}...</div>
            <BarcodeSvg value={selectedBarcode} height={40} showText={true} />
            <div style={{ fontSize: '10px', marginTop: '4px' }}>{book.classification}</div>
          </div>
        </div>
      )}
    </div>
  );
};
