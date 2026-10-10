import React from 'react';
import {
  ExternalLink,
  QrCode,
  BookOpen,
  UserPlus,
  Repeat,
  Clock,
  BarChart3,
  Globe,
  GraduationCap,
  Landmark,
  Library,
  HelpCircle
} from 'lucide-react';
import type { UserRole } from '../../types';

interface QuickLinksWidgetProps {
  userRole?: UserRole;
  onNavigate: (dest: string) => void;
  onOpenScanner?: () => void;
  onOpenAddBook?: () => void;
  onOpenCreateMember?: () => void;
}

interface ExternalLinkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export const EXTERNAL_QUICK_LINKS: ExternalLinkItem[] = [
  {
    id: 'nlp',
    title: 'National Library of the Philippines (NLP)',
    category: 'National Repository',
    description: 'Official national library portal, legal deposit rules, and union catalog standards.',
    url: 'https://web.nlp.gov.ph/',
    badge: 'Official NLP',
    icon: Landmark
  },
  {
    id: 'starbooks',
    title: 'DOST STARBOOKS Digital Library',
    category: 'Science & Technology',
    description: 'Science and Technology Academic and Research-Based Openly Operated Kiosks.',
    url: 'https://starbooks.ph/',
    badge: 'DOST Portal',
    icon: GraduationCap
  },
  {
    id: 'dewey',
    title: 'Dewey Decimal Classification (WebDewey / OCLC)',
    category: 'Cataloging Reference',
    description: 'Universal standard library classification schedule and DDC summaries for books.',
    url: 'https://dewey.org/',
    badge: 'DDC Standards',
    icon: BookOpen
  },
  {
    id: 'balingasag-lgu',
    title: 'LGU Balingasag Municipal Portal',
    category: 'Local Government',
    description: 'Official municipal government ordinances, community bulletins, and public notices.',
    url: 'https://balingasag.gov.ph/',
    badge: 'LGU Portal',
    icon: Library
  },
  {
    id: 'openlibrary',
    title: 'Open Library / Internet Archive',
    category: 'Global Catalog',
    description: 'Open, editable library catalog database with over 20 million bibliographic records.',
    url: 'https://openlibrary.org/',
    badge: 'Open Metadata',
    icon: Globe
  },
  {
    id: 'deped-commons',
    title: 'DepEd Commons & Academic Resources',
    category: 'Public Education',
    description: 'Curated digital learning materials and textbook references for student patrons.',
    url: 'https://commons.deped.gov.ph/',
    badge: 'DepEd OER',
    icon: GraduationCap
  }
];

export const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({
  userRole = 'admin',
  onNavigate,
  onOpenScanner,
  onOpenAddBook,
  onOpenCreateMember
}) => {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Quick Links & Operational Shortcuts
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Essential internal workflows and verified municipal/academic research portals
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('help_support')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px' }}
        >
          <HelpCircle size={14} />
          <span>User Guides & Support →</span>
        </button>
      </div>

      {/* Internal System Shortcuts */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Internal System Shortcuts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="quick-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534' }}>
                <QrCode size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Attendance Scanner</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scan patron QR entry/exit</div>
              </div>
            </button>
          )}

          {userRole !== 'super_admin' && (
            <button
              type="button"
              onClick={() => onNavigate('circulation')}
              className="quick-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                <Repeat size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Circulation Desk</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Issue loans & returns</div>
              </div>
            </button>
          )}

          {onOpenAddBook && (
            <button
              type="button"
              onClick={onOpenAddBook}
              className="quick-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                <BookOpen size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Acquire New Book</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ISBN cataloging lookup</div>
              </div>
            </button>
          )}

          {onOpenCreateMember && (
            <button
              type="button"
              onClick={onOpenCreateMember}
              className="quick-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fce7f3', color: '#9d174d' }}>
                <UserPlus size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Register Member</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generate digital QR card</div>
              </div>
            </button>
          )}

          {userRole !== 'volunteer' && userRole !== 'member' && (
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="quick-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                <BarChart3 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Reports</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Export circulation data</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* External Verified Shortcuts */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          National & Academic Research Shortcuts
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {EXTERNAL_QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '11px 13px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease'
                }}
                className="external-quick-link-card"
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', height: 'fit-content' }}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.title}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                      {item.description}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>
                <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
