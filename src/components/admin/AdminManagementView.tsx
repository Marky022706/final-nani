import React, { useState } from 'react';
import type { User } from '../../types';
import {
  UserPlus,
  KeyRound,
  X
} from 'lucide-react';

interface AdminManagementViewProps {
  users: User[];
  onAddAdmin: (newAdmin: User) => void;
  onToggleAdminStatus: (userId: string) => void;
  onResetAdminPassword: (userId: string) => void;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  users,
  onAddAdmin,
  onToggleAdminStatus,
  onResetAdminPassword
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Library Operations');

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newAdmin: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      department: department.trim()
    };

    onAddAdmin(newAdmin);
    setIsCreateOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Administrator Management</div>
          <div className="page-subtitle">
            Create, manage permissions, and govern library staff & administrator accounts
          </div>
        </div>

        <div className="page-actions">
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
            <UserPlus size={16} />
            <span>Create Administrator</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Admin Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((admin) => (
              <tr key={admin.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{admin.name}</div>
                </td>
                <td>{admin.email}</td>
                <td>
                  <span
                    className={`badge ${admin.role === 'super_admin' ? 'badge-danger' : 'badge-info'}`}
                  >
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td style={{ fontSize: '12.5px' }}>{admin.department || 'Library Operations'}</td>
                <td>
                  <span className={`badge ${admin.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {admin.status}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{admin.createdAt}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onResetAdminPassword(admin.id)}
                      className="btn btn-ghost btn-sm"
                      title="Reset Administrator Password"
                    >
                      <KeyRound size={14} />
                      <span>Reset Pass</span>
                    </button>
                    {admin.role !== 'super_admin' && (
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Create Library Administrator</h3>
              <button onClick={() => setIsCreateOpen(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Roberto Gomez"
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
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
