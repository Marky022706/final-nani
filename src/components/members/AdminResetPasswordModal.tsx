import React, { useState } from 'react';
import type { Member } from '../../types';
import { X, KeyRound, Sparkles, Copy, Check, ShieldAlert } from 'lucide-react';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onConfirmReset: (memberId: string, newPassword: string) => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  isOpen,
  onClose,
  member,
  onConfirmReset
}) => {
  const [newPassword, setNewPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  if (!isOpen || !member) return null;

  const handleGenerate = () => {
    setNewPassword(generatePassword());
    setIsSaved(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onConfirmReset(member.memberId, newPassword);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
      setIsSaved(false);
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Reset Member Password</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Issue a new temporary credential for {member.fullName}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '13px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Member Name:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{member.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Member ID:</span>
              <code style={{ fontWeight: 600 }}>{member.memberId}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email:</span>
              <span>{member.email}</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>New Temporary Password</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11.5px', height: '24px', padding: '0 6px', gap: '4px' }}
              >
                <Sparkles size={12} color="var(--brand-forest)" />
                <span>Regenerate</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em' }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{ padding: '0 12px' }}
                title="Copy Password"
              >
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#92400e',
              lineHeight: 1.45
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              The member must use this temporary password to log in. Please securely convey this password to the patron.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved || !newPassword.trim()}
            className="btn btn-primary"
          >
            {isSaved ? (
              <>
                <Check size={15} />
                <span>Password Updated!</span>
              </>
            ) : (
              <>
                <KeyRound size={15} />
                <span>Save New Temporary Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
