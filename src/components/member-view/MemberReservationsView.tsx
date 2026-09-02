import React from 'react';
import type { BookReservation } from '../../types';
import { BookOpen } from 'lucide-react';

interface MemberReservationsViewProps {
  reservations: BookReservation[];
  currentMemberId: string;
  onCancelReservation: (resId: string) => void;
  onNavigate: (dest: string) => void;
}

export const MemberReservationsView: React.FC<MemberReservationsViewProps> = ({
  reservations,
  currentMemberId,
  onCancelReservation,
  onNavigate
}) => {
  const memberReservations = reservations.filter((r) => r.memberId === currentMemberId);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Book Reservations</div>
          <div className="page-subtitle">
            Track waiting queues for checked-out books and hold pickup alerts
          </div>
        </div>

        <div className="page-actions">
          <button onClick={() => onNavigate('books')} className="btn btn-primary btn-sm">
            <BookOpen size={16} />
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {memberReservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p>You have no active book reservations.</p>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
              When a book is currently borrowed by another patron, you can place a reservation hold from the catalog.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Reservation Placed</th>
                  <th>Hold Expiry</th>
                  <th>Queue Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberReservations.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600 }}>{res.bookTitle}</td>
                    <td>{res.reservationDate}</td>
                    <td>{res.expiryDate}</td>
                    <td>
                      {res.status === 'Ready for Pickup' ? (
                        <div>
                          <span className="badge badge-success">Ready for Pickup</span>
                          <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '2px', fontWeight: 500 }}>
                            Available at Circulation Desk
                          </div>
                        </div>
                      ) : res.status === 'Pending Approval' ? (
                        <div>
                          <span className="badge badge-warning">Awaiting Approval</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Queued for Librarian Review
                          </div>
                        </div>
                      ) : res.status === 'Waiting' ? (
                        <span className="badge badge-info">Queue Position #{res.queuePosition}</span>
                      ) : (
                        <span className="badge badge-neutral">{res.status}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {res.status !== 'Claimed' && res.status !== 'Cancelled' && (
                        <button
                          onClick={() => onCancelReservation(res.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                        >
                          Cancel Hold
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
