import React, { useState, useEffect } from 'react';
import type { User, LibrarianPrivileges, StaffAccessAuditLog } from '../../types';
import {
  UserPlus,
  KeyRound,
  ShieldCheck,
  X,
  Search,
  Activity,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { StorageService } from '../../utils/storage';

interface AdminManagementViewProps {
  users: User[];
  currentUser?: User;
  onAddAdmin: (newAdmin: User) => Promise<any> | void;
  onToggleAdminStatus: (userId: string) => void;
  onResetAdminPassword: (userId: string) => Promise<{ temporary_password: string } | any> | void;
  onUpdatePrivileges?: (userId: string, privileges: LibrarianPrivileges) => void;
}

const DEFAULT_LIBRARIAN_PRIVILEGES: LibrarianPrivileges = {
  circulationDesk: true,
  inventoryManagement: true,
  memberManagement: true,
  servicesManagement: true,
  reportsExport: false,
  auditView: false
};

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  users,
  currentUser,
  onAddAdmin,
  onToggleAdminStatus,
  onResetAdminPassword,
  onUpdatePrivileges
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'access_audit'>('staff');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form Fields per specification:
  // 1. Staff Role
  // 2. Firstname, Middlename(Optional), Lastname
  // 3. Email
  // 4. Password
  const [role, setRole] = useState<'admin' | 'volunteer'>('admin');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Library Operations');
  const [showPassword, setShowPassword] = useState(false);

  // Creation Feedback & Loading Animation States
  const [createState, setCreateState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [createdUserResult, setCreatedUserResult] = useState<{ user: User; passwordUsed: string } | null>(null);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Privileges Management Modal State
  const [selectedStaffForPrivileges, setSelectedStaffForPrivileges] = useState<User | null>(null);
  const [tempPrivileges, setTempPrivileges] = useState<LibrarianPrivileges>(DEFAULT_LIBRARIAN_PRIVILEGES);

  // Access audit logs
  const [accessLogs, setAccessLogs] = useState<StaffAccessAuditLog[]>(() =>
    StorageService.getStaffAccessLogs()
  );
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Password Reset Modal & Inline Error State
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    staffName: string;
    staffEmail: string;
    temporaryPassword: string;
    copied: boolean;
  } | null>(null);
  const [copiedSuccessModal, setCopiedSuccessModal] = useState<{
    isOpen: boolean;
    password: string;
    staffName: string;
  } | null>(null);
  const [resetError, setResetError] = useState<{
    userId: string;
    userName: string;
    message: string;
    isAuth?: boolean;
  } | null>(null);

  // Close "Copied Successful" modal on Escape key press
  useEffect(() => {
    if (!copiedSuccessModal?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCopiedSuccessModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copiedSuccessModal?.isOpen]);

  const handleCopyPassword = async (password: string, staffName: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch {
      // fallback
    }

    setResetPasswordModal((prev) => (prev ? { ...prev, copied: true } : null));
    setCopiedSuccessModal({
      isOpen: true,
      password,
      staffName
    });
  };

  const handleTriggerResetPassword = async (staff: User) => {
    setResettingUserId(staff.id);
    setResetError(null);

    try {
      const res = await onResetAdminPassword(staff.id);
      const tempPwd = res?.temporary_password;
      if (tempPwd) {
        let wasCopied = false;
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(tempPwd);
            wasCopied = true;
          }
        } catch {
          wasCopied = false;
        }

        setResetPasswordModal({
          staffName: staff.name,
          staffEmail: staff.email,
          temporaryPassword: tempPwd,
          copied: wasCopied
        });
      }
    } catch (err: unknown) {
      const isAuthError =
        (err as { status?: number })?.status === 401 ||
        (err as { errorType?: string })?.errorType === 'auth_error' ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('unauthenticated') ||
           err.message.toLowerCase().includes('unauthorized') ||
           err.message.toLowerCase().includes('invalid credentials') ||
           err.message.includes('401')));

      const msg = isAuthError
        ? 'Your administrative session has expired or is unauthorized. Please sign in again to continue.'
        : err instanceof Error
        ? err.message
        : 'Unable to reset staff password. Please verify your connection or sign in again.';

      setResetError({
        userId: staff.id,
        userName: staff.name,
        message: msg,
        isAuth: isAuthError
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin' || u.role === 'volunteer');

  const handleResetCreateForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('admin');
    setDepartment('Library Operations');
    setShowPassword(false);
    setCreateState('idle');
    setCreatedUserResult(null);
    setShowCreatedPassword(false);
    setCopiedPassword(false);
    setFormError(null);
  };

  const handleCloseModal = () => {
    if (createState === 'loading') return;
    setIsCreateOpen(false);
    handleResetCreateForm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fName = firstName.trim();
    const lName = lastName.trim();
    const em = email.trim();
    const pwd = password.trim();

    if (!fName || !lName || !em || !pwd) {
      setFormError('Please fill out all required fields (Role, First Name, Last Name, Email, Password).');
      return;
    }

    if (pwd.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    const fullName = [fName, middleName.trim(), lName].filter(Boolean).join(' ');

    const newAdmin: User = {
      id: `usr-${Date.now()}`,
      name: fullName,
      email: em,
      password: pwd,
      role: role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      department: department.trim() || (role === 'volunteer' ? 'Front Desk Operations Relief' : 'Library Operations'),
      privileges: role === 'volunteer'
        ? {
            circulationDesk: true,
            inventoryManagement: false,
            memberManagement: true,
            servicesManagement: true,
            reportsExport: false,
            auditView: false
          }
        : DEFAULT_LIBRARIAN_PRIVILEGES,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastLoginIp: '192.168.1.100'
    };

    setCreateState('loading');

    try {
      // Run creation and provide a minimum 900ms smooth loading animation for visual clarity
      const [result] = await Promise.all([
        Promise.resolve(onAddAdmin(newAdmin)),
        new Promise((resolve) => setTimeout(resolve, 900))
      ]);

      StorageService.addStaffAccessLog({
        userId: newAdmin.id,
        userName: newAdmin.name,
        role: newAdmin.role,
        event: 'LOGIN_SUCCESS',
        details: `Staff account (${newAdmin.role.toUpperCase()}) provisioned by ${currentUser?.name || 'Administrator'}`,
        ipAddress: '127.0.0.1'
      });
      setAccessLogs(StorageService.getStaffAccessLogs());

      setCreatedUserResult({
        user: (result && result.user) || newAdmin,
        passwordUsed: pwd
      });
      setCreateState('success');
    } catch (err: any) {
      setCreateState('idle');
      setFormError(err?.message || 'Failed to create staff account. Please check the network connection and try again.');
    }
  };

  const handleOpenPrivilegesModal = (staff: User) => {
    setSelectedStaffForPrivileges(staff);
    setTempPrivileges(
      staff.privileges || {
        circulationDesk: true,
        inventoryManagement: true,
        memberManagement: true,
        servicesManagement: true,
        reportsExport: staff.role === 'super_admin',
        auditView: staff.role === 'super_admin'
      }
    );
  };

  const handleSavePrivileges = () => {
    if (!selectedStaffForPrivileges) return;
    if (onUpdatePrivileges) {
      onUpdatePrivileges(selectedStaffForPrivileges.id, tempPrivileges);
    } else {
      StorageService.updateLibrarianPrivileges(
        selectedStaffForPrivileges.id,
        tempPrivileges,
        currentUser?.name || 'Administrator'
      );
    }
    setAccessLogs(StorageService.getStaffAccessLogs());
    setSelectedStaffForPrivileges(null);
  };

  const filteredLogs = accessLogs.filter((log) => {
    if (!auditSearchQuery.trim()) return true;
    const q = auditSearchQuery.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.event.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.ipAddress.includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User & Access Management</div>
          <div className="page-subtitle">
            Govern authentication pipelines, configure Librarian operational privileges, and audit system access
          </div>
        </div>

        <div className="page-actions">
          {activeTab === 'staff' && (
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
              <UserPlus size={16} />
              <span>Create Staff Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'staff' ? '3px solid var(--brand-green)' : '3px solid transparent',
            color: activeTab === 'staff' ? 'var(--brand-green)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'staff' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} />
          <span>Staff Accounts & Privileges ({adminUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('access_audit')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'access_audit' ? '3px solid var(--brand-green)' : '3px solid transparent',
            color: activeTab === 'access_audit' ? 'var(--brand-green)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'access_audit' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity size={16} />
          <span>System Access & Auth Audit ({accessLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: STAFF ACCOUNTS & PRIVILEGES */}
      {activeTab === 'staff' && (
        <div>
          {/* Inline Error State for Password Reset / Authorization Failures */}
          {resetError && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: 'var(--danger-bg, #fef2f2)',
                border: '1px solid var(--danger-border, #fecaca)',
                color: 'var(--danger-text, #991b1b)',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Unable to reset password for {resetError.userName}:</strong> {resetError.message}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {resetError.isAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.clearCurrentUser();
                      window.location.href = '/login';
                    }}
                    className="btn btn-sm btn-outline"
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderColor: 'var(--danger-border, #fecaca)',
                      color: 'var(--danger-text, #991b1b)'
                    }}
                  >
                    Sign In Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setResetError(null)}
                  className="btn-icon"
                  style={{ color: 'inherit', padding: 2 }}
                  aria-label="Dismiss error"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Granted Privileges</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Authorization Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((admin) => {
                  const privs = admin.privileges || DEFAULT_LIBRARIAN_PRIVILEGES;
                  const isSuper = admin.role === 'super_admin';

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{admin.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Created: {admin.createdAt}
                        </div>
                      </td>
                      <td>{admin.email}</td>
                      <td>
                        {isSuper ? (
                          <span className="badge badge-danger">Super Admin</span>
                        ) : admin.role === 'volunteer' ? (
                          <span
                            className="badge badge-warning"
                            style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                          >
                            Volunteer Staff
                          </span>
                        ) : (
                          <span className="badge badge-info">Head Librarian (Admin)</span>
                        )}
                      </td>
                      <td>
                        {isSuper ? (
                          <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                            Full System Authority
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                            {privs.circulationDesk && (
                              <span className="badge badge-success" style={{ fontSize: '10.5px' }}>
                                Circulation
                              </span>
                            )}
                            {privs.inventoryManagement && (
                              <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                                Inventory
                              </span>
                            )}
                            {privs.memberManagement && (
                              <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                                Members
                              </span>
                            )}
                            {privs.servicesManagement && (
                              <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                                Attendance
                              </span>
                            )}
                            {privs.reportsExport && (
                              <span className="badge badge-warning" style={{ fontSize: '10.5px' }}>
                                Reports
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{admin.department || 'Library Operations'}</td>
                      <td>
                        <span className={`badge ${admin.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {!isSuper && (
                            <button
                              onClick={() => handleOpenPrivilegesModal(admin)}
                              className="btn btn-secondary btn-sm"
                              title="Configure Librarian Privileges"
                            >
                              <ShieldCheck size={14} />
                              <span>Privileges</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTriggerResetPassword(admin)}
                            disabled={resettingUserId === admin.id}
                            className="btn btn-ghost btn-sm"
                            title="Reset Password"
                          >
                            {resettingUserId === admin.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <KeyRound size={14} />
                            )}
                            <span>{resettingUserId === admin.id ? 'Resetting...' : 'Reset'}</span>
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => onToggleAdminStatus(admin.id)}
                              className={`btn btn-sm ${admin.status === 'active' ? 'btn-ghost' : 'btn-secondary'}`}
                            >
                              {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM ACCESS & AUTH AUDIT */}
      {activeTab === 'access_audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '340px', width: '100%' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by staff name, event, IP..."
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '13px' }}
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredLogs.length} authentication & authorization events
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Event Type</th>
                  <th>Event Details</th>
                  <th>Client IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{log.timestamp}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.userName}</div>
                    </td>
                    <td>
                      <span className={`badge ${log.role === 'super_admin' ? 'badge-danger' : 'badge-info'}`}>
                        {log.role === 'super_admin' ? 'Super Admin' : 'Librarian'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.event === 'LOGIN_SUCCESS'
                            ? 'badge-success'
                            : log.event === 'PRIVILEGE_CHANGED'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {log.event.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{log.details}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── MANAGE LIBRARIAN PRIVILEGES MODAL ─────────────────── */}
      {selectedStaffForPrivileges && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Librarian Authorization & Privileges</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Assign or revoke operational permissions for {selectedStaffForPrivileges.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffForPrivileges(null)}
                className="btn-icon"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Privilege 1: Circulation Desk */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={tempPrivileges.circulationDesk}
                  onChange={(e) =>
                    setTempPrivileges({ ...tempPrivileges, circulationDesk: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Circulation Desk Operations</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Check-in and check-out books, approve borrow requests, process renewals
                  </div>
                </div>
              </label>

              {/* Privilege 2: Book Cataloging */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={tempPrivileges.inventoryManagement}
                  onChange={(e) =>
                    setTempPrivileges({ ...tempPrivileges, inventoryManagement: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Inventory & Cataloging</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Add new books, edit classifications, register physical barcodes, archive items
                  </div>
                </div>
              </label>

              {/* Privilege 3: Member Management */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={tempPrivileges.memberManagement}
                  onChange={(e) =>
                    setTempPrivileges({ ...tempPrivileges, memberManagement: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Member Accounts & Verification</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Register patrons, generate library cards with QR codes, activate or suspend cards
                  </div>
                </div>
              </label>

              {/* Privilege 4: Services & Attendance */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={tempPrivileges.servicesManagement}
                  onChange={(e) =>
                    setTempPrivileges({ ...tempPrivileges, servicesManagement: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Attendance & Municipal Services</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Scan QR entry/exit attendance and record computer lab & printing services
                  </div>
                </div>
              </label>

              {/* Privilege 5: Reports Export */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={tempPrivileges.reportsExport}
                  onChange={(e) =>
                    setTempPrivileges({ ...tempPrivileges, reportsExport: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)' }}
                />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Reports & Statistical Export</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Export municipal circulation metrics, foot-traffic sheets, and inventory summaries
                  </div>
                </div>
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSelectedStaffForPrivileges(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrivileges}
                className="btn btn-primary"
              >
                Save Privileges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Library Staff Account Modal */}
      {isCreateOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && createState !== 'loading') {
              handleCloseModal();
            }
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '540px',
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* 1. LOADING ANIMATION STATE */}
            {createState === 'loading' && (
              <div
                style={{
                  padding: '52px 28px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '18px'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(23, 77, 50, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-green, #174D32)'
                  }}
                >
                  <Loader2 size={38} className="spinner-icon" />
                </div>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Creating Staff Account...
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                    Provisioning security credentials for{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {[firstName, lastName].filter(Boolean).join(' ')}
                    </strong>{' '}
                    as <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{role === 'volunteer' ? 'Volunteer Staff' : 'Librarian (Admin)'}</span>.
                  </p>
                </div>

                {/* Animated Track */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    height: '6px',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '4px'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: 'var(--brand-green, #174D32)',
                      width: '80%',
                      borderRadius: '4px'
                    }}
                    className="spinner-icon"
                  />
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '6px 14px',
                    borderRadius: '20px'
                  }}
                >
                  <Shield size={13} color="var(--brand-green, #174D32)" />
                  <span>Enforcing Municipal Access Privileges & Password Policy</span>
                </div>
              </div>
            )}

            {/* 2. SUCCESSFUL MESSAGE STATE */}
            {createState === 'success' && createdUserResult && (
              <div>
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--brand-green, #174D32)" />
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--brand-green, #174D32)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Staff Provisioned
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-icon"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(22, 163, 74, 0.12)',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 0 0 8px rgba(22, 163, 74, 0.08)'
                    }}
                  >
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Staff Account Created Successfully!
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '440px', margin: '0 auto 20px' }}>
                    The staff account has been registered and provisioned with authorized access credentials.
                  </p>

                  {/* Summary Card */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-main)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: '10px'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Staff Role
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor:
                            createdUserResult.user.role === 'admin'
                              ? 'rgba(23, 77, 50, 0.12)'
                              : 'rgba(217, 119, 6, 0.12)',
                          color:
                            createdUserResult.user.role === 'admin'
                              ? 'var(--brand-green, #174D32)'
                              : '#b45309'
                        }}
                      >
                        {createdUserResult.user.role === 'admin' ? 'Librarian (Admin)' : 'Volunteer Staff'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Full Name</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {createdUserResult.user.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Official Email</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {createdUserResult.user.email}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Password</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-main)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-main)',
                            letterSpacing: showCreatedPassword ? '0.04em' : '0.15em'
                          }}
                        >
                          {showCreatedPassword ? createdUserResult.passwordUsed : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCreatedPassword((prev) => !prev)}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title={showCreatedPassword ? 'Hide password' : 'Show password'}
                          aria-label={showCreatedPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCreatedPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedPassword(true);
                            setTimeout(() => setCopiedPassword(false), 2000);
                            handleCopyPassword(
                              createdUserResult.passwordUsed,
                              createdUserResult.user.name
                            );
                          }}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px', color: copiedPassword ? '#16a34a' : undefined }}
                          title={copiedPassword ? 'Copied to clipboard' : 'Copy password'}
                          aria-label="Copy password"
                        >
                          {copiedPassword ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Department</span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {createdUserResult.user.department || 'Library Operations'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Account Status</span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#16a34a',
                            display: 'inline-block'
                          }}
                        />
                        Active & Ready for Login
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={handleResetCreateForm}
                    className="btn btn-secondary"
                    style={{ gap: '6px' }}
                  >
                    <UserPlus size={15} />
                    <span>Create Another Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-primary"
                    style={{ gap: '6px' }}
                  >
                    <Check size={16} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. INPUT FORM STATE (IDLE) */}
            {createState === 'idle' && (
              <>
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserPlus size={20} color="var(--brand-green, #174D32)" />
                      <span>Create Library Staff Account</span>
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Fill in the staff role, full name, email, and password to provision an account
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-icon"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreate}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formError && (
                      <div
                        role="alert"
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--danger-bg, #fef2f2)',
                          border: '1px solid var(--danger-border, #fecaca)',
                          color: 'var(--danger, #dc2626)',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <X size={16} />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Requirement 1: Staff Role (FIRST) */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label
                        className="form-label"
                        style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Shield size={14} color="var(--brand-green, #174D32)" />
                        <span>1. Staff Role <span style={{ color: 'var(--danger)' }}>*</span></span>
                      </label>
                      <select
                        className="form-input"
                        value={role}
                        onChange={(e) => {
                          const newRole = e.target.value as 'admin' | 'volunteer';
                          setRole(newRole);
                          if (newRole === 'volunteer' && department === 'Library Operations') {
                            setDepartment('Front Desk Operations Relief');
                          } else if (newRole === 'admin' && department === 'Front Desk Operations Relief') {
                            setDepartment('Library Operations');
                          }
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        <option value="admin">Librarian (Admin - Full Operations, Cataloging & Reports)</option>
                        <option value="volunteer">Volunteer (Desk Relief - Attendance, Circulation & Members)</option>
                      </select>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {role === 'admin'
                          ? 'Grants full operational authority for circulation desk, cataloging, patrons, and reports.'
                          : 'Grants front-desk relief authority for QR attendance scanning, patron loans, and check-ins.'}
                      </div>
                    </div>

                    {/* Requirement 2: Firstname, Middlename(Optional), Lastname (SECOND) */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label
                        className="form-label"
                        style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <UserIcon size={14} color="var(--brand-green, #174D32)" />
                        <span>2. Full Name <span style={{ color: 'var(--danger)' }}>*</span></span>
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name *"
                            aria-label="First Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            className="form-input"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            placeholder="Middle Name (Optional)"
                            aria-label="Middle Name (Optional)"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name *"
                            aria-label="Last Name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Requirement 3: Email (THIRD) */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label
                        className="form-label"
                        style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Mail size={14} color="var(--brand-green, #174D32)" />
                        <span>3. Official Email <span style={{ color: 'var(--danger)' }}>*</span></span>
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. maria.santos@balingasag.gov.ph"
                      />
                    </div>

                    {/* Requirement 4: Password (LAST ONE) */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}
                      >
                        <label
                          className="form-label"
                          style={{
                            fontWeight: 600,
                            marginBottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Lock size={14} color="var(--brand-green, #174D32)" />
                          <span>4. Password <span style={{ color: 'var(--danger)' }}>*</span></span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
                            setPassword(`BPL@${randomChars}26`);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-green, #174D32)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Generate Password
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          className="form-input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter account password (min. 6 characters)"
                          style={{ paddingRight: '42px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                          }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        The staff member will use this password to sign into the system.
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
                      <UserPlus size={16} />
                      <span>Create Staff Account</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal (Shows temporary credential & auto-copies) */}
      {resetPasswordModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setResetPasswordModal(null);
            }
          }}
        >
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
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
                  <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                    Password Reset Successfully
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Credentials for {resetPasswordModal.staffName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordModal(null)}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Auto-copy notice */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success-bg, #f0fdf4)',
                  border: '1px solid var(--success-border, #bbf7d0)',
                  color: 'var(--success-text, #166534)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={16} color="var(--success, #16a34a)" />
                <span>
                  {resetPasswordModal.copied
                    ? 'New password has been automatically copied to your clipboard!'
                    : 'New temporary password generated successfully.'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Staff Account: <strong style={{ color: 'var(--text-primary)' }}>{resetPasswordModal.staffEmail}</strong>
                </div>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px' }}>
                  New Temporary Password
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    border: '2px solid var(--border-strong, #e2e8f0)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '17px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--text-primary, #0f172a)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCopyPassword(resetPasswordModal.temporaryPassword, resetPasswordModal.staffName)}
                  title="Click to copy password"
                >
                  <span>{resetPasswordModal.temporaryPassword}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPassword(resetPasswordModal.temporaryPassword, resetPasswordModal.staffName);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '12px' }}
                    title="Copy password to clipboard"
                    aria-label="Copy password to clipboard"
                  >
                    {resetPasswordModal.copied ? (
                      <>
                        <Check size={14} color="#16a34a" />
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Please provide this temporary password to <strong>{resetPasswordModal.staffName}</strong>. They will use this password to sign into the system.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setResetPasswordModal(null)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copied Successful Modal */}
      {copiedSuccessModal?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="copied-modal-title"
          aria-describedby="copied-modal-desc"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCopiedSuccessModal(null);
            }
          }}
        >
          <div
            className="modal-dialog animate-modal-fade-in"
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              borderRadius: '16px',
              border: '1px solid var(--border-main, #e2e8f0)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              padding: '28px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: '0 0 0 8px rgba(22, 163, 74, 0.05)'
              }}
            >
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>

            <h3
              id="copied-modal-title"
              style={{
                fontSize: '19px',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em'
              }}
            >
              Copied Successful
            </h3>

            <p
              id="copied-modal-desc"
              style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary, #475569)',
                lineHeight: 1.55,
                margin: '0 0 16px',
                maxWidth: '350px'
              }}
            >
              The new temporary password has been successfully copied to your clipboard. You can now securely provide it to <strong>{copiedSuccessModal.staffName}</strong>.
            </p>

            {/* Password Preview Pill */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-main, #e2e8f0)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                width: '100%',
                marginBottom: '20px'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--text-primary, #0f172a)'
                }}
              >
                {copiedSuccessModal.password}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#166534',
                  backgroundColor: '#dcfce7',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                <Check size={13} strokeWidth={2.5} />
                Copied
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCopiedSuccessModal(null)}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: '42px', fontSize: '14px', fontWeight: 600 }}
              autoFocus
            >
              <Check size={16} />
              <span>OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
