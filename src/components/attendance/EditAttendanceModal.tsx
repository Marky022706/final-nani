import React, { useState } from 'react';
import type { AttendanceRecord } from '../../types';
import { X, Edit3, ShieldAlert } from 'lucide-react';

interface EditAttendanceModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: AttendanceRecord, editReason: string) => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !record) return null;

  const [timeIn, setTimeIn] = useState<string>(record.timeIn);
  const [timeOut, setTimeOut] = useState<string>(record.timeOut || '');
  const [status, setStatus] = useState<AttendanceRecord['status']>(record.status);
  const [reason, setReason] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the attendance correction for audit trail.');
      return;
    }

    const updated: AttendanceRecord = {
      ...record,
      timeIn: timeIn.trim(),
      timeOut: timeOut.trim() || undefined,
      status,
      editReason: reason.trim(),
      editedAt: new Date().toISOString()
    };

    onSave(updated, reason.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Edit3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Edit Attendance Record</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {record.memberName} ({record.memberId}) • {record.date}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              style={{
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--warning-border)'
              }}
            >
              <ShieldAlert size={16} />
              <span>All manual attendance adjustments are logged in the System Audit Trail.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Time-In (Format: 03:15 PM)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={timeIn}
                  onChange={(e) => setTimeIn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time-Out (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={timeOut}
                  onChange={(e) => setTimeOut(e.target.value)}
                  placeholder="e.g. 05:30 PM"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceRecord['status'])}
              >
                <option value="Inside">Inside</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Correction *</label>
              <textarea
                required
                className="form-textarea"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Patron forgot to scan QR card upon departure"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes & Log Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
