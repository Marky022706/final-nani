import React, { useState } from 'react';
import type { Member, User, UserRole, AccountStatus } from '../../types';
import { LibraryCardModal } from './LibraryCardModal';
import { CreateMemberModal } from './CreateMemberModal';
import { MemberCreatedModal } from './MemberCreatedModal';
import { EditMemberModal } from './EditMemberModal';
import { ViewQrModal } from './ViewQrModal';
import { AdminResetPasswordModal } from './AdminResetPasswordModal';
import {
  Search,
  UserPlus,
  QrCode,
  Edit,
  Trash2,
  KeyRound,
  Eye,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface MemberListProps {
  members: Member[];
  userRole: UserRole;
  onMemberCreated: (member: Member, user: User, tempPass?: string) => void;
  onMemberUpdated: (member: Member) => void;
  onMemberDeleted: (memberId: string) => void;
  onToggleStatus: (memberId: string, newStatus?: AccountStatus) => void;
  onResetPassword: (memberId: string, newPass: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  userRole,
  onMemberCreated,
  onMemberUpdated,
  onMemberDeleted,
  onToggleStatus,
  onResetPassword
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);

  // Success Confirmation Modal
  const [createdMemberSummary, setCreatedMemberSummary] = useState<{
    member: Member;
    tempPass?: string;
  } | null>(null);

  // Delete Confirmation
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Filter logic: Search by Member ID, Name, Email, Contact Number
  const filteredMembers = members.filter((member) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      member.memberId.toLowerCase().includes(q) ||
      member.fullName.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q) ||
      (member.phone && member.phone.toLowerCase().includes(q));

    const matchesType = typeFilter === 'All' || member.membershipType === typeFilter;
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreated = (newMember: Member, newUser: User, tempPass?: string) => {
    onMemberCreated(newMember, newUser, tempPass);
    setIsCreateModalOpen(false);
    setCreatedMemberSummary({ member: newMember, tempPass });
  };

  const handleOpenView = (member: Member) => {
    setSelectedMember(member);
    setIsCardModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleOpenQr = (member: Member) => {
    setSelectedMember(member);
    setIsQrModalOpen(true);
  };

  const handleOpenResetPass = (member: Member) => {
    setSelectedMember(member);
    setIsResetPassModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      onMemberDeleted(memberToDelete.memberId);
      setMemberToDelete(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Manage Members</div>
          <div className="page-subtitle">
            Administer library patrons, issue unique optical QR IDs, control account statuses, and manage credentials
          </div>
        </div>

        <div className="page-actions">
          {userRole !== 'member' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <UserPlus size={16} />
              <span>+ Add Member</span>
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
        {/* Search Input */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by Member ID (e.g. BPL-2026-0001), Name, Email, or Contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="All">All Membership Types</option>
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Manage Members Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Member ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Date Registered</th>
              <th style={{ textAlign: 'right', minWidth: '220px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No members found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id || member.memberId}>
                  {/* 1. Member ID */}
                  <td>
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: 'var(--brand-forest)',
                        fontSize: '12.5px',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-main)'
                      }}
                    >
                      {member.memberId}
                    </code>
                  </td>

                  {/* 2. Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={member.photoUrl}
                        alt={member.fullName}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-main)'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.fullName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {member.membershipType}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. Email */}
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {member.email}
                  </td>

                  {/* 4. Contact */}
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {member.phone || '—'}
                  </td>

                  {/* 5. Status */}
                  <td>
                    <span
                      className={`badge ${
                        member.status === 'active'
                          ? 'badge-success'
                          : member.status === 'inactive'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {member.status.toUpperCase()}
                    </span>
                  </td>

                  {/* 6. Date Registered */}
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {member.joinDate}
                  </td>

                  {/* 7. Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* View */}
                      <button
                        onClick={() => handleOpenView(member)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '5px 7px' }}
                        title="View Member Card & Info"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit */}
                      {userRole !== 'member' && (
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px' }}
                          title="Edit Member Information"
                        >
                          <Edit size={15} />
                        </button>
                      )}

                      {/* View QR Code */}
                      <button
                        onClick={() => handleOpenQr(member)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '5px 7px' }}
                        title="View & Download QR Code"
                      >
                        <QrCode size={15} />
                      </button>

                      {/* Reset Password */}
                      {userRole !== 'member' && (
                        <button
                          onClick={() => handleOpenResetPass(member)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px' }}
                          title="Reset Member Password"
                        >
                          <KeyRound size={15} />
                        </button>
                      )}

                      {/* Activate / Deactivate Toggle */}
                      {userRole !== 'member' && (
                        <button
                          onClick={() =>
                            onToggleStatus(
                              member.memberId,
                              member.status === 'active' ? 'inactive' : 'active'
                            )
                          }
                          className={`btn btn-sm ${
                            member.status === 'active' ? 'btn-ghost' : 'btn-secondary'
                          }`}
                          style={{ fontSize: '11.5px', padding: '3px 8px' }}
                          title={
                            member.status === 'active'
                              ? 'Deactivate Member Account'
                              : 'Activate Member Account'
                          }
                        >
                          {member.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}

                      {/* Delete */}
                      {userRole !== 'member' && (
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px', color: 'var(--danger)' }}
                          title="Delete Member Account"
                        >
                          <Trash2 size={15} />
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

      {/* Library Card Modal (View) */}
      <LibraryCardModal
        member={selectedMember}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMemberCreated={handleCreated}
        existingCount={members.length}
      />

      {/* Created Confirmation Modal */}
      <MemberCreatedModal
        isOpen={!!createdMemberSummary}
        onClose={() => setCreatedMemberSummary(null)}
        member={createdMemberSummary?.member || null}
        temporaryPassword={createdMemberSummary?.tempPass}
        onViewMember={(m) => {
          setCreatedMemberSummary(null);
          handleOpenView(m);
        }}
        onPrintCard={(m) => {
          setCreatedMemberSummary(null);
          handleOpenView(m);
        }}
        onCreateAnother={() => {
          setCreatedMemberSummary(null);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={selectedMember}
        onSave={onMemberUpdated}
      />

      {/* View QR Code Modal */}
      <ViewQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        member={selectedMember}
      />

      {/* Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        member={selectedMember}
        onConfirmReset={onResetPassword}
      />

      {/* Delete Confirmation Dialog */}
      {memberToDelete && (
        <div className="modal-overlay" onClick={() => setMemberToDelete(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>
                  Confirm Member Deletion
                </h3>
              </div>
              <button onClick={() => setMemberToDelete(null)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <p style={{ marginBottom: '10px' }}>
                Are you sure you want to permanently delete member account:
              </p>
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{memberToDelete.fullName}</div>
                <div style={{ fontSize: '12px', color: 'var(--brand-forest)', fontFamily: 'var(--font-mono)' }}>
                  {memberToDelete.memberId}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{memberToDelete.email}</div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--danger)' }}>
                This action is irreversible and will remove associated digital cards and login access.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
              >
                <Trash2 size={15} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
