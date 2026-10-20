import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, Member, UserRole, User } from '../../types';
import { ScanQrModal } from './ScanQrModal';
import { EditAttendanceModal } from './EditAttendanceModal';
import { DailyUsersLogKiosk } from './DailyUsersLogKiosk';
import {
  Clock,
  QrCode,
  Search,
  CheckCircle2,
  Users,
  Calendar,
  Edit3,
  Maximize2,
  Camera,
  ClipboardList
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
  onAttendanceProcessed: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
  onSaveAttendanceEdit: (record: AttendanceRecord, reason: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  members,
  userRole,
  currentUser,
  currentMemberId,
  title,
  subtitle,
  defaultTab = 'kiosk',
  onAttendanceProcessed,
  onSaveAttendanceEdit
}) => {
  const [activeTab, setActiveTab] = useState<'kiosk' | 'records'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [isKioskFullscreen, setIsKioskFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
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

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayVisits = attendance.filter((a) => a.date === todayStr);
  const currentlyInside = attendance.filter((a) => a.status === 'Inside');
  const completedVisits = todayVisits.filter((a) => a.status === 'Completed');

  return (
    <div>
      {/* Fullscreen Kiosk Overlay for Dedicated Kiosk Display */}
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
            <span>{title || (userRole === 'member' ? 'My Library Attendance' : 'Attendance & Kiosk')}</span>
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
            {userRole !== 'member' && userRole !== 'volunteer' && (
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
            )}
          </div>
          <div className="page-subtitle">
            {subtitle ||
              (userRole === 'member'
                ? 'Personal visit history, check-in logs, and duration at Balingasag Public Library'
                : 'Dedicated daily users log kiosk scanner and real-time attendance management system')}
          </div>
        </div>

        {userRole !== 'member' && (
          <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
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
        )}
      </div>

      {/* Tabs for Librarian / Admin Staff */}
      {userRole !== 'member' && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('kiosk')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              border: activeTab === 'kiosk' ? '1px solid #166534' : '1px solid transparent',
              backgroundColor: activeTab === 'kiosk' ? '#166534' : 'transparent',
              color: activeTab === 'kiosk' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            <Camera size={16} />
            <span>DAILY USERS LOG (Kiosk Scanner)</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              border: activeTab === 'records' ? '1px solid #166534' : '1px solid transparent',
              backgroundColor: activeTab === 'records' ? '#166534' : 'transparent',
              color: activeTab === 'records' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            <ClipboardList size={16} />
            <span>Attendance Records & History</span>
            <span
              style={{
                marginLeft: '4px',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: activeTab === 'records' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                color: activeTab === 'records' ? '#FFFFFF' : 'var(--text-muted)'
              }}
            >
              {attendance.length}
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: KIOSK SCANNER (Matches Reference UI) */}
      {userRole !== 'member' && activeTab === 'kiosk' && (
        <div style={{ marginBottom: '24px' }}>
          <DailyUsersLogKiosk
            members={members}
            activeAttendance={attendance}
            onAttendanceProcessed={onAttendanceProcessed}
            isFullscreenMode={false}
            onToggleFullscreen={() => setIsKioskFullscreen(true)}
          />
        </div>
      )}

      {/* TAB 2: ATTENDANCE RECORDS & MONITORING (Or Default for Member) */}
      {(userRole === 'member' || activeTab === 'records') && (
        <div>
          {/* Volunteer Desk Relief Notice */}
          {userRole === 'volunteer' && (
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-lg)',
                color: '#166534',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={20} color="#16a34a" />
              <div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>Operation Desk • Attendance Records & History</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', fontWeight: 400 }}>
                  Assigned Volunteer Staff: <strong>{currentUser?.name || 'Balong Long'}</strong> ({currentUser?.email || 'admin1@balingasag.gov.ph'}) — Active monitoring of municipal library attendance, patron time-in/out logs, and visitor duration.
                </div>
              </div>
            </div>
          )}

          {/* KPI Stats if Admin / Super Admin */}
          {userRole !== 'member' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Today's Visitors</span>
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}
                  >
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
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}
                  >
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
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
                  >
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
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="stat-value">{attendance.length}</div>
                <div className="stat-footer">
                  <span>All-time attendance log</span>
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

            {userRole !== 'member' && (
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                <QrCode size={15} />
                <span>Modal Scanner</span>
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
        </div>
      )}

      {/* QR Scanner Modal (Fallback modal) */}
      <ScanQrModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
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
