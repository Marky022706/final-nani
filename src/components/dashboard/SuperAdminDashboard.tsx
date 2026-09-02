import React from 'react';
import type {
  Book,
  Member,
  AttendanceRecord,
  CirculationTransaction,
  User,
  AuditLog
} from '../../types';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Clock,
  Activity,
  ArrowUpRight
} from 'lucide-react';

interface SuperAdminDashboardProps {
  books: Book[];
  members: Member[];
  attendance: AttendanceRecord[];
  transactions: CirculationTransaction[];
  users: User[];
  auditLogs: AuditLog[];
  onNavigate: (dest: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  books,
  members,
  attendance,
  transactions,
  users,
  auditLogs,
  onNavigate
}) => {
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  const activeAdmins = adminUsers.filter((u) => u.status === 'active');
  const todayStr = '2026-08-31';
  const todayVisits = attendance.filter((a) => a.date === todayStr);
  const currentlyInside = attendance.filter((a) => a.status === 'Inside');
  const activeLoans = transactions.filter((t) => t.status === 'Active' || t.status === 'Overdue');
  const overdueLoans = transactions.filter((t) => t.status === 'Overdue');

  const totalPhysicalCopies = books.reduce((sum, b) => sum + b.copies.length, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">System Overview</div>
          <div className="page-subtitle">
            Municipal System Management • High-Level Health & Governance
          </div>
        </div>
        <div className="page-actions">
          <button onClick={() => onNavigate('admin_mgmt')} className="btn btn-primary btn-sm">
            <Users size={15} />
            <span>Manage Administrators</span>
          </button>
          <button onClick={() => onNavigate('audit_logs')} className="btn btn-secondary btn-sm">
            <ShieldAlert size={15} />
            <span>View Audit Logs</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">System Admins</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{activeAdmins.length}</div>
          <div className="stat-footer">
            <span>{adminUsers.length} total registered accounts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Registered Members</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-value">{members.length}</div>
          <div className="stat-footer">
            <span>{members.filter((m) => m.status === 'active').length} active library cards</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Inventory & Titles</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="stat-value">{books.length}</div>
          <div className="stat-footer">
            <span>{totalPhysicalCopies} total physical copies</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Today's Visits</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{todayVisits.length}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{currentlyInside.length} currently inside</span>
          </div>
        </div>
      </div>

      {/* Grid: Circulation Pulse & Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Circulation Metrics */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Circulation & Compliance</h3>
            <button onClick={() => onNavigate('circulation')} className="btn btn-ghost btn-sm">
              <span>Circulation Hub</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Borrowed Books</span>
              <span style={{ fontWeight: 600 }}>{activeLoans.length} items</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
              <span style={{ fontWeight: 500 }}>Overdue Items (No fines applied)</span>
              <span style={{ fontWeight: 700 }}>{overdueLoans.length} items</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>LLM Studio Cataloging Status</span>
              <span className="badge badge-success">Online & Connected</span>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Recent System Audit Logs</h3>
            <button onClick={() => onNavigate('audit_logs')} className="btn btn-ghost btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                    By {log.performedBy} • {log.timestamp}
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                  {log.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
