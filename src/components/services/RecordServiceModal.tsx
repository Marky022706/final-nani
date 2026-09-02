import React, { useState } from 'react';
import type { Member, LibraryServiceItem, ServiceRecord } from '../../types';
import { X, Layers, Plus } from 'lucide-react';

interface RecordServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  services: LibraryServiceItem[];
  onServiceRecorded: (record: ServiceRecord) => void;
}

export const RecordServiceModal: React.FC<RecordServiceModalProps> = ({
  isOpen,
  onClose,
  members,
  services,
  onServiceRecorded
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.memberId || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('2026-08-31');
  const [time, setTime] = useState<string>('03:30 PM');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.memberId === selectedMemberId);
    const service = services.find((s) => s.id === selectedServiceId);

    if (!member || !service) {
      alert('Please select both a valid member and library service.');
      return;
    }

    const newRecord: ServiceRecord = {
      id: `srvrec-${Date.now()}`,
      serviceId: service.id,
      serviceName: service.name,
      memberId: member.memberId,
      memberName: member.fullName,
      date,
      time,
      notes: notes.trim(),
      recordedBy: 'Roberto Gomez (Admin)'
    };

    onServiceRecorded(newRecord);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Record Library Service</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Document patron usage of academic, technology, and document facilities
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Select Patron / Member *</label>
              <select
                className="form-select"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.memberId}>
                    {m.fullName} ({m.memberId}) — {m.membershipType}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Official Library Service *</label>
              <select
                className="form-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time</label>
                <input
                  type="text"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 03:30 PM"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Service Notes / Details</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. PC Station #3 internet access for 1 hour; 10 pages thesis photocopying"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} />
              <span>Save Service Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
