import React, { useState } from 'react';
import type { LibraryServiceItem, ServiceRecord, Member, UserRole } from '../../types';
import { RecordServiceModal } from './RecordServiceModal';
import {
  Layers,
  Search,
  Monitor,
  BookOpen,
  Printer,
  Landmark,
  Compass,
  Plus
} from 'lucide-react';

interface LibraryServicesViewProps {
  services: LibraryServiceItem[];
  serviceRecords: ServiceRecord[];
  members: Member[];
  userRole: UserRole;
  currentMemberId?: string;
  onServiceRecorded: (record: ServiceRecord) => void;
}

export const LibraryServicesView: React.FC<LibraryServicesViewProps> = ({
  services,
  serviceRecords,
  members,
  userRole,
  currentMemberId,
  onServiceRecorded
}) => {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Search':
        return <Search size={20} />;
      case 'Monitor':
        return <Monitor size={20} />;
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'Printer':
        return <Printer size={20} />;
      case 'Landmark':
        return <Landmark size={20} />;
      case 'Compass':
        return <Compass size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  const relevantRecords =
    userRole === 'member' && currentMemberId
      ? serviceRecords.filter((r) => r.memberId === currentMemberId)
      : serviceRecords;

  const filteredRecords = relevantRecords.filter((rec) =>
    rec.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Library Services & Facilities</div>
          <div className="page-subtitle">
            Official municipal library assistance programs, study resources, and digital workspaces
          </div>
        </div>

        {userRole !== 'member' && (
          <div className="page-actions">
            <button onClick={() => setIsRecordModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Record Service Usage</span>
            </button>
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {services.map((service) => (
          <div
            key={service.id}
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-blue-light)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {renderIcon(service.iconName)}
                </div>
                <span className="badge badge-success">Available</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {service.name}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                {service.category}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {service.description}
              </p>
            </div>

            {userRole !== 'member' && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setIsRecordModalOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={14} />
                  <span>Log Patron Usage</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Usage History Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>
              {userRole === 'member' ? 'My Library Services History' : 'Recent Service Logs'}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Registered patron assistance and resource utilization records
            </div>
          </div>

          <div style={{ minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search service logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '12.5px' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Patron</th>
                <th>Date & Time</th>
                <th>Notes / Specifics</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No service usage records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.serviceName}</div>
                    </td>
                    <td>
                      <div>{rec.memberName}</div>
                      <code style={{ fontSize: '11px' }}>{rec.memberId}</code>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {rec.date} • {rec.time}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      {rec.notes || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                      {rec.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Service Modal */}
      <RecordServiceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        members={members}
        services={services}
        onServiceRecorded={onServiceRecorded}
      />
    </div>
  );
};
