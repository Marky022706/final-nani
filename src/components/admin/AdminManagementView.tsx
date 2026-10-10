import React, { useState } from 'react';
import type { User, LibrarianPrivileges, StaffAccessAuditLog } from '../../types';
import {
  UserPlus,
  KeyRound,
  ShieldCheck,
  X,
  Search,
  Activity
} from 'lucide-react';
import { StorageService } from '../../utils/storage';

interface AdminManagementViewProps {
  users: User[];
  currentUser?: User;
  onAddAdmin: (newAdmin: User) => void;
  onToggleAdminStatus: (userId: string) => void;
  onResetAdminPassword: (userId: string) => void;
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'volunteer'>('admin');
  const [department, setDepartment] = useState('Library Operations');

  // Privileges Management Modal State
  const [selectedStaffForPrivileges, setSelectedStaffForPrivileges] = useState<User | null>(null);
  const [tempPrivileges, setTempPrivileges] = useState<LibrarianPrivileges>(DEFAULT_LIBRARIAN_PRIVILEGES);

  // Access audit logs
  const [accessLogs, setAccessLogs] = useState<StaffAccessAuditLog[]>(() =>
    StorageService.getStaffAccessLogs()
  );
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin' || u.role === 'volunteer');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newAdmin: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
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

    onAddAdmin(newAdmin);
    StorageService.addStaffAccessLog({
      userId: newAdmin.id,
      userName: newAdmin.name,
      role: 'admin',
      event: 'LOGIN_SUCCESS',
      details: `Staff account provisioned by ${currentUser?.name || 'Administrator'}`,
      ipAddress: '127.0.0.1'
    });
    setAccessLogs(StorageService.getStaffAccessLogs());

    setIsCreateOpen(false);
    setName('');
    setEmail('');
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
                          onClick={() => onResetAdminPassword(admin.id)}
                          className="btn btn-ghost btn-sm"
                          title="Reset Password"
                        >
                          <KeyRound size={14} />
                          <span>Reset</span>
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

      {/* Create Admin Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Library Staff Account</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="btn-icon"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Staff Role *</label>
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
                  >
                    <option value="admin">Librarian (Admin - Full Operations & Reports)</option>
                    <option value="volunteer">Volunteer (Desk Relief - Attendance, Circulation & Members)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maria Clara Santos"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@balingasag.gov.ph"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
