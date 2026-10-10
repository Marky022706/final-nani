import React, { useState, useEffect, useRef } from 'react';
import type { Member, User, AccountStatus } from '../../types';
import { QrCodeSvg } from '../../utils/qr';
import {
  X,
  UserPlus,
  ClipboardCheck,
  User as UserIcon,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Upload,
  Camera,
  ShieldCheck
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
  // Step State: 1 = Profile & Identity, 2 = Contact & Membership, 3 = Account & QR Issuance
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Auto-generate next Member ID: BPL-YYYY-XXXX
  const currentYear = new Date().getFullYear();
  const nextSeq = String(existingCount + 1).padStart(4, '0');
  const defaultMemberId = `BPL-${currentYear}-${nextSeq}`;

  // Required Member Profile Information
  const [memberId, setMemberId] = useState(defaultMemberId);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2004-01-01');
  const [sex, setSex] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [address, setAddress] = useState('Poblacion, Balingasag, Misamis Oriental');
  const [contactNumber, setContactNumber] = useState('+63 9');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<AccountStatus>('active');
  const [dateRegistered, setDateRegistered] = useState(new Date().toISOString().split('T')[0]);
  const [membershipType, setMembershipType] = useState<Member['membershipType']>('Student');

  // Account Credentials (no member sign-in UI exists anymore - kept only as
  // the internal default assigned when the linked user record is created)
  const DEFAULT_MEMBER_PASSWORD = 'P@ssword123';
  const [username, setUsername] = useState('');

  // Validation message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setMemberId(defaultMemberId);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setSuffix('');
      setDateOfBirth('2004-01-01');
      setSex('Female');
      setAddress('Poblacion, Balingasag, Misamis Oriental');
      setContactNumber('+63 9');
      setEmail('');
      setProfilePhoto('');
      setMembershipStatus('active');
      setDateRegistered(new Date().toISOString().split('T')[0]);
      setMembershipType('Student');
      setUsername('');
      setErrorMsg(null);
    }
  }, [isOpen, existingCount]);

  // Sync username suggestion if empty
  const handleNameBlur = () => {
    if (!username && (firstName || lastName)) {
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suggested = cleanFirst && cleanLast ? `${cleanFirst}.${cleanLast}` : cleanFirst || cleanLast;
      if (suggested) {
        setUsername(suggested);
      }
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Photo file size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePhoto(event.target.result as string);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  // Step 1 Validation: Personal Identity
  const handleNextFromStep1 = () => {
    setErrorMsg(null);
    if (!memberId.trim()) {
      setErrorMsg('Member ID is required.');
      return;
    }
    if (!firstName.trim()) {
      setErrorMsg('Please enter the member First Name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Please enter the member Last Name.');
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg('Please select Date of Birth.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation: Contact & Membership
  const handleNextFromStep2 = () => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please enter a valid Email Address for member credentials.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email format (e.g. name@example.com).');
      return;
    }
    if (!contactNumber.trim() || contactNumber.trim() === '+63 9') {
      setErrorMsg('Please provide a valid Contact Number.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please enter the complete residential address.');
      return;
    }

    // Auto-fill username if not set
    if (!username.trim()) {
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suggested = cleanFirst && cleanLast ? `${cleanFirst}.${cleanLast}` : email.split('@')[0];
      setUsername(suggested);
    }
    setCurrentStep(3);
  };

  // Step 3 Final Submit: Create Member -> Validate -> Save -> Generate Account -> Success Notification
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const nameParts = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean);
    let computedFullName = nameParts.join(' ');
    if (suffix.trim()) {
      computedFullName += ` ${suffix.trim()}`;
    }

    const finalMemberId = memberId.trim() || defaultMemberId;
    const finalUsername = username.trim() || email.trim();
    const finalPassword = DEFAULT_MEMBER_PASSWORD;
    const userId = `usr-mbr-${Date.now()}`;
    const effectivePhoto = profilePhoto || defaultAvatar;

    // 1. Member Profile Object
    const newMember: Member = {
      id: `mbr-${Date.now()}`,
      userId,
      memberId: finalMemberId,
      fullName: computedFullName,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      suffix: suffix.trim() || undefined,
      username: finalUsername,
      dateOfBirth: dateOfBirth || undefined,
      gender: sex,
      sex,
      email: email.trim(),
      phone: contactNumber.trim(),
      address: address.trim(),
      membershipType,
      status: membershipStatus,
      photoUrl: effectivePhoto,
      qrCodeData: finalMemberId,
      joinDate: dateRegistered || new Date().toISOString().split('T')[0],
      totalBorrows: 0
    };

    // 2. Linked User Account Object
    const newUser: User = {
      id: userId,
      name: computedFullName,
      email: email.trim(),
      username: finalUsername,
      password: finalPassword,
      role: 'member', // Strictly assigned to 'member'
      status: membershipStatus,
      createdAt: dateRegistered || new Date().toISOString().split('T')[0],
      memberId: finalMemberId,
      phone: contactNumber.trim(),
      address: address.trim(),
      avatarUrl: effectivePhoto,
      mustChangePassword: true
    };

    // 3. Dispatch to App handler (Save profile, persist to MySQL, assign account & show success notification)
    onMemberCreated(newMember, newUser, finalPassword);
  };

  const stepsList = [
    { number: 1, title: 'Profile & Identity', desc: 'Personal details', icon: UserIcon },
    { number: 2, title: 'Contact & Status', desc: 'Address & Category', icon: Mail },
    { number: 3, title: 'Review & Confirm', desc: 'Summary & QR', icon: ClipboardCheck }
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
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Add / Create Library Member</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Step {currentStep} of 3 • Municipal patron registration & account assignment
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

            {/* STEP 1: PERSONAL INFORMATION & PHOTO */}
            {currentStep === 1 && (
              <div className="step-fade-in">
                {/* Profile Photo & Member ID Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '14px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '18px'
                  }}
                >
                  {/* Photo Avatar */}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--brand-forest)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={profilePhoto || defaultAvatar}
                        alt="Profile Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-forest)',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Upload Profile Photo"
                    >
                      <Camera size={13} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Photo Details & Member ID */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Member Profile Photo
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 10px', gap: '4px' }}
                      >
                        <Upload size={12} />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11.5px', marginBottom: '3px' }}>
                        Member ID *
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        placeholder="e.g. BPL-2026-0001"
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, height: '34px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Name Fields: First Name, Middle Name, Last Name, Suffix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.8fr', gap: '10px', marginBottom: '14px' }}>
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
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Suffix</label>
                    <select
                      className="form-select"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                      <option value="V">V</option>
                    </select>
                  </div>
                </div>

                {/* Date of Birth & Sex */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sex *</label>
                    <select
                      className="form-select"
                      value={sex}
                      onChange={(e) => setSex(e.target.value as 'Female' | 'Male' | 'Other')}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT, ADDRESS & MEMBERSHIP STATUS */}
            {currentStep === 2 && (
              <div className="step-fade-in">
                {/* Email Address & Contact Number */}
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
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Complete Address *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Barangay, Municipality, Province"
                  />
                </div>

                {/* Membership Status, Type & Date Registered */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Membership Status *</label>
                    <select
                      className="form-select"
                      value={membershipStatus}
                      onChange={(e) => setMembershipStatus(e.target.value as AccountStatus)}
                    >
                      <option value="active">Active (Standard)</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

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
                    <label className="form-label">Date Registered *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={dateRegistered}
                      onChange={(e) => setDateRegistered(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & CONFIRM */}
            {currentStep === 3 && (
              <div className="step-fade-in">
                {/* Auto-Generated Member Card Summary Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #166534',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <img
                        src={profilePhoto || defaultAvatar}
                        alt="Member avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                        Assigned Member ID
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', fontFamily: 'var(--font-mono)' }}>
                        {memberId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#16a34a' }}>
                        {[firstName, middleName, lastName, suffix].filter(Boolean).join(' ')} • {membershipType}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCodeSvg value={memberId} size={54} />
                  </div>
                </div>

                {/* Registration Summary */}
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
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ClipboardCheck size={15} color="var(--brand-forest)" />
                    <span>Registration Summary</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Full Name</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {[firstName, middleName, lastName, suffix].filter(Boolean).join(' ') || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Date of Birth / Sex</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dateOfBirth || '—'} • {sex}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Email</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{email || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Contact Number</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{contactNumber || '—'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Address</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{address || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Membership Type</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{membershipType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</div>
                      <span
                        className={`badge ${
                          membershipStatus === 'active'
                            ? 'badge-success'
                            : membershipStatus === 'inactive'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {membershipStatus.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Date Registered</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dateRegistered || '—'}</div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'rgba(6, 78, 59, 0.05)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(6, 78, 59, 0.15)'
                  }}
                >
                  <ShieldCheck size={16} color="var(--brand-forest)" style={{ flexShrink: 0 }} />
                  <span>
                    Submitting will validate the details above, save the member profile to the library system, and generate the optical ID card.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '14px 24px' }}>
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
                  }}
                  className="btn btn-secondary"
                  style={{ gap: '6px' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>

            <div>
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 20px' }}
                >
                  <span>Continue to Contact & Status</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 20px' }}
                >
                  <span>Continue to Account Credentials</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 22px' }}
                >
                  <Check size={16} />
                  <span>Create Member & Save Profile</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
