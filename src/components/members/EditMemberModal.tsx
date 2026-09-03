import React, { useState, useEffect } from 'react';
import type { Member, AccountStatus } from '../../types';
import { X, Save, Edit3, Shield } from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSave: (updatedMember: Member) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave
}) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Member['gender']>('Female');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [membershipType, setMembershipType] = useState<Member['membershipType']>('Student');
  const [status, setStatus] = useState<AccountStatus>('active');

  useEffect(() => {
    if (member) {
      // Split full name if individual fields not yet stored
      const nameParts = member.fullName.split(' ');
      setFirstName(member.firstName || nameParts[0] || '');
      setMiddleName(member.middleName || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''));
      setLastName(member.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''));
      setDateOfBirth(member.dateOfBirth || '');
      setGender(member.gender || 'Female');
      setAddress(member.address || '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setPhotoUrl(member.photoUrl || '');
      setMembershipType(member.membershipType);
      setStatus(member.status);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('First Name, Last Name, and Email are required.');
      return;
    }

    const computedFullName = middleName.trim()
      ? `${firstName.trim()} ${middleName.trim()} ${lastName.trim()}`
      : `${firstName.trim()} ${lastName.trim()}`;

    const updated: Member = {
      ...member,
      fullName: computedFullName,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      photoUrl: photoUrl.trim(),
      membershipType,
      status
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--brand-forest)' }}>
              <Edit3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Edit Member Profile</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Member ID: <strong style={{ color: 'var(--brand-forest)', fontFamily: 'var(--font-mono)' }}>{member.memberId}</strong>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
            {/* System Locked Role Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="var(--brand-forest)" />
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Account Role: <strong>Member</strong> (Patron)
                </span>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                Role Fixed (Non-Administrative)
              </span>
            </div>

            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Middle Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* DOB & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Member['gender'])}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Email & Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Membership Type & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Account Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                >
                  <option value="active">Active (Can log in & borrow)</option>
                  <option value="inactive">Inactive (Account locked)</option>
                  <option value="suspended">Suspended (Disciplinary lock)</option>
                </select>
              </div>
            </div>

            {/* Photo URL */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Photo URL</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                <img
                  src={photoUrl}
                  alt="Preview"
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-main)', flexShrink: 0 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
