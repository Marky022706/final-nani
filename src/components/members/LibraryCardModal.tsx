import React from 'react';
import type { Member } from '../../types';
import { QrCodeSvg } from '../../utils/qr';
import { X, Printer, Library } from 'lucide-react';

interface LibraryCardModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryCardModal: React.FC<LibraryCardModalProps> = ({
  member,
  isOpen,
  onClose
}) => {
  if (!isOpen || !member) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Digital Library Card</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Official patron identification for attendance and book circulation
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px' }}>
          {/* Card Presentation */}
          <div className="library-card-wrapper printable-card" style={{ width: '100%' }}>
            <div className="library-card-front">
              <div className="library-card-pattern" />

              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Library size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Balingasag Public Library
                    </div>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                      Municipality of Balingasag, Misamis Oriental
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}
                >
                  {member.membershipType.toUpperCase()}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.25)',
                    backgroundColor: '#334155',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                    {member.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>
                    ID: <strong style={{ color: '#ffffff' }}>{member.memberId}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: 2 }}>
                    Joined: {member.joinDate}
                  </div>
                </div>

                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <QrCodeSvg value={member.memberId} size={70} />
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: '#94a3b8',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '10px'
                }}
              >
                <span>Valid for Library Attendance & Borrowing</span>
                <span>STATUS: {member.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Present this card or QR token at the front desk scanner for Time-In/Time-Out.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={15} />
            <span>Print Library Card</span>
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
