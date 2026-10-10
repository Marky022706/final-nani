import React, { useState } from 'react';
import type { Book, Member } from '../../types';
import { Archive, ArchiveRestore, Trash2, BookOpen, UserCheck } from 'lucide-react';

interface ArchiveViewProps {
  books: Book[];
  members: Member[];
  onRestoreBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onRestoreMember: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
}

type ArchiveTab = 'books' | 'members';

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  books,
  members,
  onRestoreBook,
  onDeleteBook,
  onRestoreMember,
  onDeleteMember
}) => {
  const [activeTab, setActiveTab] = useState<ArchiveTab>('books');

  const archivedBooks = books.filter((b) => b.isArchived);
  const archivedMembers = members.filter((m) => m.isArchived);

  const handleDeleteBook = (book: Book) => {
    if (
      window.confirm(
        `Permanently delete "${book.title}" and its catalog records? This cannot be undone.`
      )
    ) {
      onDeleteBook(book.id);
    }
  };

  const handleDeleteMember = (member: Member) => {
    if (
      window.confirm(
        `Permanently delete member account "${member.fullName}" (${member.memberId})? This cannot be undone.`
      )
    ) {
      onDeleteMember(member.memberId);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Archive</div>
          <div className="page-subtitle">
            Books and member accounts that have been archived - restore them or delete permanently.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="card"
        style={{
          padding: '6px',
          marginBottom: '20px',
          display: 'flex',
          gap: '6px',
          width: 'fit-content'
        }}
      >
        <button
          onClick={() => setActiveTab('books')}
          className={`btn btn-sm ${activeTab === 'books' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: '6px' }}
        >
          <BookOpen size={15} />
          <span>Archived Books ({archivedBooks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`btn btn-sm ${activeTab === 'members' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: '6px' }}
        >
          <UserCheck size={15} />
          <span>Archived Members ({archivedMembers.length})</span>
        </button>
      </div>

      {/* Archived Books Table */}
      {activeTab === 'books' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Copies</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Archive size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <div>No archived books.</div>
                  </td>
                </tr>
              ) : (
                archivedBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      {book.subtitle && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{book.subtitle}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{book.author}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{book.isbn}</code>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{book.category}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{book.copies.length}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onRestoreBook(book.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          title="Restore this book to the active catalog"
                        >
                          <ArchiveRestore size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px', color: 'var(--danger)' }}
                          title="Permanently delete this book"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Archived Members Table */}
      {activeTab === 'members' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Membership Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Archive size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <div>No archived members.</div>
                  </td>
                </tr>
              ) : (
                archivedMembers.map((member) => (
                  <tr key={member.id || member.memberId}>
                    <td>
                      <code
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--brand-forest)',
                          fontSize: '12.5px'
                        }}
                      >
                        {member.memberId}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{member.fullName}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{member.email}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{member.membershipType}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onRestoreMember(member.memberId)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          title="Restore this member account"
                        >
                          <ArchiveRestore size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '5px 7px', color: 'var(--danger)' }}
                          title="Permanently delete this member account"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
