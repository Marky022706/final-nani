import React from 'react';
import type { Member, User } from '../../types';
import { QrCodeSvg } from '../../utils/qr';
import { Mail, Phone, MapPin, Printer, Library, ShieldCheck } from 'lucide-react';

interface MemberProfileViewProps {
  currentUser: User;
  members: Member[];
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  currentUser,
  members
}) => {
  const member = members.find((m) => m.memberId === currentUser.memberId) || members[0];

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Patron Profile & Digital Identification</div>
          <div className="page-subtitle">
            Registered membership credentials and scannable optical library identification
          </div>
        </div>

        <div className="page-actions">
          <button onClick={handlePrintCard} className="btn btn-primary btn-sm">
            <Printer size={15} />
            <span>Print Physical Card</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Personal Details */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Membership Information</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <img
              src={member.photoUrl}
              alt={member.fullName}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-main)' }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{member.fullName}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Patron ID: <code>{member.memberId}</code>
              </div>
              <span className="badge badge-success" style={{ marginTop: '4px' }}>
                {member.membershipType} • {member.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
              <strong>{member.email}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
              <span>{member.phone}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>Address:</span>
              <span>{member.address}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>Member Since:</span>
              <span>{member.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Digital Library Card Presentation */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Official Digital Library Card</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Scan at front desk scanner for Time-In / Time-Out attendance
            </div>
          </div>

          <div className="library-card-wrapper printable-card" style={{ width: '100%' }}>
            <div className="library-card-front">
              <div className="library-card-pattern" />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Library size={15} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Balingasag Public Library
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                  {member.membershipType.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  <img src={member.photoUrl} alt={member.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{member.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: <strong style={{ color: '#ffffff' }}>{member.memberId}</strong></div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <QrCodeSvg value={member.memberId} size={64} />
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                <span>Official Municipal ID</span>
                <span>STATUS: {member.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
