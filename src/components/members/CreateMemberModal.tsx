import React, { useState } from 'react';
import type { Member } from '../../types';
import { QrCodeSvg } from '../../utils/qr';
import { X, UserPlus } from 'lucide-react';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (newMember: Member) => void;
  existingCount: number;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberCreated,
  existingCount
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+63 9');
  const [address, setAddress] = useState('Balingasag, Misamis Oriental');
  const [membershipType, setMembershipType] = useState<Member['membershipType']>('Student');

  if (!isOpen) return null;

  const generatedMemberId = `MBR-${String(existingCount + 1).padStart(6, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('Please fill in member full name and email.');
      return;
    }

    const newMember: Member = {
      id: `mbr-${Date.now()}`,
      memberId: generatedMemberId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      membershipType,
      status: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      qrCodeData: generatedMemberId,
      joinDate: new Date().toISOString().split('T')[0],
      totalBorrows: 0
    };

    onMemberCreated(newMember);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Register Library Member</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Create account and automatically generate unique Member QR Code
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Generated ID preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--border-main)'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Generated Patron Identifier
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {generatedMemberId}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCodeSvg value={generatedMemberId} size={42} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maria Clara Santos"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Barangay / Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Barangay, Municipality"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Membership Type</label>
                <select
                  className="form-select"
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value as Member['membershipType'])}
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty / Teacher</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Community">Community Resident</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={15} />
              <span>Create Account & QR Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
