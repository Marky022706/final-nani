import React, { useState, useEffect } from 'react';
import type { User, Member } from '../../types';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sliders,
  Volume2,
  Clock,
  Mail,
  Phone,
  Building,
  Save,
  IdCard,
  Printer,
  Shield
} from 'lucide-react';
import { api } from '../../services/api';
import { QrCodeSvg } from '../../utils/qr';

export type ProfileTab = 'profile' | 'security' | 'privileges' | 'preferences' | 'card';

interface ProfileSettingsViewProps {
  currentUser: User;
  members?: Member[];
  activeTab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
  onUpdateProfile: (updatedData: { name: string; email: string; phone?: string; department?: string }) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  members = [],
  activeTab = 'profile',
  onTabChange,
  onUpdateProfile,
  onShowToast
}) => {
  const [currentTab, setCurrentTab] = useState<ProfileTab>(activeTab);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleSelectTab = (tab: ProfileTab) => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Profile Details State
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setDepartment(currentUser.department || '');
  }, [currentUser]);

  // Security & Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // User UI Preferences state (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('bpl_pref_sound') !== 'disabled';
  });
  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    return localStorage.getItem('bpl_pref_seconds') !== 'hidden';
  });
  const [compactDensity, setCompactDensity] = useState<boolean>(() => {
    return localStorage.getItem('bpl_pref_density') === 'compact';
  });
  const [prefSaved, setPrefSaved] = useState(false);

  // Role display
  const roleDisplay =
    currentUser.role === 'super_admin'
      ? 'Super Admin'
      : currentUser.role === 'admin'
      ? 'Library Administrator'
      : currentUser.role === 'volunteer'
      ? 'Volunteer Staff'
      : 'Library Member';

  // Compute initials
  const initials = currentUser.name
    ? currentUser.name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // Find linked member record for patrons
  const linkedMember = members.find((m) => m.memberId === currentUser.memberId);

  // Profile Save
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setProfileError('Full name is required.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setProfileError('A valid email address is required.');
      return;
    }

    try {
      setIsSubmittingProfile(true);
      await onUpdateProfile({
        name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        department: department.trim()
      });
      setProfileSuccess('Your profile credentials have been successfully updated.');
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });

      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast('success', 'Security Updated', 'Your account password has been changed successfully.');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Preferences Save
  const handleSavePreferences = () => {
    localStorage.setItem('bpl_pref_sound', soundEnabled ? 'enabled' : 'disabled');
    localStorage.setItem('bpl_pref_seconds', showSeconds ? 'visible' : 'hidden');
    localStorage.setItem('bpl_pref_density', compactDensity ? 'compact' : 'comfortable');
    setPrefSaved(true);
    onShowToast('success', 'Preferences Saved', 'Workstation interface preferences updated.');
    setTimeout(() => setPrefSaved(false), 3000);
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#94a3b8', width: '0%' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: '#ef4444', width: '25%' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { score: 3, label: 'Good', color: '#10b981', width: '75%' };
    return { score: 4, label: 'Strong', color: '#166534', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Banner / Hero Header */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Avatar Pill */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-forest, #166534)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)',
                border: '3px solid #ffffff'
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                  {currentUser.name}
                </h1>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(22, 101, 52, 0.1)',
                    color: 'var(--brand-forest, #166534)',
                    border: '1px solid rgba(22, 101, 52, 0.2)'
                  }}
                >
                  {roleDisplay}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  Active Session
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary, #64748b)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  {currentUser.email}
                </span>
                {currentUser.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={14} />
                    {currentUser.phone}
                  </span>
                )}
                {currentUser.department && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Building size={14} />
                    {currentUser.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
            <div>System User ID</div>
            <code style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
              {currentUser.id || currentUser.memberId || 'USR-LOCAL'}
            </code>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '24px',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => handleSelectTab('profile')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'profile' ? '2.5px solid var(--brand-forest, #166534)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: currentTab === 'profile' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <UserIcon size={16} />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('security')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'security' ? '2.5px solid var(--brand-forest, #166534)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: currentTab === 'security' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Lock size={16} />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('privileges')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'privileges' ? '2.5px solid var(--brand-forest, #166534)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: currentTab === 'privileges' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck size={16} />
          <span>Role Privileges</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('preferences')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: currentTab === 'preferences' ? '2.5px solid var(--brand-forest, #166534)' : '2.5px solid transparent',
            backgroundColor: 'transparent',
            color: currentTab === 'preferences' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={16} />
          <span>Preferences</span>
        </button>

        {currentUser.role === 'member' && (
          <button
            type="button"
            onClick={() => handleSelectTab('card')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              borderBottom: currentTab === 'card' ? '2.5px solid var(--brand-forest, #166534)' : '2.5px solid transparent',
              backgroundColor: 'transparent',
              color: currentTab === 'card' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748b)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <IdCard size={16} />
            <span>Digital Library Card</span>
          </button>
        )}
      </div>

      {/* TAB 1: PROFILE DETAILS */}
      {currentTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div
            className="card"
            style={{
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>
                Personal Information
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Update your account details and contact information. These details will be reflected across library records.
              </p>
            </div>

            {profileError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px'
                }}
              >
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted, #94a3b8)'
                      }}
                    />
                    <input
                      type="text"
                      required
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Balong Long"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted, #94a3b8)'
                      }}
                    />
                    <input
                      type="email"
                      required
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. user@balingasag.gov.ph"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Contact Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted, #94a3b8)'
                      }}
                    />
                    <input
                      type="tel"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Assigned Department / Unit
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted, #94a3b8)'
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Circulation & Public Desk"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '18px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="btn btn-primary"
                  style={{ minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={15} />
                  <span>{isSubmittingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="card"
              style={{
                padding: '22px',
                backgroundColor: 'rgba(22, 101, 52, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(22, 101, 52, 0.15)'
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px', color: 'var(--brand-forest, #166534)' }}>
                Account Overview
              </h3>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #475569)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Access Level:</span>{' '}
                  <strong style={{ color: 'var(--brand-forest, #166534)' }}>{roleDisplay}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Authentication:</span>{' '}
                  <span>Laravel Sanctum API Session</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Database Sync:</span>{' '}
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Active (Laragon MySQL)</span>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main, #0f172a)' }}>
                Need Help Updating?
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.45 }}>
                For account role elevation or transferred assignment re-delegation, contact the Municipal Information Office or Super Administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {currentTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div
            className="card"
            style={{
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>
                Change Account Password
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Ensure your account is protected with a strong, distinct password. We recommend at least 8 characters with numbers and symbols.
              </p>
            </div>

            {passwordError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px'
                }}
              >
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Current Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength progress bar */}
                {newPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Strength:</span>
                      <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: strength.width,
                          backgroundColor: strength.color,
                          transition: 'width 0.25s ease, background-color 0.25s ease'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '18px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="btn btn-primary"
                  style={{ minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Lock size={15} />
                  <span>{isSubmittingPassword ? 'Changing Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Guidelines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="card"
              style={{
                padding: '22px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} color="var(--brand-forest, #166534)" />
                <span>Password Requirements</span>
              </h3>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary, #475569)', paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Minimum of 6 characters (8+ recommended).</li>
                <li>Never share staff credentials across personal devices.</li>
                <li>Avoid using plain sequential numbers or easily guessable dates.</li>
                <li>Changes are hashed using Bcrypt before saving to database.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLE PRIVILEGES */}
      {currentTab === 'privileges' && (
        <div
          className="card"
          style={{
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>
              Assigned Permissions & Authorized Scopes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              Your account has been granted capabilities based on the <strong>{roleDisplay}</strong> governance profile.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {/* Circulation Desk */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #dcfce7',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>Circulation & Loans Desk</div>
                <div style={{ fontSize: '12px', color: '#14532d', marginTop: '2px' }}>
                  Authorized to scan patron barcodes, issue book loans, process returns, and manage active borrowing queue.
                </div>
              </div>
            </div>

            {/* Attendance Logging */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #dcfce7',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>Daily Users Attendance</div>
                <div style={{ fontSize: '12px', color: '#14532d', marginTop: '2px' }}>
                  Full authorization to log visitor check-ins, record optical QR scans, and view daily patron traffic logs.
                </div>
              </div>
            </div>

            {/* Cataloging */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement ? '1px solid #e2e8f0' : '1px solid #dcfce7',
                backgroundColor: currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement ? '#f8fafc' : '#f0fdf4',
                display: 'flex',
                gap: '12px'
              }}
            >
              {currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement ? (
                <Lock size={18} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement ? '#64748b' : '#166534' }}>
                  Cataloging & Physical Inventory
                </div>
                <div style={{ fontSize: '12px', color: currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement ? '#94a3b8' : '#14532d', marginTop: '2px' }}>
                  {currentUser.role === 'volunteer' && !currentUser.privileges?.inventoryManagement
                    ? 'Catalog modification and accession assignment require Administrator delegation.'
                    : 'Authorized to catalog new acquisitions, update metadata, print barcodes, and manage accession numbers.'}
                </div>
              </div>
            </div>

            {/* Reports & Exports */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: currentUser.role === 'volunteer' ? '1px solid #e2e8f0' : '1px solid #dcfce7',
                backgroundColor: currentUser.role === 'volunteer' ? '#f8fafc' : '#f0fdf4',
                display: 'flex',
                gap: '12px'
              }}
            >
              {currentUser.role === 'volunteer' ? (
                <Lock size={18} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: currentUser.role === 'volunteer' ? '#64748b' : '#166534' }}>
                  Analytics & Statistical Export
                </div>
                <div style={{ fontSize: '12px', color: currentUser.role === 'volunteer' ? '#94a3b8' : '#14532d', marginTop: '2px' }}>
                  {currentUser.role === 'volunteer'
                    ? 'CSV/Excel and official municipal summary exports are restricted to Administrators.'
                    : 'Full access to attendance analytics, monthly reports, and circulation metrics export.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREFERENCES */}
      {currentTab === 'preferences' && (
        <div
          className="card"
          style={{
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>
              Workstation & Display Preferences
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              Configure sensory feedback, scanning chimes, and operational density for this computer.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
            {/* Audio Feedback Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Volume2 size={20} color="var(--brand-forest, #166534)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                    Attendance Scanner Sound Feedback
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                    Play an audible confirmation chime when a QR barcode scan successfully registers
                  </div>
                </div>
              </div>

              <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-forest, #166534)', cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Live Clock Seconds Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Clock size={20} color="var(--brand-forest, #166534)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                    Live Seconds Display on Header Clock
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                    Show precise ticking seconds (HH:MM:SS) in top header bar
                  </div>
                </div>
              </div>

              <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={(e) => setShowSeconds(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-forest, #166534)', cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Compact Table Density */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Sliders size={20} color="var(--brand-forest, #166534)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                    Compact Table Row Density
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                    Reduce padding in transaction logs and attendance tables to view more records per screen
                  </div>
                </div>
              </div>

              <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={compactDensity}
                  onChange={(e) => setCompactDensity(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-forest, #166534)', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '18px' }}>
            <button
              type="button"
              onClick={handleSavePreferences}
              className="btn btn-primary"
              style={{ minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={15} />
              <span>{prefSaved ? 'Preferences Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: DIGITAL LIBRARY CARD (FOR MEMBERS) */}
      {currentTab === 'card' && linkedMember && (
        <div
          className="card"
          style={{
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-main, #0f172a)' }}>
                Official Patron Identification Card
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Present this digital card or barcode at the library circulation desk or self-service kiosk.
              </p>
            </div>
            <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} />
              <span>Print Card</span>
            </button>
          </div>

          {/* Library Card Visual */}
          <div
            style={{
              maxWidth: '480px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, #0f2d1f 0%, #166534 60%, #064e3b 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background watermark */}
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                bottom: '-20px',
                opacity: 0.08,
                pointerEvents: 'none'
              }}
            >
              <Shield size={220} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="BPL Logo" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Balingasag Public Library
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    Municipal Library Identification
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff'
                }}
              >
                {linkedMember.membershipType}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <QrCodeSvg value={linkedMember.memberId} size={78} />
              </div>

              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>
                  {linkedMember.fullName}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                  Patron ID: <strong style={{ color: '#86efac' }}>{linkedMember.memberId}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)' }}>
                  Member Since: {linkedMember.joinDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
