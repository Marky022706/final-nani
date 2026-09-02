import React from 'react';
import type { CirculationTransaction } from '../../types';
import { X, Printer, CheckCircle2, BookOpen, Calendar, UserCheck, ShieldCheck } from 'lucide-react';

interface LoanSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CirculationTransaction | null;
}

export const LoanSlipModal: React.FC<LoanSlipModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '95%' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                Book Successfully Borrowed!
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Official Municipal Library Circulation Receipt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Printable Ticket Box */}
          <div
            style={{
              border: '2px dashed var(--border-main)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              backgroundColor: 'var(--bg-subtle)',
              marginBottom: '20px'
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Municipality of Balingasag
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Balingasag Public Library
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Circulation Desk • Official Loan Slip
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Transaction ID</span>
                <code style={{ fontWeight: 700, fontSize: '12px' }}>{transaction.id}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Date Issued</span>
                <strong style={{ color: 'var(--text-primary)' }}>{transaction.borrowDate}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Patron Information
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                {transaction.memberName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Member ID: <code>{transaction.memberId}</code>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                Book Borrowed
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                {transaction.bookTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                by {transaction.bookAuthor}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>Accession: <code>{transaction.accessionNumber}</code></span>
                <span>Barcode: <code>{transaction.barcode}</code></span>
              </div>
            </div>

            {/* Prominent Due Date Banner */}
            <div
              style={{
                backgroundColor: 'var(--accent-blue-light)',
                border: '1px solid var(--accent-blue-border)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' }}>
                Scheduled Due Date
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-forest)', marginTop: '2px' }}>
                {transaction.dueDate}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Please return or renew on or before this date to avoid overdue fines.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span>Processed By: {transaction.processedBy}</span>
              <span>Status: Active Loan</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Printer size={15} />
              <span>Print Loan Slip</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <BookOpen size={15} />
              <span>Issue Another Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
