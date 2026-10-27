import React, { useState } from 'react';
import type { AttendanceRecord, UserRole, User } from '../../types';
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Edit3,
  AlertCircle,
  X,
  Filter
} from 'lucide-react';
import { EditAttendanceModal } from './EditAttendanceModal';

interface AttendanceRecordsSectionProps {
  attendance: AttendanceRecord[];
  userRole?: UserRole;
  currentUser?: User;
  title?: string;
  subtitle?: string;
  onSaveAttendanceEdit?: (record: AttendanceRecord, reason: string) => void;
  onNavigateToAttendance?: () => void;
}

export const AttendanceRecordsSection: React.FC<AttendanceRecordsSectionProps> = ({
  attendance,
  userRole = 'admin',
  currentUser,
  title = 'Attendance Records & History',
  subtitle = 'Live patron monitoring and Time-In check-in timestamps',
  onSaveAttendanceEdit,
  onNavigateToAttendance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Inside'>('All');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayVisits = attendance.filter((a) => a.date === todayStr);
  const currentlyInside = attendance.filter((a) => a.status === 'Inside');
  const uniquePatronsToday = new Set(todayVisits.map((a) => a.memberId)).size;

  const filteredAttendance = attendance.filter((record) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      record.memberName.toLowerCase().includes(q) ||
      record.memberId.toLowerCase().includes(q) ||
      record.date.includes(q);

    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSaveEdit = (updatedRecord: AttendanceRecord, reason: string) => {
    try {
      if (onSaveAttendanceEdit) {
        onSaveAttendanceEdit(updatedRecord, reason);
      }
      setInlineNotice({
        type: 'success',
        message: `Attendance log for ${updatedRecord.memberName} (${updatedRecord.memberId}) has been updated successfully.`
      });
      setTimeout(() => setInlineNotice(null), 5000);
    } catch (err: unknown) {
      setInlineNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update attendance record. Please try again.'
      });
    }
  };

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(22, 101, 52, 0.1)',
                color: '#166534',
                border: '1px solid rgba(22, 101, 52, 0.2)'
              }}
            >
              {attendance.length} Total Logs
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {subtitle}
          </div>
        </div>

        {onNavigateToAttendance && (
          <button
            type="button"
            onClick={onNavigateToAttendance}
            className="btn btn-secondary btn-sm"
            title="Open Attendance Kiosk Scanner"
          >
            <span>Open Attendance Kiosk</span>
          </button>
        )}
      </div>

      {/* Inline Feedback / Error State */}
      {inlineNotice && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: inlineNotice.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: inlineNotice.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: inlineNotice.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {inlineNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ fontWeight: 500 }}>{inlineNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineNotice(null)}
            className="btn-icon"
            style={{ color: 'inherit', padding: 2 }}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Volunteer Desk Relief Notice (When applicable) */}
      {userRole === 'volunteer' && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            color: '#166534',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          <div>
            Assigned Volunteer: <strong>{currentUser?.name || 'Volunteer Staff'}</strong> — Active monitoring of municipal library attendance and patron Time-In logs.
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-card-header">
            <span className="stat-label">Today's Visitors</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>{todayVisits.length}</div>
          <div className="stat-footer">
            <span>{todayStr} registered entries</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-card-header">
            <span className="stat-label">Currently Inside</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px', color: 'var(--warning)' }}>
            {currentlyInside.length}
          </div>
          <div className="stat-footer">
            <span>Active in reading and tech rooms</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-card-header">
            <span className="stat-label">Unique Patrons Today</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>{uniquePatronsToday}</div>
          <div className="stat-footer">
            <span>Distinct visitors logged today</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-card-header">
            <span className="stat-label">Total Visits Logged</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>{attendance.length}</div>
          <div className="stat-footer">
            <span>All-time attendance log</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            placeholder="Search patron name, member ID, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="btn-icon"
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-subtle)" />
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', height: '38px', fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Inside')}
          >
            <option value="All">All Visit Logs</option>
            <option value="Inside">Logged In</option>
          </select>
        </div>

        {(searchTerm || statusFilter !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '12px' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Member ID</th>
              <th>Date</th>
              <th>Time-In</th>
              <th>Status</th>
              {userRole !== 'member' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={28} style={{ opacity: 0.35 }} />
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>No Attendance Records Found</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-subtle)', maxWidth: '340px' }}>
                      {searchTerm || statusFilter !== 'All'
                        ? 'No records match your active search filters. Try clearing your search keyword or selecting All statuses.'
                        : 'No patron check-ins have been registered in the system yet.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAttendance.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.memberName}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {record.membershipType}
                    </div>
                  </td>
                  <td>
                    <code style={{ fontWeight: 600 }}>{record.memberId}</code>
                  </td>
                  <td>{record.date}</td>
                  <td>
                    <strong>{record.timeIn}</strong>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {record.status || 'Inside'}
                    </span>
                  </td>
                  {userRole !== 'member' && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(record)}
                        className="btn btn-ghost btn-sm"
                        title="Edit attendance record"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <EditAttendanceModal
          record={editingRecord}
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};
