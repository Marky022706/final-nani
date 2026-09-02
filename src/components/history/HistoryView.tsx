import React, { useState } from 'react';
import type {
  CirculationTransaction,
  AttendanceRecord,
  ServiceRecord,
  UserRole
} from '../../types';
import { Search } from 'lucide-react';

interface HistoryViewProps {
  transactions: CirculationTransaction[];
  attendance: AttendanceRecord[];
  services: ServiceRecord[];
  userRole: UserRole;
  currentMemberId?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  attendance,
  services,
  userRole,
  currentMemberId
}) => {
  const [filterType, setFilterType] = useState<'all' | 'circulation' | 'attendance' | 'services'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  interface TimelineItem {
    id: string;
    type: 'Circulation' | 'Attendance' | 'Service';
    date: string;
    patronName: string;
    patronId: string;
    details: string;
    status: string;
  }

  const items: TimelineItem[] = [];

  // 1. Transactions
  const relTx = userRole === 'member' && currentMemberId
    ? transactions.filter((t) => t.memberId === currentMemberId)
    : transactions;

  relTx.forEach((tx) => {
    items.push({
      id: `tx-${tx.id}`,
      type: 'Circulation',
      date: tx.borrowDate,
      patronName: tx.memberName,
      patronId: tx.memberId,
      details: `Borrowed: "${tx.bookTitle}" (Barcode: ${tx.barcode})`,
      status: tx.status
    });
    if (tx.returnDate) {
      items.push({
        id: `ret-${tx.id}`,
        type: 'Circulation',
        date: tx.returnDate,
        patronName: tx.memberName,
        patronId: tx.memberId,
        details: `Returned: "${tx.bookTitle}" (Barcode: ${tx.barcode})`,
        status: 'Returned'
      });
    }
  });

  // 2. Attendance
  const relAtt = userRole === 'member' && currentMemberId
    ? attendance.filter((a) => a.memberId === currentMemberId)
    : attendance;

  relAtt.forEach((att) => {
    items.push({
      id: `att-${att.id}`,
      type: 'Attendance',
      date: att.date,
      patronName: att.memberName,
      patronId: att.memberId,
      details: `Library Visit: In ${att.timeIn} ${att.timeOut ? `• Out ${att.timeOut} (${att.duration || 'Completed'})` : '• Currently Inside'}`,
      status: att.status
    });
  });

  // 3. Services
  const relSrv = userRole === 'member' && currentMemberId
    ? services.filter((s) => s.memberId === currentMemberId)
    : services;

  relSrv.forEach((srv) => {
    items.push({
      id: `srv-${srv.id}`,
      type: 'Service',
      date: srv.date,
      patronName: srv.memberName,
      patronId: srv.memberId,
      details: `Used Service: ${srv.serviceName} ${srv.notes ? `(${srv.notes})` : ''}`,
      status: 'Completed'
    });
  });

  // Filter
  const filtered = items.filter((item) => {
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'circulation' && item.type === 'Circulation') ||
      (filterType === 'attendance' && item.type === 'Attendance') ||
      (filterType === 'services' && item.type === 'Service');

    const matchesSearch =
      item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patronName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patronId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            {userRole === 'member' ? 'My Library History' : 'Activity & Operations History'}
          </div>
          <div className="page-subtitle">
            Chronological audit of circulation transactions, facility attendance visits, and service usage
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search history by activity, patron, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="all">All Activities</option>
          <option value="circulation">Circulation Only</option>
          <option value="attendance">Attendance Visits</option>
          <option value="services">Library Services</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Patron / Member</th>
              <th>Activity Summary</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No activity history records found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                    <strong>{item.date}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.type === 'Circulation'
                          ? 'badge-info'
                          : item.type === 'Attendance'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.patronName}</div>
                    <code style={{ fontSize: '11px' }}>{item.patronId}</code>
                  </td>
                  <td style={{ fontSize: '13px' }}>{item.details}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === 'Overdue'
                          ? 'badge-danger'
                          : item.status === 'Completed' || item.status === 'Returned'
                          ? 'badge-neutral'
                          : 'badge-success'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
