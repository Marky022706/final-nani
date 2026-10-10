import React, { useState } from 'react';
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
  ShieldCheck,
  Users,
  ArrowUpRight,
  Database,
  Coins,
  Wrench,
  Download,
  Layers,
  Settings
} from 'lucide-react';
import { StorageService } from '../../utils/storage';

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
  members,
  users,
  auditLogs,
  onNavigate
}) => {
  const settings = StorageService.getSystemSettings();
  const backups = StorageService.getBackups();
  const latestBackup = backups[0];

  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  const activeAdmins = adminUsers.filter((u) => u.status === 'active');

  const [quickBackupDone, setQuickBackupDone] = useState(false);

  const handleQuickBackup = () => {
    const { record, jsonData } = StorageService.createBackup('Superadmin');
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickBackupDone(true);
    setTimeout(() => setQuickBackupDone(false), 4000);
  };

  return (
    <div>
      {/* Superadmin Header with Direct Governance Actions */}
      <div className="page-header">
        <div>
          <div className="page-title">Superadmin Infrastructure & Governance</div>
          <div className="page-subtitle">
            Central governance of business logic variables, staff privileges, and data infrastructure integrity
          </div>
        </div>
        <div className="page-actions">
          <button
            onClick={() => onNavigate('system_settings')}
            className="btn btn-primary btn-sm"
          >
            <Settings size={15} />
            <span>Configure System Settings</span>
          </button>
          <button
            onClick={() => onNavigate('admin_mgmt')}
            className="btn btn-secondary btn-sm"
          >
            <Users size={15} />
            <span>User & Access Pipeline</span>
          </button>
          <button
            onClick={() => onNavigate('audit_logs')}
            className="btn btn-ghost btn-sm"
          >
            <ShieldAlert size={15} />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Infrastructure Alert / Status Banner */}
      <div
        style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: settings.isMaintenanceMode ? '#fffbeb' : '#f0fdf4',
          border: settings.isMaintenanceMode ? '1px solid #fde68a' : '1px solid #bbf7d0',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: settings.isMaintenanceMode ? '#fef3c7' : '#dcfce7',
              color: settings.isMaintenanceMode ? '#d97706' : '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {settings.isMaintenanceMode ? <Wrench size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              System Status:{' '}
              {settings.isMaintenanceMode ? (
                <span style={{ color: '#d97706' }}>Maintenance Mode Active</span>
              ) : (
                <span style={{ color: '#16a34a' }}>All Municipal Services Operational</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
              {settings.isMaintenanceMode
                ? settings.maintenanceMessage || 'Public checkout services paused.'
                : 'Primary role: Infrastructure, business rules, and security. Daily checkouts delegated to Librarians.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleQuickBackup}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12.5px' }}
          >
            <Download size={14} />
            <span>{quickBackupDone ? 'Backup Downloaded!' : 'Quick Snapshot Backup'}</span>
          </button>
          <button
            onClick={() => onNavigate('system_settings')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12.5px' }}
          >
            <span>Tweak Parameters</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Card 1: Staff & Access Pipeline */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Staff Accounts & Admins</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{activeAdmins.length}</div>
          <div className="stat-footer">
            <span>{adminUsers.length} registered staff • Granular privileges active</span>
          </div>
        </div>

        {/* Card 2: Global Fine Rate */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Overdue Fine Rate</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Coins size={18} />
            </div>
          </div>
          <div className="stat-value">₱{settings.dailyFineRate.toFixed(2)}</div>
          <div className="stat-footer">
            <span>Per day • Grace period: {settings.gracePeriodDays} day(s)</span>
          </div>
        </div>

        {/* Card 3: Member Tiers & Patrons */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Member Tier Policies</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-value">{settings.tierPolicies.length}</div>
          <div className="stat-footer">
            <span>Governing {members.length} registered library cardholders</span>
          </div>
        </div>

        {/* Card 4: Data Infrastructure */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Database Backups</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <Database size={18} />
            </div>
          </div>
          <div className="stat-value">{backups.length}</div>
          <div className="stat-footer">
            <span>Last snapshot: {latestBackup ? latestBackup.timestamp.split(' ')[0] : 'None'}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Operational Governance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* Column 1: System Business Logic Summary */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} style={{ color: 'var(--brand-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Active Borrowing Thresholds</h3>
            </div>
            <button onClick={() => onNavigate('system_settings')} className="btn btn-ghost btn-sm">
              <span>Edit Rules</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settings.tierPolicies.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.tierName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Max Loan: {p.loanPeriodDays} days • {p.maxReservations} reservations
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-green)' }}>
                    {p.maxLoanLimit} Books Max
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {p.fineExempt ? 'Fine Exempt' : `₱${p.dailyFineRate}/day`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px'
            }}
          >
            ✓ Business rules automatically enforce loan duration and reservation caps at the circulation counter.
          </div>
        </div>

        {/* Column 2: Recent System Audit Activities */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--info)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>System Audit Logs</h3>
            </div>
            <button onClick={() => onNavigate('audit_logs')} className="btn btn-ghost btn-sm">
              <span>View All Logs</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigate('system_settings')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', color: 'var(--danger)' }}
            >
              Purge / Clean Logs in Settings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
