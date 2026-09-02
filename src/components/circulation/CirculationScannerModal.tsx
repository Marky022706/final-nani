import React, { useState } from 'react';
import type { Member, Book } from '../../types';
import { X, QrCode, Barcode, Camera } from 'lucide-react';

interface CirculationScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'member_qr' | 'book_barcode';
  members: Member[];
  books: Book[];
  onCodeDetected: (code: string) => void;
}

export const CirculationScannerModal: React.FC<CirculationScannerModalProps> = ({
  isOpen,
  onClose,
  mode,
  members,
  books,
  onCodeDetected
}) => {
  const [manualInput, setManualInput] = useState('');
  const [detectedFeedback, setDetectedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (code: string, label: string) => {
    setDetectedFeedback(`✓ Detected: ${label} (${code})`);
    setTimeout(() => {
      onCodeDetected(code);
      setDetectedFeedback(null);
      onClose();
    }, 350);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleSimulateScan(manualInput.trim().toUpperCase(), manualInput.trim().toUpperCase());
    setManualInput('');
  };

  // Collect physical copies for quick book selection
  const allCopies = books.flatMap((b) =>
    b.copies.map((c) => ({
      ...c,
      bookTitle: b.title,
      author: b.author,
      isbn: b.isbn
    }))
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '95%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: 'var(--accent-blue-light)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mode === 'member_qr' ? <QrCode size={20} /> : <Barcode size={20} />}
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '17px', fontWeight: 700 }}>
                {mode === 'member_qr' ? 'Scan Member Library QR' : 'Scan Book Physical Barcode'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {mode === 'member_qr'
                  ? 'Position the digital or printed member card QR code in front of scanner'
                  : 'Scan the barcode on the back cover or inside flap of the book'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Simulated Scanner Viewport */}
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 20px',
              textAlign: 'center',
              color: '#ffffff',
              marginBottom: '16px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {/* Viewfinder Target Box */}
            <div
              style={{
                width: '200px',
                height: mode === 'member_qr' ? '180px' : '110px',
                margin: '0 auto',
                border: '2px dashed #10b981',
                borderRadius: '12px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(16, 185, 129, 0.05)'
              }}
            >
              {/* Laser Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 8px #ef4444'
                }}
              />

              {mode === 'member_qr' ? (
                <QrCode size={56} style={{ opacity: 0.7, color: '#10b981' }} />
              ) : (
                <Barcode size={56} style={{ opacity: 0.7, color: '#10b981' }} />
              )}
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', zIndex: 2 }}>
                {mode === 'member_qr' ? 'Align Patron QR Code' : 'Align Book Barcode'}
              </span>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Camera size={14} />
              <span>Camera feed active • Auto-detecting code</span>
            </div>

            {detectedFeedback && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#065f46',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}
              >
                {detectedFeedback}
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              {mode === 'member_qr' ? 'Or enter Member ID / Name' : 'Or enter Barcode / Accession'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={mode === 'member_qr' ? 'e.g. MBR-000001 or Juan' : 'e.g. BPL-000101'}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ minWidth: '90px' }}>
                Search
              </button>
            </div>
          </form>

          {/* Quick Select demo chips */}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {mode === 'member_qr' ? 'Quick Pick Patron for Demo:' : 'Quick Pick Book Copy on Shelf:'}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '160px',
                overflowY: 'auto'
              }}
            >
              {mode === 'member_qr'
                ? members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSimulateScan(m.memberId, m.fullName)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{m.fullName}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({m.memberId})</span>
                      </div>
                      <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                        {m.status}
                      </span>
                    </button>
                  ))
                : allCopies.map((c) => (
                    <button
                      key={c.barcode}
                      type="button"
                      onClick={() => handleSimulateScan(c.barcode, c.bookTitle)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.bookTitle}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                          <code>{c.barcode}</code> ({c.accessionNumber})
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          c.status === 'Available'
                            ? 'badge-success'
                            : c.status === 'Borrowed'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {c.status}
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
