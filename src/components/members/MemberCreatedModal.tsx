import React, { useState } from 'react';
import type { Member } from '../../types';
import { QrCodeSvg, downloadQrCode, printQrCode } from '../../utils/qr';
import { CheckCircle2, Copy, Check, Printer, Download, UserPlus, Eye, X } from 'lucide-react';

interface MemberCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  temporaryPassword?: string;
  onViewMember: (member: Member) => void;
  onPrintCard: (member: Member) => void;
  onCreateAnother: () => void;
}

export const MemberCreatedModal: React.FC<MemberCreatedModalProps> = ({
  isOpen,
  onClose,
  member,
  temporaryPassword,
  onViewMember,
  onPrintCard,
  onCreateAnother
}) => {
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen || !member) return null;

  const handleCopyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleCopyAll = () => {
    const text = `Balingasag Public Library - Member Credentials
Member Name: ${member.fullName}
Member ID: ${member.memberId}
Email: ${member.email}
Username: ${member.username || member.email}
Temporary Password: ${temporaryPassword || 'N/A'}
Status: ${member.status.toUpperCase()}
Note: Please change your password after initial login.`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadQr = () => {
    downloadQrCode(member.memberId, `qr-${member.memberId}.svg`);
  };

  const handlePrintQr = () => {
    printQrCode(member.memberId, member.fullName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Member Account Created Successfully
              </h3>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Credentials and optical identification token generated
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: '16px' }}>
          {/* Main Summary Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '16px' }}>
              <div data-qr-value={member.memberId} className="qr-modal-svg">
                <QrCodeSvg value={member.memberId} size={92} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Official Member ID
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-forest)', fontFamily: 'var(--font-mono)' }}>
                  {member.memberId}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {member.fullName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {member.email}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span
                    className={`badge ${
                      member.status === 'active'
                        ? 'badge-success'
                        : member.status === 'inactive'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    STATUS: {member.status.toUpperCase()}
                  </span>
                  <span className="badge badge-neutral" style={{ marginLeft: '6px' }}>
                    {member.membershipType}
                  </span>
                </div>
              </div>
            </div>

            {/* Credential summary table */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Username:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.username || member.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Assigned Role:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-forest)' }}>Member (Patron)</span>
              </div>
              {temporaryPassword && (
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Temp Password:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code
                      style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', height: '26px', fontSize: '11px' }}
                      title="Copy Temporary Password"
                    >
                      {copiedPass ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Copy full credentials snippet button */}
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={handleCopyAll}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', gap: '5px' }}
              >
                {copiedAll ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copiedAll ? 'Credentials Copied to Clipboard' : 'Copy Full Credentials Details'}</span>
              </button>
            </div>
          </div>

          {/* Quick QR Utilities */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px'
            }}
          >
            <button
              type="button"
              onClick={handleDownloadQr}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Download size={14} />
              <span>Download QR Code</span>
            </button>
            <button
              type="button"
              onClick={handlePrintQr}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Printer size={14} />
              <span>Print QR Code</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            onClick={onCreateAnother}
            className="btn btn-secondary"
          >
            <UserPlus size={15} />
            <span>Create Another Member</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onPrintCard(member)}
              className="btn btn-secondary"
            >
              <Printer size={15} />
              <span>Print Member Card</span>
            </button>
            <button
              type="button"
              onClick={() => onViewMember(member)}
              className="btn btn-primary"
            >
              <Eye size={15} />
              <span>View Member</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
