import React, { useState } from 'react';
import type { Member, AttendanceRecord } from '../../types';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera
} from 'lucide-react';

interface ScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAttendanceProcessed: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
  activeAttendance: AttendanceRecord[];
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({
  isOpen,
  onClose,
  members,
  onAttendanceProcessed,
  activeAttendance
}) => {
  const [inputCode, setInputCode] = useState<string>('MBR-000001');
  const [scanResult, setScanResult] = useState<{
    type: 'time_in' | 'time_out' | 'error';
    member?: Member;
    record?: AttendanceRecord;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleProcessScan = (codeToScan?: string) => {
    const rawCode = (codeToScan || inputCode).trim().toUpperCase();
    if (!rawCode) return;

    // Locate member
    const member = members.find(
      (m) => m.memberId.toUpperCase() === rawCode || m.id.toUpperCase() === rawCode
    );

    if (!member) {
      setScanResult({
        type: 'error',
        message: `No member record found for identifier "${rawCode}".`
      });
      return;
    }

    if (member.status === 'inactive') {
      setScanResult({
        type: 'error',
        message: `Member account ${member.fullName} (${member.memberId}) is INACTIVE. Entry rejected.`
      });
      return;
    }

    const todayStr = '2026-08-31';
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Check if member is currently inside
    const existingActive = activeAttendance.find(
      (a) => a.memberId === member.memberId && a.status === 'Inside'
    );

    if (existingActive) {
      // Time-out flow
      const updatedRecord: AttendanceRecord = {
        ...existingActive,
        timeOut: nowTime,
        duration: '2h 15m',
        status: 'Completed'
      };

      onAttendanceProcessed(updatedRecord, 'time_out');
      setScanResult({
        type: 'time_out',
        member,
        record: updatedRecord,
        message: '✓ Time-Out Recorded. Library visit successfully completed.'
      });
    } else {
      // Time-in flow
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId: member.memberId,
        memberName: member.fullName,
        membershipType: member.membershipType,
        date: todayStr,
        timeIn: nowTime,
        status: 'Inside',
        notes: 'Standard library patron entry'
      };

      onAttendanceProcessed(newRecord, 'time_in');
      setScanResult({
        type: 'time_in',
        member,
        record: newRecord,
        message: '✓ Time-In Recorded. Member is now recorded inside the library.'
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Attendance QR Scanner</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Point QR Code or enter Member ID to record Time-In / Time-Out
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Simulated Scanner Viewport */}
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              textAlign: 'center',
              color: '#ffffff',
              marginBottom: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: '160px',
                height: '160px',
                border: '2px dashed rgba(255, 255, 255, 0.4)',
                borderRadius: 'var(--radius-md)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                position: 'relative'
              }}
            >
              <Camera size={36} color="rgba(255, 255, 255, 0.6)" />
              <div
                style={{
                  position: 'absolute',
                  inset: '8px',
                  border: '2px solid #38bdf8',
                  borderRadius: 4,
                  opacity: 0.8
                }}
              />
            </div>
            <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
              Optical QR reader active • Align Member QR code inside bounding box
            </div>
          </div>

          {/* Quick Member Selector Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Quick Test Patrons (Click to Simulate Instant Scan):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {members.slice(0, 4).map((m) => {
                const isInside = activeAttendance.some(
                  (a) => a.memberId === m.memberId && a.status === 'Inside'
                );
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setInputCode(m.memberId);
                      handleProcessScan(m.memberId);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', gap: '6px' }}
                  >
                    <span>{m.fullName.split(' ')[0]}</span>
                    <span className={`badge ${isInside ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                      {isInside ? 'Time-Out' : 'Time-In'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Member ID Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. MBR-000001"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <button
              type="button"
              onClick={() => handleProcessScan()}
              className="btn btn-primary"
              style={{ minWidth: '130px' }}
            >
              <QrCode size={16} />
              <span>Process Scan</span>
            </button>
          </div>

          {/* Scan Feedback Outcome */}
          {scanResult && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor:
                  scanResult.type === 'error'
                    ? 'var(--danger-bg)'
                    : scanResult.type === 'time_in'
                    ? 'var(--success-bg)'
                    : 'var(--info-bg)',
                border: `1px solid ${
                  scanResult.type === 'error'
                    ? 'var(--danger-border)'
                    : scanResult.type === 'time_in'
                    ? 'var(--success-border)'
                    : 'var(--info-border)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: scanResult.member ? '12px' : 0 }}>
                {scanResult.type === 'error' ? (
                  <AlertTriangle size={18} color="var(--danger)" />
                ) : (
                  <CheckCircle2 size={18} color={scanResult.type === 'time_in' ? 'var(--success)' : 'var(--info)'} />
                )}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color:
                      scanResult.type === 'error'
                        ? 'var(--danger)'
                        : scanResult.type === 'time_in'
                        ? 'var(--success)'
                        : 'var(--info)'
                  }}
                >
                  {scanResult.message}
                </span>
              </div>

              {scanResult.member && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <img
                    src={scanResult.member.photoUrl}
                    alt={scanResult.member.fullName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {scanResult.member.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ID: {scanResult.member.memberId} • {scanResult.member.membershipType}
                    </div>
                    {scanResult.record && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Time-In: <strong>{scanResult.record.timeIn}</strong>
                        {scanResult.record.timeOut && ` • Time-Out: ${scanResult.record.timeOut} (${scanResult.record.duration})`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
