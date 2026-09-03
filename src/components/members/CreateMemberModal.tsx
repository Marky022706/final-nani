import React, { useState, useEffect } from 'react';
import type { Member, User, AccountStatus } from '../../types';
import { QrCodeSvg } from '../../utils/qr';
import {
  X,
  UserPlus,
  KeyRound,
  Sparkles,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail
} from 'lucide-react';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (newMember: Member, newUser: User, temporaryPassword?: string) => void;
  existingCount: number;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberCreated,
  existingCount
}) => {
  // Step State: 1 = Personal Info, 2 = Contact & Membership, 3 = Account Credentials
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Member Personal Information
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Member['gender']>('Female');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // Step 2: Contact & Membership
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+63 9');
  const [address, setAddress] = useState('Balingasag, Misamis Oriental');
  const [membershipType, setMembershipType] = useState<Member['membershipType']>('Student');
  const [membershipStatus, setMembershipStatus] = useState<AccountStatus>('active');

  // Step 3: Account Credentials
  const [username, setUsername] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Error & validation message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate next Member ID: BPL-2026-XXXX
  const currentYear = new Date().getFullYear();
  const nextSeq = String(existingCount + 1).padStart(4, '0');
  const generatedMemberId = `BPL-${currentYear}-${nextSeq}`;

  // Helper: auto-generate temporary password
  function generateRandomPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setDateOfBirth('2004-01-01');
      setGender('Female');
      setAddress('Balingasag, Misamis Oriental');
      setPhone('+63 9');
      setEmail('');
      setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setMembershipType('Student');
      setMembershipStatus('active');
      setUsername('');
      const autoPass = generateRandomPassword();
      setTemporaryPassword(autoPass);
      setConfirmPassword(autoPass);
      setShowPassword(false);
      setErrorMsg(null);
    }
  }, [isOpen, existingCount]);

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setTemporaryPassword(newPass);
    setConfirmPassword(newPass);
    setShowPassword(true);
  };

  // Sync username suggestion if empty
  const handleNameBlur = () => {
    if (!username && (firstName || lastName)) {
      const suggested = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}`;
      if (suggested !== '.') {
        setUsername(suggested);
      }
    }
  };

  if (!isOpen) return null;

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    setErrorMsg(null);
    if (!firstName.trim()) {
      setErrorMsg('Please enter the member first name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Please enter the member last name.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleNextFromStep2 = () => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address for account credentials.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please provide a valid email format (e.g. name@example.com).');
      return;
    }
    // Auto-fill username if not set
    if (!username.trim()) {
      const suggested = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}`;
      setUsername(suggested !== '.' ? suggested : email.split('@')[0]);
    }
    setCurrentStep(3);
  };

  // Step 3 Final Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (temporaryPassword && temporaryPassword !== confirmPassword) {
      setErrorMsg('Temporary password and confirmation do not match.');
      return;
    }

    const computedFullName = middleName.trim()
      ? `${firstName.trim()} ${middleName.trim()} ${lastName.trim()}`
      : `${firstName.trim()} ${lastName.trim()}`;

    const newMemberId = generatedMemberId;
    const finalUsername = username.trim() || email.trim();
    const finalPassword = temporaryPassword || generateRandomPassword();
    const userId = `usr-mbr-${Date.now()}`;

    const newMember: Member = {
      id: `mbr-${Date.now()}`,
      userId,
      memberId: newMemberId,
      fullName: computedFullName,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      username: finalUsername,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      membershipType,
      status: membershipStatus,
      photoUrl:
        photoUrl.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      qrCodeData: newMemberId,
      joinDate: new Date().toISOString().split('T')[0],
      totalBorrows: 0
    };

    const newUser: User = {
      id: userId,
      name: computedFullName,
      email: email.trim(),
      username: finalUsername,
      password: finalPassword,
      role: 'member', // Strictly assigned to 'member'
      status: membershipStatus,
      createdAt: new Date().toISOString().split('T')[0],
      memberId: newMemberId,
      phone: phone.trim(),
      address: address.trim(),
      mustChangePassword: true
    };

    onMemberCreated(newMember, newUser, finalPassword);
  };

  const stepsList = [
    { number: 1, title: 'Personal Info', desc: 'Identity & Details', icon: UserIcon },
    { number: 2, title: 'Contact & Type', desc: 'Address & Category', icon: Mail },
    { number: 3, title: 'Credentials & QR', desc: 'Login & Verification', icon: KeyRound }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '680px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="stat-icon"
              style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--brand-forest)' }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Create Member Account</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Step {currentStep} of 3 • Admin patron registration & scannable optical card issuance
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* STEP INDICATOR TRACKER */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-main)',
            padding: '16px 28px',
            position: 'relative'
          }}
        >
          {/* Connecting Track Line */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              left: '70px',
              right: '70px',
              height: '3px',
              backgroundColor: 'var(--border-main)',
              zIndex: 0
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--brand-forest)',
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1
            }}
          >
            {stepsList.map((step) => {
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.number}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: isCompleted ? 'pointer' : 'default',
                    minWidth: '110px'
                  }}
                  onClick={() => {
                    if (isCompleted) {
                      setCurrentStep(step.number as 1 | 2 | 3);
                    }
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted || isActive ? 'var(--brand-forest)' : '#ffffff',
                      color: isCompleted || isActive ? '#ffffff' : 'var(--text-muted)',
                      border: isActive
                        ? '3px solid #a7f3d0'
                        : isCompleted
                        ? '2px solid var(--brand-forest)'
                        : '2px solid var(--border-main)',
                      boxShadow: isActive ? '0 0 0 4px rgba(6, 78, 59, 0.18)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '6px',
                      fontWeight: 700,
                      fontSize: '13px',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <StepIcon size={16} />}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--brand-forest)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                      textAlign: 'center'
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-subtle)',
                      textAlign: 'center'
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '22px 24px', flex: 1 }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="step-fade-in">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border-main)',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Step 1: Personal Details
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Required fields marked with *</span>
                </div>

                {/* Name Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="form-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={handleNameBlur}
                      placeholder="e.g. Maria"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Clara"
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
                      onBlur={handleNameBlur}
                      placeholder="e.g. Santos"
                    />
                  </div>
                </div>

                {/* DOB and Gender */}
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

                {/* Profile Photo */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Profile Photo URL (Optional)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <img
                      src={photoUrl}
                      alt="Preview"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--border-main)',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Used on the official physical and digital optical Member Card.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & MEMBERSHIP */}
            {currentStep === 2 && (
              <div className="step-fade-in">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border-main)',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Step 2: Contact & Membership Classification
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contact info & account status</span>
                </div>

                {/* Email and Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patron@example.com"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 9..."
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Complete Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Barangay / Municipality"
                  />
                </div>

                {/* Membership Type & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
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
                    <label className="form-label">Membership Status</label>
                    <select
                      className="form-select"
                      value={membershipStatus}
                      onChange={(e) => setMembershipStatus(e.target.value as AccountStatus)}
                    >
                      <option value="active">Active (Can log in & borrow)</option>
                      <option value="inactive">Inactive (Account locked)</option>
                      <option value="suspended">Suspended (Disciplinary lock)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ACCOUNT CREDENTIALS & REVIEW */}
            {currentStep === 3 && (
              <div className="step-fade-in">
                {/* Auto-Generated Member ID Banner with QR */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '18px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#166534',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Automatic Unique Member ID
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', fontFamily: 'var(--font-mono)' }}>
                      {generatedMemberId}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#16a34a' }}>
                      Associated with patron's account and optical card
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCodeSvg value={generatedMemberId} size={48} />
                  </div>
                </div>

                {/* Account Credentials Box */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={15} color="var(--brand-forest)" />
                      <span>Account Login Credentials</span>
                    </div>
                    <span className="badge badge-success" style={{ textTransform: 'none' }}>
                      Role: Member (System Assigned)
                    </span>
                  </div>

                  {/* Username */}
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Username (or Email)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. maria.santos"
                    />
                  </div>

                  {/* Temporary Password with Generate Button */}
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}
                    >
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Temporary Password *
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', height: '26px', fontSize: '11.5px', gap: '4px' }}
                      >
                        <Sparkles size={13} color="var(--brand-forest)" />
                        <span>Generate Temporary Password</span>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        value={temporaryPassword}
                        onChange={(e) => setTemporaryPassword(e.target.value)}
                        placeholder="Temporary password"
                        style={{ paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat temporary password"
                    />
                  </div>
                </div>

                {/* Review Summary Checklist */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Summary Review:
                  </div>
                  <div>
                    • Patron Name: <strong>{firstName} {middleName} {lastName}</strong>
                  </div>
                  <div>
                    • Email: <strong>{email}</strong> | Contact: <strong>{phone || 'None'}</strong>
                  </div>
                  <div>
                    • Type: <strong>{membershipType}</strong> | Status: <strong>{membershipStatus.toUpperCase()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer with Step Navigation */}
          <div
            className="modal-footer"
            style={{
              borderTop: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {/* Left Action: Cancel or Back */}
            {currentStep === 1 ? (
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="btn btn-secondary"
                style={{ gap: '6px' }}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            )}

            {/* Right Action: Next or Create */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="btn btn-primary"
                style={{ gap: '6px' }}
              >
                <span>Continue to Contact</span>
                <ArrowRight size={15} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="btn btn-primary"
                style={{ gap: '6px' }}
              >
                <span>Continue to Credentials</span>
                <ArrowRight size={15} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ gap: '6px', boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.25)' }}
              >
                <UserPlus size={15} />
                <span>Create Account & Generate QR</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
