import React from 'react';
import type { Member } from '../../types';
import { QrCodeSvg, downloadQrCode, printQrCode } from '../../utils/qr';
import { X, Download, Printer, QrCode } from 'lucide-react';

interface ViewQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const ViewQrModal: React.FC<ViewQrModalProps> = ({
  isOpen,
  onClose,
  member
}) => {
  if (!isOpen || !member) return null;

  const handleDownload = () => {
    downloadQrCode(member.memberId, `qr-${member.memberId}.svg`);
  };

  const handlePrint = () => {
    printQrCode(member.memberId, member.fullName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--brand-forest)' }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Official Patron QR Code</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Municipal library identification & scan token
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
          {/* QR Display */}
          <div
            data-qr-value={member.memberId}
            className="qr-modal-svg"
            style={{
              display: 'inline-block',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '2px solid var(--border-main)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              marginBottom: '18px'
            }}
          >
            <QrCodeSvg value={member.memberId} size={180} />
          </div>

          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {member.fullName}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-forest)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            {member.memberId}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
            <span
              className={`badge ${
                member.status === 'active'
                  ? 'badge-success'
                  : member.status === 'inactive'
                  ? 'badge-warning'
                  : 'badge-danger'
              }`}
            >
              {member.status.toUpperCase()}
            </span>
            <span className="badge badge-neutral">{member.membershipType}</span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Supported Operations:
            </div>
            <div>• Front-desk attendance kiosk scanner check-in / check-out</div>
            <div>• Book loans issuing and return barcode verification</div>
            <div>• Library patron resource reservation and verification</div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Download size={15} />
            <span>Download QR Code</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Printer size={15} />
            <span>Print QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
