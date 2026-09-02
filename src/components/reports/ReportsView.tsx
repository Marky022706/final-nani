import React, { useState } from 'react';
import type {
  Book,
  Member,
  AttendanceRecord,
  CirculationTransaction,
  ServiceRecord
} from '../../types';
import {
  Printer,
  FileSpreadsheet
} from 'lucide-react';

interface ReportsViewProps {
  books: Book[];
  members: Member[];
  attendance: AttendanceRecord[];
  transactions: CirculationTransaction[];
  serviceRecords: ServiceRecord[];
  onTriggerExport: (format: 'pdf' | 'csv') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  books,
  members,
  attendance,
  transactions,
  serviceRecords,
  onTriggerExport
}) => {
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'books' | 'attendance' | 'circulation' | 'services'>('overview');

  const totalCopies = books.reduce((sum, b) => sum + b.copies.length, 0);
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const overdueTransactions = transactions.filter((t) => t.status === 'Overdue');

  const categoryCounts: Record<string, number> = {};
  books.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
  });

  const serviceCounts: Record<string, number> = {};
  serviceRecords.forEach((s) => {
    serviceCounts[s.serviceName] = (serviceCounts[s.serviceName] || 0) + 1;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Statistical Reports & Analytics</div>
          <div className="page-subtitle">
            Municipal library performance reports, circulation metrics, and patron engagement
          </div>
        </div>

        <div className="page-actions">
          <button onClick={() => onTriggerExport('csv')} className="btn btn-secondary btn-sm">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => onTriggerExport('pdf')} className="btn btn-primary btn-sm">
            <Printer size={15} />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedReportType('overview')}
          className={`btn btn-ghost ${selectedReportType === 'overview' ? 'active' : ''}`}
          style={{
            borderBottom: selectedReportType === 'overview' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: selectedReportType === 'overview' ? 600 : 500
          }}
        >
          Executive Summary
        </button>
        <button
          onClick={() => setSelectedReportType('books')}
          className={`btn btn-ghost ${selectedReportType === 'books' ? 'active' : ''}`}
          style={{
            borderBottom: selectedReportType === 'books' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: selectedReportType === 'books' ? 600 : 500
          }}
        >
          Book Inventory
        </button>
        <button
          onClick={() => setSelectedReportType('attendance')}
          className={`btn btn-ghost ${selectedReportType === 'attendance' ? 'active' : ''}`}
          style={{
            borderBottom: selectedReportType === 'attendance' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: selectedReportType === 'attendance' ? 600 : 500
          }}
        >
          Attendance Trends
        </button>
        <button
          onClick={() => setSelectedReportType('services')}
          className={`btn btn-ghost ${selectedReportType === 'services' ? 'active' : ''}`}
          style={{
            borderBottom: selectedReportType === 'services' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: selectedReportType === 'services' ? 600 : 500
          }}
        >
          Library Services Usage
        </button>
      </div>

      {/* REPORT CONTENT */}
      {selectedReportType === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Titles & Copies</span>
              <div className="stat-value">{books.length}</div>
              <div className="stat-footer">{totalCopies} physical copies registered</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Members</span>
              <div className="stat-value">{activeMembers}</div>
              <div className="stat-footer">{members.length} total patron accounts</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Monthly Attendance</span>
              <div className="stat-value">{attendance.length}</div>
              <div className="stat-footer">Visits logged in current period</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Overdue Rate</span>
              <div className="stat-value" style={{ color: overdueTransactions.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {transactions.length > 0 ? Math.round((overdueTransactions.length / transactions.length) * 100) : 0}%
              </div>
              <div className="stat-footer">{overdueTransactions.length} overdue items (No fines applied)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {/* Category Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15.5px', marginBottom: '16px' }}>Collection Distribution by Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const pct = Math.round((count / books.length) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                        <span>{cat}</span>
                        <strong>{count} titles ({pct}%)</strong>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent-blue)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service Usage Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15.5px', marginBottom: '16px' }}>Official Library Services Utilization</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(serviceCounts).map(([srv, count]) => {
                  const pct = Math.round((count / (serviceRecords.length || 1)) * 100);
                  return (
                    <div key={srv}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                        <span>{srv}</span>
                        <strong>{count} uses ({pct}%)</strong>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--success)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReportType === 'books' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Full Book Inventory Table</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Classification</th>
                  <th>Category</th>
                  <th>Physical Copies</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.title}</td>
                    <td>{b.author}</td>
                    <td><code>{b.isbn}</code></td>
                    <td>{b.classification}</td>
                    <td>{b.category}</td>
                    <td>{b.copies.length} copies</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'attendance' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Attendance Log Summary</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patron</th>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Time-In</th>
                  <th>Time-Out</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td style={{ fontWeight: 600 }}>{a.memberName}</td>
                    <td><code>{a.memberId}</code></td>
                    <td>{a.membershipType}</td>
                    <td>{a.timeIn}</td>
                    <td>{a.timeOut || 'Inside'}</td>
                    <td>{a.duration || 'In Progress'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'services' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Library Services Utilized</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Patron</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {serviceRecords.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.serviceName}</td>
                    <td>{s.memberName} ({s.memberId})</td>
                    <td>{s.date}</td>
                    <td>{s.time}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
