import React, { useState } from 'react';
import type { Book, PhysicalCopy } from '../../types';
import { BarcodeSvg, downloadBarcodeSvg, printBarcodeLabel } from '../../utils/barcode';
import { X, Printer, Download, Copy, Check, Barcode, ArrowRight } from 'lucide-react';

interface ViewBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  copy: PhysicalCopy | null;
  onTestInCirculation?: (barcode: string) => void;
}

export const ViewBarcodeModal: React.FC<ViewBarcodeModalProps> = ({
  isOpen,
  onClose,
  book,
  copy,
  onTestInCirculation
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !book || !copy) return null;

  const barcodeValue = copy.barcode || copy.accessionNumber || 'BPL-000000';

  const handleCopy = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadBarcodeSvg(barcodeValue, `barcode-${barcodeValue}.svg`);
  };

  const handlePrint = () => {
    printBarcodeLabel({
      barcode: barcodeValue,
      title: book.title,
      author: book.author,
      accessionNumber: copy.accessionNumber,
      classification: copy.classification || book.classification
    });
  };

  const handleTestCirculation = () => {
    if (onTestInCirculation) {
      onTestInCirculation(barcodeValue);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-dialog animate-modal-fade-in"
        style={{ maxWidth: '480px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(22, 101, 52, 0.1)',
                color: 'var(--brand-forest, #166534)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Official Book Barcode Label
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Standard Code 128 • Scannable in Circulation
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
          {/* Printable Sticker Label Preview Box */}
          <div
            style={{
              display: 'inline-block',
              width: '100%',
              maxWidth: '380px',
              padding: '20px 18px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '2px solid #166534',
              boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
              marginBottom: '18px',
              textAlign: 'center'
            }}
          >
            {/* Library Branding Header */}
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Balingasag Public Library
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '10px' }}>
              Official Accession Barcode Tag
            </div>

            {/* Book Details */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.3,
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={book.title}
            >
              {book.title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '12px' }}>
              by {book.author}
            </div>

            {/* Real Code 128 Scannable Barcode SVG */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '8px 0',
                padding: '6px',
                backgroundColor: '#ffffff'
              }}
            >
              <BarcodeSvg
                value={barcodeValue}
                height={55}
                showText={true}
                moduleWidth={1.8}
              />
            </div>

            {/* Meta Row: Call Number & Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '11px',
                color: '#475569'
              }}
            >
              <div>
                Call #: <strong>{copy.classification || book.classification || 'General'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className={`badge ${
                    copy.status === 'Available'
                      ? 'badge-success'
                      : copy.status === 'Borrowed'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}
                  style={{ fontSize: '10px', padding: '1px 6px' }}
                >
                  {copy.status}
                </span>
              </div>
            </div>
          </div>

          {/* Scannable Verification Callout */}
          <div
            style={{
              backgroundColor: 'rgba(22, 101, 52, 0.06)',
              border: '1px solid rgba(22, 101, 52, 0.18)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#166534',
              textAlign: 'left',
              lineHeight: 1.5,
              marginBottom: '16px'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓ Scannable Barcode Guarantee</span>
            </div>
            <div>
              Decodable by camera scanners in Circulation, USB/Bluetooth handheld barcode scanner guns, and mobile optical cameras.
            </div>
          </div>

          {/* Quick Copy & Test Row */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : `Copy: ${barcodeValue}`}</span>
            </button>

            {onTestInCirculation && (
              <button
                type="button"
                onClick={handleTestCirculation}
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: '#166534',
                  borderColor: '#166534',
                  color: '#ffffff',
                  gap: '6px'
                }}
                title="Open Circulation Desk to scan or test this barcode"
              >
                <span>Test in Circulation</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
          >
            <Download size={15} />
            <span>Download SVG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{
              flex: 1,
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: '#166534',
              borderColor: '#166534'
            }}
          >
            <Printer size={15} />
            <span>Print Label Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
