import React, { useState } from 'react';
import type { AttendanceRecord, Member, UserRole } from '../../types';
import { ScanQrModal } from './ScanQrModal';
import { EditAttendanceModal } from './EditAttendanceModal';
import {
  Clock,
  QrCode,
  Search,
  CheckCircle2,
  Users,
  Calendar,
  Edit3
} from 'lucide-react';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  members: Member[];
  userRole: UserRole;
  currentMemberId?: string;
  onAttendanceProcessed: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
  onSaveAttendanceEdit: (record: AttendanceRecord, reason: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  members,
  userRole,
  currentMemberId,
  onAttendanceProcessed,
  onSaveAttendanceEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const relevantAttendance =
    userRole === 'member' && currentMemberId
      ? attendance.filter((a) => a.memberId === currentMemberId)
      : attendance;

  const filteredAttendance = relevantAttendance.filter((record) => {
    const matchesSearch =
      record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const todayStr = '2026-08-31';
  const todayVisits = attendance.filter((a) => a.date === todayStr);
  const currentlyInside = attendance.filter((a) => a.status === 'Inside');
  const completedVisits = todayVisits.filter((a) => a.status === 'Completed');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            {userRole === 'member' ? 'My Library Attendance' : 'Attendance Monitoring'}
          </div>
          <div className="page-subtitle">
            {userRole === 'member'
              ? 'Personal visit history, check-in logs, and duration at Balingasag Public Library'
              : 'Real-time entry tracker, optical QR scanner, and historical attendance log'}
          </div>
        </div>

        {userRole !== 'member' && (
          <div className="page-actions">
            <button onClick={() => setIsScannerOpen(true)} className="btn btn-primary btn-sm">
              <QrCode size={16} />
              <span>Scan Library Card (QR)</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats if Admin / Super Admin */}
      {userRole !== 'member' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Today's Visitors</span>
              <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="stat-value">{todayVisits.length}</div>
            <div className="stat-footer">
              <span>{todayStr} registered entries</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Currently Inside</span>
              <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {currentlyInside.length}
            </div>
            <div className="stat-footer">
              <span>Active in reading and tech rooms</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Completed Visits</span>
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="stat-value">{completedVisits.length}</div>
            <div className="stat-footer">
              <span>Timed out today</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Visits Logged</span>
              <div className="stat-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div className="stat-value">{attendance.length}</div>
            <div className="stat-footer">
              <span>August 2026</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search patron name, member ID, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Visit Statuses</option>
          <option value="Inside">Currently Inside</option>
          <option value="Completed">Completed</option>
        </select>
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
              <th>Time-Out</th>
              <th>Duration</th>
              <th>Status</th>
              {userRole !== 'member' && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              filteredAttendance.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{record.memberName}</div>
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
                  <td>{record.timeOut || '—'}</td>
                  <td>{record.duration || (record.status === 'Inside' ? 'In Progress' : '—')}</td>
                  <td>
                    <span
                      className={`badge ${record.status === 'Inside' ? 'badge-success' : 'badge-neutral'}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  {userRole !== 'member' && (
                    <td style={{ textAlign: 'right' }}>
                      <button
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

      {/* QR Scanner Modal */}
      <ScanQrModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        members={members}
        activeAttendance={attendance}
        onAttendanceProcessed={onAttendanceProcessed}
      />

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={onSaveAttendanceEdit}
      />
    </div>
  );
};
