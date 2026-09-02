import React from 'react';
import type {
  Book,
  Member,
  AttendanceRecord,
  CirculationTransaction,
  ServiceRecord
} from '../../types';
import {
  BookOpen,
  Clock,
  Repeat,
  Plus,
  QrCode,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface AdminDashboardProps {
  books: Book[];
  members: Member[];
  attendance: AttendanceRecord[];
  transactions: CirculationTransaction[];
  serviceRecords: ServiceRecord[];
  onNavigate: (dest: string) => void;
  onOpenAddBook: () => void;
  onOpenCreateMember: () => void;
  onOpenScanner: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  members,
  attendance,
  transactions,
  serviceRecords,
  onNavigate,
  onOpenAddBook,
  onOpenCreateMember,
  onOpenScanner
}) => {
  const totalPhysicalCopies = books.reduce((sum, b) => sum + b.copies.length, 0);
  const availableCopies = books.reduce(
    (sum, b) => sum + b.copies.filter((c) => c.status === 'Available').length,
    0
  );
  const borrowedCopies = books.reduce(
    (sum, b) => sum + b.copies.filter((c) => c.status === 'Borrowed').length,
    0
  );
  const overdueTransactions = transactions.filter((t) => t.status === 'Overdue');

  const todayStr = '2026-08-31';
  const todayVisits = attendance.filter((a) => a.date === todayStr);
  const currentlyInside = attendance.filter((a) => a.status === 'Inside');
  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingApprovals = transactions.filter((t) => t.status === 'Pending Approval').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Library Operations Dashboard</div>
          <div className="page-subtitle">
            Balingasag Public Library • Daily Circulation & Operational Overview
          </div>
        </div>
        <div className="page-actions">
          {pendingApprovals > 0 && (
            <button
              onClick={() => onNavigate('circulation')}
              className="btn btn-sm"
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fcd34d',
                fontWeight: 600,
                gap: '6px'
              }}
              title="Review pending member requests in Circulation"
            >
              <Clock size={15} />
              <span>{pendingApprovals} Approvals Pending</span>
            </button>
          )}
          <button onClick={onOpenScanner} className="btn btn-secondary btn-sm">
            <QrCode size={15} />
            <span>Attendance Scanner</span>
          </button>
          <button onClick={onOpenAddBook} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add Book (ISBN)</span>
          </button>
          <button onClick={onOpenCreateMember} className="btn btn-secondary btn-sm">
            <Plus size={15} />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Books</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="stat-value">{books.length}</div>
          <div className="stat-footer">
            <span>{totalPhysicalCopies} physical copies cataloged</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Available on Shelf</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{availableCopies}</div>
          <div className="stat-footer">
            <span>{borrowedCopies} currently on loan</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Currently Inside</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{currentlyInside.length}</div>
          <div className="stat-footer">
            <span>{todayVisits.length} total visitors today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Overdue Loans</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <Repeat size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: overdueTransactions.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {overdueTransactions.length}
          </div>
          <div className="stat-footer">
            <span>{activeMembers.length} active registered patrons</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Visitors & Category Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Real-time Inside Tracker */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15.5px' }}>Currently Inside Library</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Live active visits recorded via QR Time-In
              </div>
            </div>
            <button onClick={() => onNavigate('attendance')} className="btn btn-ghost btn-sm">
              <span>View Records</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {currentlyInside.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No patrons currently timed-in.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentlyInside.map((record) => (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-main)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{record.memberName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ID: {record.memberId} • Type: {record.membershipType}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success">Inside</span>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)', marginTop: '3px' }}>
                      Since {record.timeIn}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Circulation Activity */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15.5px' }}>Recent Circulation Activity</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Latest patron borrowing and return records
              </div>
            </div>
            <button onClick={() => onNavigate('circulation')} className="btn btn-ghost btn-sm">
              <span>Circulation Hub</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{tx.bookTitle}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Borrower: {tx.memberName} ({tx.memberId})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                    Due: {tx.dueDate}
                  </div>
                </div>
                <span
                  className={`badge ${
                    tx.status === 'Overdue'
                      ? 'badge-danger'
                      : tx.status === 'Returned'
                      ? 'badge-neutral'
                      : 'badge-info'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
