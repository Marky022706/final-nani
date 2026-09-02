import React, { useState } from 'react';
import type { Member, UserRole } from '../../types';
import { LibraryCardModal } from './LibraryCardModal';
import { CreateMemberModal } from './CreateMemberModal';
import {
  Search,
  UserPlus,
  QrCode
} from 'lucide-react';

interface MemberListProps {
  members: Member[];
  userRole: UserRole;
  onMemberCreated: (member: Member) => void;
  onToggleStatus: (memberId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  userRole,
  onMemberCreated,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || member.membershipType === typeFilter;
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenCard = (member: Member) => {
    setSelectedMember(member);
    setIsCardModalOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Patron & Member Directory</div>
          <div className="page-subtitle">
            Manage registered library patrons, generate digital QR identification cards, and monitor status
          </div>
        </div>

        <div className="page-actions">
          {userRole !== 'member' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-sm">
              <UserPlus size={16} />
              <span>Register Member</span>
            </button>
          )}
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
            placeholder="Search member name, ID (e.g. MBR-000001), or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="All">All Types</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Researcher">Researcher</option>
            <option value="Community">Community</option>
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Member Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Member Details</th>
              <th>Member ID</th>
              <th>Type</th>
              <th>Barangay / Address</th>
              <th>Status</th>
              <th>Total Borrows</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No members found matching the filters.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={member.photoUrl}
                        alt={member.fullName}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontWeight: 600 }}>{member.memberId}</code>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{member.membershipType}</span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {member.address}
                  </td>
                  <td>
                    <span
                      className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{member.totalBorrows} loans</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenCard(member)}
                        className="btn btn-secondary btn-sm"
                        title="View Digital Library Card & QR"
                      >
                        <QrCode size={14} />
                        <span>Library Card</span>
                      </button>

                      {userRole !== 'member' && (
                        <button
                          onClick={() => onToggleStatus(member.id)}
                          className={`btn btn-sm ${member.status === 'active' ? 'btn-ghost' : 'btn-secondary'}`}
                          title={member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                        >
                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Library Card Modal */}
      <LibraryCardModal
        member={selectedMember}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMemberCreated={onMemberCreated}
        existingCount={members.length}
      />
    </div>
  );
};
