import React, { useState } from 'react';
import type { Book, PhysicalCopy } from '../../types';
import { StorageService } from '../../utils/storage';
import { BarcodeSvg } from '../../utils/barcode';
import { X, Sparkles, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: (newBook: Book) => void;
  existingBooksCount: number;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onBookAdded,
  existingBooksCount
}) => {
  const [isbnInput, setIsbnInput] = useState<string>('978-0132350884');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');
  const [publicationYear, setPublicationYear] = useState<number>(2024);
  const [edition, setEdition] = useState<string>('1st Edition');
  const [language, setLanguage] = useState<string>('English');
  const [description, setDescription] = useState<string>('');
  const [pages, setPages] = useState<number>(300);
  const [category, setCategory] = useState<string>('General Reference');
  const [subject, setSubject] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('reference, library');
  const [classification, setClassification] = useState<string>('000 GEN');
  const [shelfLocation, setShelfLocation] = useState<string>('Stack A-1');
  const [initialCopiesCount, setInitialCopiesCount] = useState<number>(2);

  if (!isOpen) return null;

  const handleIsbnLookup = async () => {
    if (!isbnInput.trim()) {
      setLookupMessage({ type: 'warning', text: 'Please enter an ISBN to lookup.' });
      return;
    }

    setIsLookingUp(true);
    setLookupMessage(null);

    try {
      const res = await StorageService.lookupIsbnWithLlm(isbnInput.trim());
      if (res.success && res.data) {
        const d = res.data;
        setTitle(d.title || '');
        setSubtitle(d.subtitle || '');
        setAuthor(d.author || '');
        setPublisher(d.publisher || '');
        setPublicationYear(d.publicationYear || 2024);
        setEdition(d.edition || '1st Edition');
        setLanguage(d.language || 'English');
        setDescription(d.description || '');
        setPages(d.pages || 300);
        setCategory(d.category || 'General Reference');
        setSubject(d.subject || '');
        setKeywords(d.keywords ? d.keywords.join(', ') : '');
        setClassification(d.classification || '000 GEN');

        setLookupMessage({
          type: 'success',
          text: '✓ Book information found via LLM Studio API. Please review all fields before saving.'
        });
      } else {
        setLookupMessage({
          type: 'warning',
          text: res.message || 'Book metadata not found. You can enter details manually.'
        });
      }
    } catch {
      setLookupMessage({
        type: 'error',
        text: 'ISBN lookup service unavailable. Please continue manually.'
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      alert('Please provide at least a title and author.');
      return;
    }

    const nextBookNum = existingBooksCount + 1;
    const baseAccessionNum = 100 + nextBookNum * 10;

    // Generate physical copies
    const copies: PhysicalCopy[] = [];
    for (let i = 0; i < initialCopiesCount; i++) {
      const accession = `BPL-${String(baseAccessionNum + i).padStart(6, '0')}`;
      copies.push({
        copyId: `cp-${Date.now()}-${i}`,
        accessionNumber: accession,
        barcode: accession,
        shelfLocation: shelfLocation || 'General Stacks',
        classification: classification || '000 GEN',
        condition: 'New',
        status: 'Available',
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    const newBook: Book = {
      id: `bk-${Date.now()}`,
      isbn: isbnInput.trim() || `978-00000000${nextBookNum}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      publicationYear: Number(publicationYear),
      edition: edition.trim(),
      language: language.trim(),
      description: description.trim(),
      pages: Number(pages),
      category: category.trim(),
      subject: subject.trim(),
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      classification: classification.trim(),
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      copies
    };

    onBookAdded(newBook);
    onClose();
  };

  const previewAccession = `BPL-${String(100 + (existingBooksCount + 1) * 10).padStart(6, '0')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '750px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Catalog New Book</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ISBN LLM Studio Assisted Metadata & Barcode Generation
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* ISBN Lookup Bar */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-main)',
                marginBottom: '20px'
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                ISBN Assisted Cataloging (LLM Studio API)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 978-0132350884 or 978-0201616224"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  disabled={isLookingUp}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  className="btn btn-primary"
                  disabled={isLookingUp}
                  style={{ minWidth: '150px' }}
                >
                  {isLookingUp ? (
                    <span>Looking up...</span>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Lookup ISBN</span>
                    </>
                  )}
                </button>
              </div>

              {lookupMessage && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor:
                      lookupMessage.type === 'success'
                        ? 'var(--success-bg)'
                        : lookupMessage.type === 'warning'
                        ? 'var(--warning-bg)'
                        : 'var(--danger-bg)',
                    color:
                      lookupMessage.type === 'success'
                        ? 'var(--success)'
                        : lookupMessage.type === 'warning'
                        ? 'var(--warning)'
                        : 'var(--danger)',
                    border: `1px solid ${
                      lookupMessage.type === 'success'
                        ? 'var(--success-border)'
                        : lookupMessage.type === 'warning'
                        ? 'var(--warning-border)'
                        : 'var(--danger-border)'
                    }`
                  }}
                >
                  {lookupMessage.type === 'success' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{lookupMessage.text}</span>
                </div>
              )}
            </div>

            {/* Bibliographic Form */}
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
                <label className="form-label">Category</label>
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
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <input
                  type="text"
                  className="form-input"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Subtitle or edition notes"
                />
              </div>

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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input
                  type="text"
                  className="form-input"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                />
              </div>
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
                <label className="form-label">Classification (DDC)</label>
                <input
                  type="text"
                  className="form-input"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="e.g. 005.133 MAR"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Abstract</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bibliographic summary"
              />
            </div>

            {/* Physical Copies Section */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-main)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={initialCopiesCount}
                  onChange={(e) => setInitialCopiesCount(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Shelf Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  placeholder="e.g. Stack A-2"
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Barcode Preview (Accession #)
                </div>
                <BarcodeSvg value={previewAccession} height={32} showText={true} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <BookOpen size={16} />
              <span>Save & Generate Copies</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
