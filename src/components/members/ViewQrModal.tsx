import React, { useState } from 'react';
import type { Member, AttendanceRecord } from '../../types';
import { QrCodeSvg, downloadQrCode, printQrCode } from '../../utils/qr';
import { X, Download, Printer, QrCode, LogIn, Loader2, CheckCircle2 } from 'lucide-react';
import { playSuccessBeep } from '../../utils/sound';

interface ViewQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  attendance?: AttendanceRecord[];
  onAttendanceProcessed?: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
}

export const ViewQrModal: React.FC<ViewQrModalProps> = ({
  isOpen,
  onClose,
  member,
  attendance = [],
  onAttendanceProcessed
}) => {
  const [attendanceFeedback, setAttendanceFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || !member) return null;

  const handleDownload = () => {
    downloadQrCode(member.memberId, `qr-${member.memberId}.svg`);
  };

  const handlePrint = () => {
    printQrCode(member.memberId, member.fullName);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeRecord = (attendance || []).find(
    (a) =>
      (a.memberId === member.memberId ||
        a.memberId === member.id ||
        (member.id && a.memberId === String(member.id))) &&
      a.date === todayStr
  );
  const isCurrentlyInside = Boolean(activeRecord);

  // Directly scan this patron into Attendance (Time-In Only)
  const handleScanInAttendance = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // TIME IN
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId: member.memberId,
        memberName: member.fullName,
        membershipType: member.membershipType || 'Regular',
        date: now.toISOString().split('T')[0],
        timeIn: timeFormatted,
        status: 'Inside'
      };
      onAttendanceProcessed?.(newRecord, 'time_in');
      playSuccessBeep();
      setAttendanceFeedback(`✓ Scanned In: Time-In recorded at ${timeFormatted} (Inside Library)`);
    } catch {
      setAttendanceFeedback('Failed to log attendance. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--brand-forest)' }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Official Patron QR Code</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Municipal library identification & attendance scan token
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          {/* QR Display - Always pure white container for maximum camera & optical reader scannability */}
          <div
            data-qr-value={member.memberId}
            className="qr-modal-svg"
            style={{
              display: 'inline-block',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '2px solid var(--border-main)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              marginBottom: '16px'
            }}
          >
            <QrCodeSvg value={member.memberId} size={180} />
          </div>

          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {member.fullName}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-forest)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            {member.memberId}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span
              className={`badge ${
                member.status === 'active'
                  ? 'badge-success'
                  : member.status === 'inactive'
                  ? 'badge-warning'
                  : 'badge-danger'
              }`}
            >
              {member.status.toUpperCase()}
            </span>
            <span className="badge badge-neutral">{member.membershipType}</span>

            {/* Attendance Status Indicator */}
            {isCurrentlyInside ? (
              <span
                className="badge badge-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                <LogIn size={11} /> Timed In Today ({activeRecord?.timeIn})
              </span>
            ) : (
              <span
                className="badge badge-neutral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <LogIn size={11} /> Not Checked In Today
              </span>
            )}
          </div>

          {/* Feedback Banner after Scanning */}
          {attendanceFeedback && (
            <div
              style={{
                marginBottom: '14px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--success-bg, #f0fdf4)',
                color: 'var(--success-text, #166534)',
                border: '1px solid var(--success-border, #bbf7d0)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={15} />
              <span>{attendanceFeedback}</span>
            </div>
          )}

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Supported Operations:
            </div>
            <div>• Front-desk attendance kiosk scanner check-in / check-out</div>
            <div>• Book loans issuing and return barcode verification</div>
            <div>• Library patron resource reservation and verification</div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Attendance Scan Trigger Button */}
          {onAttendanceProcessed && (
            <button
              type="button"
              onClick={handleScanInAttendance}
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ flex: '1 1 100%', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}
            >
              {isProcessing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              <span>Scan in Attendance (Time-In)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
