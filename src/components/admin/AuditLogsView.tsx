import React, { useState } from 'react';
import type { AuditLog } from '../../types';
import { Search } from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.timestamp.includes(searchTerm);

    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">System Audit Logs</div>
          <div className="page-subtitle">
            Immutable tracking of administrator actions, attendance corrections, cataloging, and circulation events
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search audit trail by action, details, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Attendance">Attendance</option>
          <option value="Books">Books</option>
          <option value="Members">Members</option>
          <option value="Circulation">Circulation</option>
          <option value="Admin">Admin</option>
          <option value="System">System</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Key</th>
              <th>Category</th>
              <th>Details / Change Log</th>
              <th>Performed By</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {log.timestamp}
                  </td>
                  <td>
                    <code style={{ fontSize: '11.5px', fontWeight: 600 }}>{log.action}</code>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{log.category}</span>
                  </td>
                  <td style={{ fontSize: '12.5px', maxWidth: '320px' }}>{log.details}</td>
                  <td style={{ fontWeight: 600, fontSize: '12.5px' }}>{log.performedBy}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                    {log.ipAddress || '127.0.0.1'}
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
