import React from 'react';
import { Pencil, Archive, ArchiveRestore, Trash2, X } from 'lucide-react';

interface BookSelectionToolbarProps {
  selectedCount: number;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onClearSelection: () => void;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canDelete: boolean;
  hasActiveBooks: boolean;
  hasArchivedBooks: boolean;
}

export const BookSelectionToolbar: React.FC<BookSelectionToolbarProps> = ({
  selectedCount,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onClearSelection,
  canEdit,
  canArchive,
  canRestore,
  canDelete,
  hasActiveBooks,
  hasArchivedBooks
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className="card book-selection-toolbar"
      style={{
        padding: '12px 18px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--brand-forest-light, #f0fdf4)',
        borderColor: 'var(--brand-forest-border, #bbf7d0)',
        boxShadow: '0 2px 8px rgba(6, 78, 59, 0.08)',
        transition: 'all 0.2s ease'
      }}
      role="region"
      aria-label="Book selection action toolbar"
    >
      {/* Left: Selection Count & Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          className="badge badge-success"
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            fontWeight: 700,
            backgroundColor: 'var(--brand-forest)',
            color: '#ffffff'
          }}
        >
          {selectedCount}
        </span>
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--brand-forest-dark, #064e3b)' }}>
          {selectedCount === 1 ? '1 book selected' : `${selectedCount} books selected`}
        </span>
        {hasArchivedBooks && hasActiveBooks && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            (Mixed active & archived)
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div
        className="selection-actions-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        {/* Edit Action (Single selection only) */}
        {canEdit && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
            style={{
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#ffffff'
            }}
            title="Edit selected book details"
          >
            <Pencil size={14} />
            <span>Edit</span>
          </button>
        )}

        {/* Archive Action (Active books) */}
        {canArchive && onArchive && (
          <button
            type="button"
            onClick={onArchive}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color, #cbd5e1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            title={selectedCount === 1 ? 'Archive selected book' : `Archive ${selectedCount} books`}
          >
            <Archive size={14} />
            <span>Archive</span>
          </button>
        )}

        {/* Restore Action (Archived books) */}
        {canRestore && onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: 'var(--brand-forest)',
              border: '1px solid var(--border-color, #cbd5e1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            title={selectedCount === 1 ? 'Restore book to active catalog' : `Restore ${selectedCount} books`}
          >
            <ArchiveRestore size={14} />
            <span>Restore</span>
          </button>
        )}

        {/* Delete Action (Strictly allowed ONLY when ALL selected books are archived) */}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--danger, #dc2626)',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
            }}
            title={selectedCount === 1 ? 'Permanently delete archived book' : `Permanently delete ${selectedCount} archived books`}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        )}

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="btn btn-ghost btn-sm"
          style={{
            gap: '4px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            padding: '5px 8px'
          }}
          title="Deselect all books"
        >
          <X size={14} />
          <span>Clear selection</span>
        </button>
      </div>
    </div>
  );
};
