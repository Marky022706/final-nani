import React from 'react';
import type {
  User,
  Member,
  CirculationTransaction,
  BookReservation,
  AttendanceRecord,
  NotificationItem
} from '../../types';
import {
  BookOpen,
  Clock,
  Repeat,
  QrCode,
  ArrowRight
} from 'lucide-react';

interface MemberDashboardProps {
  currentUser: User;
  members: Member[];
  transactions: CirculationTransaction[];
  reservations: BookReservation[];
  attendance: AttendanceRecord[];
  notifications: NotificationItem[];
  onNavigate: (dest: string) => void;
  onOpenCardModal: (member: Member) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  members,
  transactions,
  reservations,
  attendance,
  onNavigate,
  onOpenCardModal
}) => {
  const currentMember = members.find((m) => m.memberId === currentUser.memberId) || members[0];
  const memberLoans = transactions.filter(
    (t) => t.memberId === currentMember.memberId && (t.status === 'Active' || t.status === 'Overdue')
  );
  const memberReservations = reservations.filter(
    (r) => r.memberId === currentMember.memberId && r.status !== 'Claimed' && r.status !== 'Cancelled'
  );
  const currentVisit = attendance.find(
    (a) => a.memberId === currentMember.memberId && a.status === 'Inside'
  );

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}
            >
              MEMBER PORTAL
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>ID: {currentMember.memberId}</span>
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
            Welcome back, {currentMember.fullName}
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '13.5px', maxWidth: '500px' }}>
            Access your borrowed books, active reservations, and digital Balingasag Public Library identification card.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onOpenCardModal(currentMember)}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: '#ffffff', color: '#0f172a', border: 'none' }}
          >
            <QrCode size={16} />
            <span>Digital Library Card</span>
          </button>
          <button
            onClick={() => onNavigate('books')}
            className="btn btn-accent btn-sm"
          >
            <BookOpen size={16} />
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>

      {/* Status Highlights */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Currently Borrowed</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="stat-value">{memberLoans.length}</div>
          <div className="stat-footer">
            <span>Limit: up to 3 books simultaneously</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Library Visit Status</span>
            <div
              className="stat-icon"
              style={{
                backgroundColor: currentVisit ? 'var(--success-bg)' : 'var(--bg-subtle)',
                color: currentVisit ? 'var(--success)' : 'var(--text-muted)'
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {currentVisit ? (
              <span style={{ color: 'var(--success)' }}>Inside Library</span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>Not Checked In</span>
            )}
          </div>
          <div className="stat-footer">
            <span>{currentVisit ? `Timed in at ${currentVisit.timeIn}` : 'Scan QR at entrance desk'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Reservations</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Repeat size={18} />
            </div>
          </div>
          <div className="stat-value">{memberReservations.length}</div>
          <div className="stat-footer">
            <span>{memberReservations.length > 0 ? 'Item in waiting queue' : 'No active holds'}</span>
          </div>
        </div>
      </div>

      {/* Main columns: Loans & Reservations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Active Borrowed Books */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>My Borrowed Books</h3>
            <button onClick={() => onNavigate('my_books')} className="btn btn-ghost btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {memberLoans.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>You have no borrowed books currently.</p>
              <button
                onClick={() => onNavigate('books')}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
              >
                Find Books to Borrow
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {memberLoans.map((loan) => (
                <div
                  key={loan.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{loan.bookTitle}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        by {loan.bookAuthor}
                      </div>
                    </div>
                    <span className={`badge ${loan.status === 'Overdue' ? 'badge-danger' : 'badge-info'}`}>
                      {loan.status === 'Overdue' ? 'Overdue' : 'On Loan'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: '12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '8px'
                    }}
                  >
                    <span>Due: <strong>{loan.dueDate}</strong></span>
                    <span>Accession: <code>{loan.accessionNumber}</code></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Reservations & Services */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Reservations & Notices</h3>
            <button onClick={() => onNavigate('reservations')} className="btn btn-ghost btn-sm">
              <span>Reservations</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {memberReservations.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No active reservations.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {memberReservations.map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-main)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{res.bookTitle}</span>
                    <span className="badge badge-warning">Queue #{res.queuePosition}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reserved on {res.reservationDate} • Holds expire 7 days after availability
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
