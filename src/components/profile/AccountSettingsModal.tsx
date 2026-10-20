import React, { useState } from 'react';
import type { User } from '../../types';
import {
  X,
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
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'privileges' | 'preferences'>('security');

  // Password state
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

  if (!isOpen) return null;

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
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('bpl_pref_sound', soundEnabled ? 'enabled' : 'disabled');
    localStorage.setItem('bpl_pref_seconds', showSeconds ? 'shown' : 'hidden');
    localStorage.setItem('bpl_pref_density', compactDensity ? 'compact' : 'standard');
    onShowToast('success', 'Preferences Saved', 'Interface preferences have been successfully updated.');
  };

  const privs = currentUser.privileges || {
    circulationDesk: currentUser.role !== 'member',
    inventoryManagement: currentUser.role === 'admin' || currentUser.role === 'super_admin',
    memberManagement: currentUser.role !== 'member',
    servicesManagement: currentUser.role !== 'member',
    reportsExport: currentUser.role === 'admin' || currentUser.role === 'super_admin',
    auditView: currentUser.role === 'super_admin'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmittingPassword) onClose();
      }}
    >
      <div
        className="animate-modal-fade-in"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(22, 101, 52, 0.1)',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Account Settings
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0' }}>
                Manage authentication security, role privileges, and interface preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingPassword}
            title="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#E2E8F0',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 24px',
            backgroundColor: '#FFFFFF',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'security' ? '2px solid #166534' : '2px solid transparent',
              color: activeTab === 'security' ? '#166534' : '#64748B',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={15} />
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privileges')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'privileges' ? '2px solid #166534' : '2px solid transparent',
              color: activeTab === 'privileges' ? '#166534' : '#64748B',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} />
            <span>Role Privileges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'preferences' ? '2px solid #166534' : '2px solid transparent',
              color: activeTab === 'preferences' ? '#166534' : '#64748B',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sliders size={15} />
            <span>Preferences</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* TAB 1: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Change Account Password
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Update your authentication credentials for <strong>{currentUser.email}</strong>.
                </p>
              </div>

              {passwordError && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '10px',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#166534',
                    borderRadius: '10px',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current-password"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    Current Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="current-password"
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        width: '100%',
                        height: '40px',
                        paddingLeft: '12px',
                        paddingRight: '40px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    New Password <span style={{ color: '#DC2626' }}>*</span> (Min. 6 characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      style={{
                        width: '100%',
                        height: '40px',
                        paddingLeft: '12px',
                        paddingRight: '40px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    Confirm New Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        height: '40px',
                        paddingLeft: '12px',
                        paddingRight: '40px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        color: '#0F172A',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmittingPassword || !currentPassword || !newPassword}
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: '#166534',
                    borderColor: '#166534',
                    padding: '8px 20px',
                    fontWeight: 700
                  }}
                >
                  {isSubmittingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ROLE PRIVILEGES */}
          {activeTab === 'privileges' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Active Operational Privileges
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  System authorization rules assigned to <strong>{currentUser.name}</strong> ({currentUser.role}).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: privs.circulationDesk ? '#F0FDF4' : '#F8FAFC',
                    border: privs.circulationDesk ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                      Circulation & Book Loans Desk
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Issue books, process returns, compute due dates, and renew active loans
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: privs.circulationDesk ? '#166534' : '#E2E8F0',
                      color: privs.circulationDesk ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    {privs.circulationDesk ? 'AUTHORIZED' : 'RESTRICTED'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: privs.servicesManagement ? '#F0FDF4' : '#F8FAFC',
                    border: privs.servicesManagement ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                      Attendance Kiosk & Scanner Operations
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Operate Daily Users Log camera scanner, verify patron IDs, and monitor visits
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: privs.servicesManagement ? '#166534' : '#E2E8F0',
                      color: privs.servicesManagement ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    {privs.servicesManagement ? 'AUTHORIZED' : 'RESTRICTED'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: privs.memberManagement ? '#F0FDF4' : '#F8FAFC',
                    border: privs.memberManagement ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                      Library Patron & Member Lookup
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Access digital directory, scan QR codes, and view registered patron records
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: privs.memberManagement ? '#166534' : '#E2E8F0',
                      color: privs.memberManagement ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    {privs.memberManagement ? 'AUTHORIZED' : 'RESTRICTED'}
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: privs.inventoryManagement ? '#F0FDF4' : '#F8FAFC',
                    border: privs.inventoryManagement ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                      Catalog & Physical Inventory Administration
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Create and edit book entries, manage copies, and update Dewey Decimal shelving
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: privs.inventoryManagement ? '#166534' : '#E2E8F0',
                      color: privs.inventoryManagement ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    {privs.inventoryManagement ? 'AUTHORIZED' : 'ADMIN ONLY'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Interface & System Preferences
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Custom preferences saved on this workstation.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Audio Beep Toggle */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Volume2 size={20} color="#166534" />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                        Attendance Scan Sound Feedback
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Play high-clarity audible tones on successful or duplicate QR badge scans
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#166534' }}
                  />
                </div>

                {/* Clock Seconds Toggle */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={20} color="#166534" />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                        Live Seconds on Header Clock
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Show ticking seconds indicator on desk attendance clock
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSeconds}
                    onChange={(e) => setShowSeconds(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#166534' }}
                  />
                </div>

                {/* Compact Density Toggle */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={20} color="#166534" />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                        Compact Table Row Height
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Fit more attendance and patron rows into the visible viewport
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactDensity}
                    onChange={(e) => setCompactDensity(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#166534' }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: '#166534',
                    borderColor: '#166534',
                    padding: '8px 20px',
                    fontWeight: 700
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
