import React from 'react';
import type { Member, AttendanceRecord } from '../../types';
import { DailyUsersLogKiosk } from './DailyUsersLogKiosk';

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
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-dialog animate-modal-fade-in"
        style={{
          width: '100%',
          maxWidth: '1100px',
          padding: 0,
          border: 'none',
          backgroundColor: 'transparent',
          boxShadow: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DailyUsersLogKiosk
          members={members}
          activeAttendance={activeAttendance}
          onAttendanceProcessed={onAttendanceProcessed}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
