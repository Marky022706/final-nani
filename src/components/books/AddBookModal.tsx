import React, { useState } from 'react';
import type { Book, PhysicalCopy } from '../../types';
import { StorageService } from '../../utils/storage';
import { BarcodeSvg } from '../../utils/barcode';
import { X, Sparkles, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import { useActionLoading } from '../../context/ActionLoadingContext';
import { BookCoverSelector } from './BookCoverSelector';

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
  const { showActionLoading, hideActionLoading } = useActionLoading();
  const [isbnInput, setIsbnInput] = useState<string>('');
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
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [edition, setEdition] = useState<string>('1st Edition');
  const [language, setLanguage] = useState<string>('English');
  const [description, setDescription] = useState<string>('');
  const [pages, setPages] = useState<number>(0);
  const [category, setCategory] = useState<string>('General Reference');
  const [subject, setSubject] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [classification, setClassification] = useState<string>('');
  const [initialCopiesCount, setInitialCopiesCount] = useState<number>(1);
  const [format, setFormat] = useState<string>('Paperback');
  const [accessionNumber, setAccessionNumber] = useState<string>(
    `BPL-ACC-${String(existingBooksCount + 1).padStart(4, '0')}`
  );
  const [availability, setAvailability] = useState<string>('Available');
  const [coverImage, setCoverImage] = useState<string>('');
  const [inlineError, setInlineError] = useState<string | null>(null);

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
        setPublicationYear(d.publicationYear || new Date().getFullYear());
        setEdition(d.edition || '1st Edition');
        setLanguage(d.language || 'English');
        const synthesizedDesc = d.description || generateAutoDescription(
          d.title || '',
          d.author || '',
          d.category || 'General Reference',
          d.publisher || '',
          d.publicationYear || new Date().getFullYear(),
          d.subject || ''
        );
        setDescription(synthesizedDesc);
        setPages(d.pages || 0);
        setCategory(d.category || 'General Reference');
        setSubject(d.subject || '');
        setKeywords(d.keywords ? d.keywords.join(', ') : '');
        setClassification(d.classification || '');
        if (d.coverImage) {
          setCoverImage(d.coverImage);
        }

        setLookupMessage({
          type: 'success',
          text: '✓ Real book information found. Please review all fields before saving.'
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

  const generateAutoDescription = (
    bookTitle = title,
    bookAuthor = author,
    bookCategory = category,
    bookPublisher = publisher,
    year = publicationYear,
    bookSubject = subject
  ): string => {
    const cleanTitle = bookTitle.trim();
    const cleanAuthor = bookAuthor.trim();
    if (!cleanTitle && !cleanAuthor) {
      return '';
    }

    const t = cleanTitle || 'This volume';
    const a = cleanAuthor ? ` by ${cleanAuthor}` : '';
    const p = bookPublisher.trim() ? ` published by ${bookPublisher.trim()}` : '';
    const y = year ? ` (${year})` : '';
    const c = bookCategory || 'General Reference';
    const s = bookSubject.trim() ? ` focusing on ${bookSubject.trim()}` : '';

    return `"${t}"${a} is a comprehensive reference work in ${c}${s}${p}${y}. Cataloged for academic research and municipal library reference at Balingasag Municipal Library, covering foundational concepts, key methodologies, and analytical commentary.`;
  };

  const handleAutoGenerateDescription = () => {
    if (!title.trim() && !author.trim()) {
      setInlineError('Please enter at least a Book Title or Author to auto-generate a description.');
      return;
    }
    setInlineError(null);
    const autoText = generateAutoDescription();
    setDescription(autoText);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setInlineError('Please provide at least a title and author.');
      return;
    }
    setInlineError(null);

    const nextBookNum = existingBooksCount + 1;
    const baseAccessionNum = 100 + nextBookNum * 10;

    const finalAccession = accessionNumber.trim() || `BPL-${String(baseAccessionNum).padStart(6, '0')}`;

    // Generate physical copies
    const copies: PhysicalCopy[] = [];
    for (let i = 0; i < initialCopiesCount; i++) {
      const copyAccession = i === 0 ? finalAccession : `BPL-${String(baseAccessionNum + i).padStart(6, '0')}`;
      copies.push({
        copyId: `cp-${Date.now()}-${i}`,
        accessionNumber: copyAccession,
        barcode: copyAccession,
        classification: classification || '000 GEN',
        condition: 'New',
        status: availability === 'Available' ? 'Available' : (availability as any),
        format: format,
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    const newBook: Book = {
      id: `bk-${Date.now()}`,
      isbn: isbnInput.trim() || `978-00000000${nextBookNum}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      publisher: publisher.trim() || 'General Library Edition',
      publicationYear: Number(publicationYear),
      edition: edition.trim(),
      language: language.trim(),
      description: description.trim(),
      pages: Number(pages),
      category: category.trim(),
      subject: subject.trim(),
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      classification: classification.trim(),
      accessionNumber: finalAccession,
      format: format,
      availability: availability,
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      copies
    };

    showActionLoading({
      title: 'Cataloging Book',
      message: 'Saving book details and generating physical accession copies...'
    });

    try {
      onBookAdded(newBook);
      onClose();
    } finally {
      setTimeout(() => {
        hideActionLoading();
      }, 350);
    }
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
            {inlineError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} color="#DC2626" />
                <span>{inlineError}</span>
              </div>
            )}
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

            {/* Book Cover Image Selection & Preview */}
            <BookCoverSelector
              value={coverImage}
              onChange={setCoverImage}
              title={title}
              author={author}
            />

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
                  placeholder="e.g. Prentice Hall"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                <label className="form-label">Accession Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  placeholder="e.g. BPL-ACC-0001"
                  required
                />
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
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Description / Abstract</label>
                <button
                  type="button"
                  onClick={handleAutoGenerateDescription}
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
                  title="Auto-generate a library summary based on current book details"
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
                placeholder="Bibliographic summary or abstract (or click 'Auto-Generate' to synthesize)"
              />
            </div>

            {/* Physical Copies Section */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-main)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
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
