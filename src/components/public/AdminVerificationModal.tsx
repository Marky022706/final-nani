import React from 'react';
import { X, ShieldCheck, Mail, Phone, Clock, FileText } from 'lucide-react';

interface AdminVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminVerificationModal: React.FC<AdminVerificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 77, 50, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(23, 77, 50, 0.35)',
          border: '1px solid #E8F3E8',
          padding: '28px 32px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#E8F3E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#174D32'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 id="verification-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: '#174D32', margin: 0 }}>
                Administrator Content Verification
              </h2>
              <p style={{ fontSize: '12.5px', color: '#667166', margin: '2px 0 0' }}>
                Balingasag Municipal Library — Transparency & Public Verification Checklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#667166',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice */}
        <div
          style={{
            backgroundColor: '#F5F1E8',
            borderLeft: '4px solid #228B22',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#202820',
            lineHeight: 1.5
          }}
        >
          <strong>Notice for Municipal Staff & Visitors:</strong> In accordance with public information verification guidelines, unverified data is distinctly labeled. Please review the verification status of published information below.
        </div>

        {/* Verification Items Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Item 1: NLP Directory Contact */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #E8F3E8',
              backgroundColor: '#FAFAF8',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <Phone size={18} style={{ color: '#228B22', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#202820' }}>
                  Librarian Mobile (0916 153 5744)
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Pending Annual Confirmation
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#667166', margin: '4px 0 0', lineHeight: 1.4 }}>
                Sourced from the National Library of the Philippines (NLP) Directory (June 2025). Staff should confirm if this remains the active official line.
              </p>
            </div>
          </div>

          {/* Item 2: Email */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #E8F3E8',
              backgroundColor: '#FAFAF8',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <Mail size={18} style={{ color: '#228B22', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#202820' }}>
                  Official Email (anita.arquita@yahoo.com)
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Pending Confirmation
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#667166', margin: '4px 0 0', lineHeight: 1.4 }}>
                Listed in the NLP Directory. If a dedicated government email (e.g. @balingasag.gov.ph) is preferred, administrator can update via system settings.
              </p>
            </div>
          </div>

          {/* Item 3: Mission, Vision, Goals & Objectives */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #E8F3E8',
              backgroundColor: '#FAFAF8',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <FileText size={18} style={{ color: '#228B22', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#202820' }}>
                  Mission, Vision, Goals & Objectives
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Officially Adopted
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#667166', margin: '4px 0 0', lineHeight: 1.4 }}>
                Fully aligned with the official municipal mandate of Balingasag, including the 5 Strategic Goals and 8 Actionable Objectives.
              </p>
            </div>
          </div>

          {/* Item 4: Operating Hours */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #E8F3E8',
              backgroundColor: '#FAFAF8',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <Clock size={18} style={{ color: '#228B22', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#202820' }}>
                  Standard Public Hours (Mon–Fri, 8:00 AM – 5:00 PM)
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Standard Government Schedule
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#667166', margin: '4px 0 0', lineHeight: 1.4 }}>
                Follows official Philippine Local Government Unit office hours (excluding declared national and local holidays).
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              backgroundColor: '#174D32',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
