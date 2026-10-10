import React, { useState, useEffect } from 'react';
import type { Book } from '../../types';
import { X, Sparkles, Save, BookOpen } from 'lucide-react';

interface EditBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onBookUpdated: (updatedBook: Book) => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onBookUpdated
}) => {
  // Form State
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [isbn, setIsbn] = useState<string>('');
  const [accessionNumber, setAccessionNumber] = useState<string>('');
  const [format, setFormat] = useState<string>('Paperback');
  const [availability, setAvailability] = useState<string>('Available');
  const [category, setCategory] = useState<string>('General Reference');
  const [classification, setClassification] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [pages, setPages] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [subject, setSubject] = useState<string>('');

  useEffect(() => {
    if (book && isOpen) {
      setTitle(book.title || '');
      setSubtitle(book.subtitle || '');
      setAuthor(book.author || '');
      setPublisher(book.publisher || '');
      setPublicationYear(book.publicationYear || new Date().getFullYear());
      setIsbn(book.isbn || '');
      setAccessionNumber(book.accessionNumber || book.copies?.[0]?.accessionNumber || '');
      setFormat(book.format || 'Paperback');
      setAvailability(book.availability || 'Available');
      setCategory(book.category || 'General Reference');
      setClassification(book.classification || '');
      setLanguage(book.language || 'English');
      setPages(book.pages || 0);
      setDescription(book.description || '');
      setSubject(book.subject || '');
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const generateAutoDescription = (): string => {
    const cleanTitle = title.trim() || 'This publication';
    const cleanAuthor = author.trim() ? ` by ${author.trim()}` : '';
    const p = publisher.trim() ? ` published by ${publisher.trim()}` : '';
    const y = publicationYear ? ` (${publicationYear})` : '';
    const c = category || 'General Reference';
    const s = subject.trim() ? ` focusing on ${subject.trim()}` : '';

    return `"${cleanTitle}"${cleanAuthor} is a comprehensive library volume in ${c}${s}${p}${y}. Maintained at Balingasag Municipal Library for scholarly research, educational reference, and public reading.`;
  };

  const handleAutoGenerate = () => {
    if (!title.trim() && !author.trim()) {
      alert('Please enter a Title or Author to auto-generate a description.');
      return;
    }
    setDescription(generateAutoDescription());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      alert('Please provide at least a Title and Author.');
      return;
    }

    const updatedCopies = book.copies.map((copy, index) => {
      const copyAcc = index === 0 && accessionNumber.trim() ? accessionNumber.trim() : copy.accessionNumber;
      return {
        ...copy,
        accessionNumber: copyAcc,
        barcode: copyAcc,
        classification: classification.trim() || copy.classification,
        format: format,
        status: availability === 'Archived' ? ('Archived' as const) : copy.status
      };
    });

    const updatedBook: Book = {
      ...book,
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      publicationYear: Number(publicationYear),
      isbn: isbn.trim(),
      accessionNumber: accessionNumber.trim() || book.accessionNumber,
      format: format,
      availability: availability,
      category: category.trim(),
      classification: classification.trim(),
      language: language.trim(),
      pages: Number(pages),
      description: description.trim(),
      subject: subject.trim(),
      isArchived: availability === 'Archived' ? true : book.isArchived,
      copies: updatedCopies
    };

    onBookUpdated(updatedBook);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '750px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(22, 101, 52, 0.1)', color: 'var(--brand-forest)' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Edit Book Record</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Update bibliographic metadata, accession information, and availability status
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Title & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Book Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Primary book title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Technology & Computing">Technology & Computing</option>
                  <option value="Literature & Fiction">Literature & Fiction</option>
                  <option value="History & Anthropology">History & Anthropology</option>
                  <option value="Science & Mathematics">Science & Mathematics</option>
                  <option value="General Reference">General Reference</option>
                  <option value="Filipiniana & Local Heritage">Filipiniana & Local Heritage</option>
                  <option value="Philosophy & Psychology">Philosophy & Psychology</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="English War stories">English War stories</option>
                </select>
              </div>
            </div>

            {/* Author & Publisher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Author(s) *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input
                  type="text"
                  className="form-input"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="Publishing house"
                />
              </div>
            </div>

            {/* Year, Format, Availability */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Publication Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Format *</label>
                <select
                  className="form-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="Paperback">Paperback</option>
                  <option value="Hardcover">Hardcover</option>
                  <option value="eBook">eBook</option>
                  <option value="Periodical / Journal">Periodical / Journal</option>
                  <option value="Reference Material">Reference Material</option>
                  <option value="Thesis / Manuscript">Thesis / Manuscript</option>
                  <option value="Spiral-bound">Spiral-bound</option>
                  <option value="Audio-Visual">Audio-Visual</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Availability *</label>
                <select
                  className="form-select"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Borrowed">Borrowed</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Reference Only">Reference Only</option>
                  <option value="Archived">Archived</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* ISBN, Accession Number, Classification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">ISBN *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="ISBN-10 or 13"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Accession Number *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  placeholder="e.g. ACC-000001"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Classification (DDC)</label>
                <input
                  type="text"
                  className="form-input"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="e.g. 025.4 MAR"
                />
              </div>
            </div>

            {/* Description / Abstract with Auto-Generate */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Description / Abstract</label>
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: '11.5px',
                    padding: '3px 9px',
                    gap: '5px',
                    color: 'var(--brand-forest)',
                    fontWeight: 600,
                    height: '26px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid rgba(22, 101, 52, 0.25)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(22, 101, 52, 0.05)',
                    cursor: 'pointer'
                  }}
                  title="Auto-generate an updated summary based on current book details"
                >
                  <Sparkles size={13} />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bibliographic summary or abstract"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
