import React, { useState } from 'react';
import type { Member, Book } from '../../types';
import { X, QrCode, Barcode } from 'lucide-react';
import { CameraScanner } from '../common/CameraScanner';

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
  books: _books,
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
          {/* Real Camera Scanner */}
          <CameraScanner
            scannerId="circulation-quick-cam-scanner"
            mode={mode === 'member_qr' ? 'qr' : 'barcode'}
            isActive={isOpen}
            label={mode === 'member_qr' ? 'Align patron QR code in viewfinder' : 'Align book barcode in viewfinder'}
            onScan={(detectedCode) => {
              handleSimulateScan(detectedCode, detectedCode);
            }}
          />

          {detectedFeedback && (
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 12px',
                backgroundColor: 'var(--brand-forest)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {detectedFeedback}
            </div>
          )}

          {/* Quick Member / Book Simulator Chips */}
          {mode === 'member_qr' && members && members.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Quick Patron Test Chips:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {members.slice(0, 5).map((m) => (
                  <button
                    key={m.id || m.memberId}
                    type="button"
                    onClick={() => handleSimulateScan(m.memberId, m.fullName)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11.5px', padding: '4px 8px' }}
                  >
                    <span>{m.fullName.split(' ')[0]}</span>
                    <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({m.memberId})</code>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} style={{ marginBottom: '8px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              {mode === 'member_qr' ? 'Or enter Member ID / QR code data' : 'Or enter Barcode / Accession Number'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={mode === 'member_qr' ? 'e.g. BPL-2026-0001 or MBR-000001' : 'e.g. BPL-000101'}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" style={{ minWidth: '90px' }}>
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
