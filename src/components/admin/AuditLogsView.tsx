import React, { useState, useMemo } from 'react';
import type { AuditLog } from '../../types';
import {
  Search,
  Download,
  Filter,
  ShieldCheck,
  Repeat,
  Clock,
  Users,
  RotateCcw
} from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Computed summary metrics
  const stats = useMemo(() => {
    return {
      total: auditLogs.length,
      circulation: auditLogs.filter((l) => l.category === 'Circulation').length,
      attendance: auditLogs.filter((l) => l.category === 'Attendance').length,
      adminAndSystem: auditLogs.filter((l) => l.category === 'Admin' || l.category === 'System').length,
      books: auditLogs.filter((l) => l.category === 'Books').length,
      members: auditLogs.filter((l) => l.category === 'Members').length
    };
  }, [auditLogs]);

  // Filter logic
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return auditLogs.filter((log) => {
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.timestamp.includes(q) ||
        (log.ipAddress && log.ipAddress.includes(q));

      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [auditLogs, searchTerm, categoryFilter]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action Key', 'Category', 'Details', 'Performed By', 'IP Address'];
    const rows = filtered.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.performedBy.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bpl_system_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Circulation':
        return { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' };
      case 'Attendance':
        return { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' };
      case 'Books':
        return { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' };
      case 'Members':
        return { bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' };
      case 'Admin':
        return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="#166534" />
            <span>System Log</span>
          </div>
          <div className="page-subtitle">
            Balingasag Municipal Public Library • System activity trail, administrator actions, attendance corrections, and circulation records
          </div>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Download CSV export of system logs"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#DCFCE7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Logs
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              color: '#15803D',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Repeat size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Circulation
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              {stats.circulation}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Attendance
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              {stats.attendance}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Admin & System
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
              {stats.adminAndSystem}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1 1 320px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search
              size={16}
              color="var(--text-subtle, #94A3B8)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder="Search system log by action, details, user, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-subtle, #94A3B8)" />
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories ({stats.total})</option>
              <option value="Circulation">Circulation ({stats.circulation})</option>
              <option value="Attendance">Attendance ({stats.attendance})</option>
              <option value="Books">Books ({stats.books})</option>
              <option value="Members">Members ({stats.members})</option>
              <option value="Admin">Admin</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>

        {(searchTerm || categoryFilter !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
            }}
            className="btn btn-ghost btn-sm"
            style={{ gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '170px' }}>Timestamp</th>
              <th style={{ width: '180px' }}>Action Key</th>
              <th style={{ width: '130px' }}>Category</th>
              <th>Details / Change Log</th>
              <th style={{ width: '170px' }}>Performed By</th>
              <th style={{ width: '130px' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={32} color="var(--text-subtle, #CBD5E1)" />
                    <div style={{ fontWeight: 600 }}>No system log entries found</div>
                    <div style={{ fontSize: '12.5px' }}>
                      Try adjusting your search criteria or clearing active category filters.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const badge = getCategoryBadgeStyle(log.category);
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {log.timestamp}
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          backgroundColor: '#F1F5F9',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#0F172A'
                        }}
                      >
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
                      {log.details}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                        {log.performedBy}
                      </div>
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
