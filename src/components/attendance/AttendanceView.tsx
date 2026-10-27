import React, { useState } from 'react';
import type { AttendanceRecord, Member, UserRole, User } from '../../types';
import { DailyUsersLogKiosk } from './DailyUsersLogKiosk';
import {
  Maximize2,
  Search,
  Filter,
  X
} from 'lucide-react';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  members: Member[];
  userRole: UserRole;
  currentUser?: User;
  currentMemberId?: string;
  title?: string;
  subtitle?: string;
  defaultTab?: 'kiosk' | 'records';
  showKiosk?: boolean;
  onAttendanceProcessed: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
  onSaveAttendanceEdit?: (record: AttendanceRecord, reason: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  members,
  userRole,
  currentUser,
  currentMemberId,
  title,
  subtitle,
  onAttendanceProcessed
}) => {
  const [isKioskFullscreen, setIsKioskFullscreen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'All' | 'Inside'>('All');

  // Patron Member View (only their own attendance log)
  if (userRole === 'member') {
    const patronAttendance = attendance.filter((a) =>
      currentMemberId ? a.memberId === currentMemberId : true
    );

    const filteredPatronAttendance = patronAttendance.filter((rec) => {
      const q = memberSearchTerm.trim().toLowerCase();
      const matchText = !q || rec.date.includes(q) || rec.timeIn.toLowerCase().includes(q);
      const matchStatus = memberStatusFilter === 'All' || rec.status === memberStatusFilter;
      return matchText && matchStatus;
    });

    return (
      <div>
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="page-title">{title || 'My Library Attendance'}</h2>
            <div className="page-subtitle">
              {subtitle || 'Personal visit history, check-in logs, and duration at Balingasag Public Library'}
            </div>
          </div>
        </div>

        {/* Member Search / Filter */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search date (e.g. 2026-08)..."
              className="form-input"
              style={{ paddingLeft: '34px', height: '36px', fontSize: '13px' }}
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
            />
            {memberSearchTerm && (
              <button
                type="button"
                onClick={() => setMemberSearchTerm('')}
                className="btn-icon"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-subtle)" />
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '150px', height: '36px', fontSize: '13px' }}
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value as 'All' | 'Inside')}
            >
              <option value="All">All Visit Logs</option>
              <option value="Inside">Logged In</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time-In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatronAttendance.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No personal attendance records found.
                  </td>
                </tr>
              ) : (
                filteredPatronAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.date}</td>
                    <td><strong>{rec.timeIn}</strong></td>
                    <td>
                      <span className="badge badge-success">
                        {rec.status || 'Inside'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Staff View: Pure Attendance & Kiosk Scanner (Attendance Records & History moved to Dashboard)
  return (
    <div>
      {/* Fullscreen Kiosk Overlay */}
      {isKioskFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#0F2D1F',
            overflowY: 'auto'
          }}
        >
          <DailyUsersLogKiosk
            members={members}
            activeAttendance={attendance}
            onAttendanceProcessed={onAttendanceProcessed}
            isFullscreenMode={true}
            onToggleFullscreen={() => setIsKioskFullscreen(false)}
            onClose={() => setIsKioskFullscreen(false)}
          />
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>{title || 'Attendance & Kiosk'}</span>
            {userRole === 'volunteer' && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #bbf7d0'
                }}
              >
                Volunteer Staff: {currentUser?.name || 'Balong Long'}
              </span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(22, 101, 52, 0.1)',
                color: '#166534',
                border: '1px solid rgba(22, 101, 52, 0.25)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  animation: 'pulse 1.8s infinite'
                }}
              />
              Live Kiosk
            </span>
          </div>
          <div className="page-subtitle">
            {subtitle ||
              'Dedicated daily users log kiosk scanner for patron QR code scanning and Time-In check-in operations'}
          </div>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsKioskFullscreen(true)}
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: '#166534',
              borderColor: '#166534',
              boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)'
            }}
            title="Launch full-screen kiosk display for library entrance monitor"
          >
            <Maximize2 size={15} />
            <span>Fullscreen Kiosk Mode</span>
          </button>
        </div>
      </div>

      {/* Primary Kiosk Scanner Component */}
      <div style={{ marginBottom: '24px' }}>
        <DailyUsersLogKiosk
          members={members}
          activeAttendance={attendance}
          onAttendanceProcessed={onAttendanceProcessed}
          isFullscreenMode={false}
          onToggleFullscreen={() => setIsKioskFullscreen(true)}
        />
      </div>
    </div>
  );
};
