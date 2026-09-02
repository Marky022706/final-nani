import React from 'react';
import type { CirculationTransaction } from '../../types';
import { BookOpen, RefreshCw, Clock, XCircle } from 'lucide-react';

interface MyBooksViewProps {
  transactions: CirculationTransaction[];
  currentMemberId: string;
  onRenewBook: (transactionId: string) => { success: boolean; message: string };
  onCancelBorrowRequest?: (transactionId: string) => void;
  onNavigate: (dest: string) => void;
}

export const MyBooksView: React.FC<MyBooksViewProps> = ({
  transactions,
  currentMemberId,
  onRenewBook,
  onCancelBorrowRequest,
  onNavigate
}) => {
  const memberTransactions = transactions.filter((t) => t.memberId === currentMemberId);
  const pendingRequests = memberTransactions.filter((t) => t.status === 'Pending Approval');
  const activeLoans = memberTransactions.filter((t) => t.status === 'Active' || t.status === 'Overdue');
  const pastLoans = memberTransactions.filter((t) => t.status === 'Returned' || t.status === 'Rejected');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Borrowed Books</div>
          <div className="page-subtitle">
            Borrow requests, active loans, upcoming due dates, and renewal privileges
          </div>
        </div>

        <div className="page-actions">
          <button onClick={() => onNavigate('books')} className="btn btn-primary btn-sm">
            <BookOpen size={16} />
            <span>Search & Borrow Books</span>
          </button>
        </div>
      </div>

      {/* Pending Borrow Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} color="var(--warning)" />
            <h3 style={{ fontSize: '16px' }}>
              Pending Borrow Requests ({pendingRequests.length})
            </h3>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Your borrow requests are submitted and waiting for administrator / librarian approval. Once approved, the book will be ready for you.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span className="badge badge-warning">Awaiting Approval</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Accession: <code>{req.accessionNumber}</code>
                    </span>
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {req.bookTitle}
                  </h4>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    by {req.bookAuthor}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Requested On:</span>
                    <span>{req.requestDate || req.borrowDate}</span>
                  </div>
                  {onCancelBorrowRequest && (
                    <button
                      onClick={() => onCancelBorrowRequest(req.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', fontSize: '12px' }}
                    >
                      <XCircle size={13} />
                      <span>Cancel Borrow Request</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Loans */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>
          Currently Borrowed ({activeLoans.length} of 3 Allowed)
        </h3>

        {activeLoans.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>You currently do not have any borrowed books.</p>
            <button
              onClick={() => onNavigate('books')}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '12px' }}
            >
              Browse Library Catalog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: loan.status === 'Overdue' ? 'var(--danger-bg)' : 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className={`badge ${loan.status === 'Overdue' ? 'badge-danger' : 'badge-info'}`}>
                      {loan.status === 'Overdue' ? 'Overdue' : 'Active Loan'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Accession: <code>{loan.accessionNumber}</code>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {loan.bookTitle}
                  </h4>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    by {loan.bookAuthor}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Borrowed on:</span>
                    <span>{loan.borrowDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>
                    <strong style={{ color: loan.status === 'Overdue' ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {loan.dueDate}
                    </strong>
                  </div>

                  <button
                    onClick={() => onRenewBook(loan.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <RefreshCw size={13} />
                    <span>Renew Loan (Extend 14 Days)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Borrow History */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Borrowing History</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Barcode</th>
                <th>Borrow Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastLoans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No returned books yet.
                  </td>
                </tr>
              ) : (
                pastLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 600 }}>{loan.bookTitle}</td>
                    <td><code>{loan.barcode}</code></td>
                    <td>{loan.borrowDate}</td>
                    <td>
                      <span className={`badge ${loan.status === 'Rejected' ? 'badge-danger' : 'badge-neutral'}`}>
                        {loan.status === 'Rejected' ? 'Declined' : 'Returned'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
