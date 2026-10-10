import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Headphones,
  FileText,
  Search,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Repeat,
  UserCheck
} from 'lucide-react';
import type { User, UserRole } from '../../types';
import { EXTERNAL_QUICK_LINKS } from '../common/QuickLinksWidget';

interface HelpSupportViewProps {
  currentUser?: User;
  onNavigate: (dest: string) => void;
  onShowToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

interface UserGuideArticle {
  id: string;
  category: string;
  title: string;
  targetRole: string;
  readTime: string;
  summary: string;
  steps: string[];
  tips: string;
}

const USER_GUIDES: UserGuideArticle[] = [
  {
    id: 'guide-circ',
    category: 'Desk Operations',
    title: 'Daily Book Circulation: Borrowing, Issuing & Returns',
    targetRole: 'Admin & Volunteer Staff',
    readTime: '3 min read',
    summary: 'Standard Operating Procedure (SOP) for issuing loans, processing returns, and verifying member barcodes.',
    steps: [
      'Navigate to "Circulation" from the sidebar navigation or click "+ Issue Book Loan" on the dashboard.',
      'To issue a loan: Select the registered patron by name or Member ID, input/scan the book barcode (e.g. BPL-000101), select the return due date, and click "Confirm & Issue Loan".',
      'To record a return: Switch to the "Return Books" tab, scan the physical copy barcode, inspect book condition, settle any overdue fees if applicable, and confirm the check-in.',
      'Print or issue the Loan Slip to the patron for their reference.'
    ],
    tips: 'Tip: For high foot-traffic hours, use the USB/Bluetooth Barcode Scanner mode for instant zero-keystroke book check-in.'
  },
  {
    id: 'guide-att',
    category: 'Attendance & Entry',
    title: 'Patron QR Attendance & Daily Municipal Foot-Traffic',
    targetRole: 'All Staff Roles',
    readTime: '2 min read',
    summary: 'Procedures for logging patron library visits, quiet room usage, and municipal compliance reporting.',
    steps: [
      'Click "Attendance Scanner" in the top header or navigate to the "Attendance" view.',
      'Scan the patron’s Digital Library Card QR code using a webcam, scanner, or type their Member ID.',
      'The system automatically records "Time In" and updates the live "Currently Inside Library" counter.',
      'When the patron exits, scan their card again to record "Time Out" and calculate visit duration.'
    ],
    tips: 'Tip: Patrons who forgot their card can be looked up instantly by full name in the Attendance search bar.'
  },
  {
    id: 'guide-books',
    category: 'Cataloging',
    title: 'Book Acquisition & Dewey Decimal Classification',
    targetRole: 'Head Librarian & Staff',
    readTime: '4 min read',
    summary: 'Guidelines for cataloging newly acquired municipal books, entering ISBNs, and tagging physical shelf copies.',
    steps: [
      'Click "+ Add Book (ISBN)" from the dashboard or "Book Catalog" view.',
      'Enter the 10 or 13-digit ISBN number to automatically fetch book title, author, publisher, and cover metadata from Open Library / Google Books.',
      'Assign the Dewey Decimal classification number (e.g., 005.13 for Computer Science, 800 for Literature, 959.9 for Philippine History).',
      'Specify the physical accession barcodes (e.g. BPL-000101) and designated shelf location (e.g. Shelf A-2).'
    ],
    tips: 'Tip: Books with multiple physical copies can have additional barcodes added at any time via the book details card.'
  },
  {
    id: 'guide-privs',
    category: 'Security & Access',
    title: 'Staff Authorization & Volunteer Privileges Management',
    targetRole: 'Super Admin & Head Librarian',
    readTime: '3 min read',
    summary: 'How to provision volunteer accounts, grant temporary desk authorizations, and monitor access audits.',
    steps: [
      'Open "User & Access Management" from the sidebar navigation.',
      'Locate the staff account (e.g. Volunteer Staff) and click the "Privileges" action button.',
      'Check or uncheck granular privileges: Circulation Desk, Attendance & Services, Inventory & Cataloging, Member Accounts, or Reports.',
      'Click "Save Privileges" — permission changes apply immediately to their sidebar and dashboard.'
    ],
    tips: 'Tip: When Head Librarian Ms. Arquita is unavailable, verify that Volunteer Staff has active Attendance and Circulation privileges for smooth relief operations.'
  }
];

const FAQS = [
  {
    q: 'How do I handle a lost or damaged book reported by a patron?',
    a: 'Navigate to "Circulation" > "Active Loans", locate the active transaction, and update the book copy condition to "Damaged" or "Lost". An administrative incident note will be logged in the system audit registry.'
  },
  {
    q: 'Can a Volunteer Staff account edit system settings or backup files?',
    a: 'No. Volunteer accounts are restricted strictly to front-desk relief (Attendance, Circulation, and Member lookup). System Settings and database infrastructure are exclusively guarded for Superadmin.'
  },
  {
    q: 'What is the default loan period for municipal students?',
    a: 'Under standard Balingasag Municipal Library policy, student members may borrow up to 3 books concurrently for a period of 7 days, with 1 grace day before overdue fines accrue.'
  },
  {
    q: 'How do I generate a digital library card with QR code for a new member?',
    a: 'Go to "Manage Members", click "+ Register Member", fill out the patron details, and click "Save & Generate Card". You can immediately preview or print the official Balingasag Library ID card with barcode and QR.'
  },
  {
    q: 'Where do I report hardware scanner issues or software bugs?',
    a: 'Use the Help Desk Resources tab on this page to submit an automated support ticket directly to the Municipal Information Office (MIO).'
  }
];

export const HelpSupportView: React.FC<HelpSupportViewProps> = ({
  currentUser,
  onNavigate,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'helpdesk' | 'faq' | 'shortcuts'>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<UserGuideArticle | null>(USER_GUIDES[0]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Hardware Scanner / Barcode');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filteredGuides = USER_GUIDES.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setSubmittedSuccess(true);
      if (onShowToast) {
        onShowToast(
          'success',
          'Support Ticket Logged',
          `Ticket #${Math.floor(1000 + Math.random() * 9000)} dispatched to Municipal IT Help Desk.`
        );
      }
      setTicketSubject('');
      setTicketMessage('');
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={24} color="var(--primary-green)" />
            <span>Help & Support Center</span>
          </div>
          <div className="page-subtitle">
            Balingasag Municipal Library Management System • User Guides, Help Desk Resources & Operational Shortcuts
          </div>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => setActiveTab('helpdesk')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Headphones size={15} />
            <span>Contact Help Desk</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
          style={{ gap: '8px' }}
        >
          <BookOpen size={16} />
          <span>User Guides & SOPs ({USER_GUIDES.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('helpdesk')}
          className={`tab-btn ${activeTab === 'helpdesk' ? 'active' : ''}`}
          style={{ gap: '8px' }}
        >
          <Headphones size={16} />
          <span>Help Desk & IT Support</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          style={{ gap: '8px' }}
        >
          <FileText size={16} />
          <span>Frequently Asked Questions ({FAQS.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shortcuts')}
          className={`tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
          style={{ gap: '8px' }}
        >
          <ExternalLink size={16} />
          <span>Quick Links Directory</span>
        </button>
      </div>

      {/* TAB 1: USER GUIDES & SOPS */}
      {activeTab === 'guides' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'flex-start' }}>
          {/* Guide Selector Column */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search procedures..."
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredGuides.map((guide) => {
                const isSelected = selectedGuide?.id === guide.id;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuide(guide)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1.5px solid var(--primary-green)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--light-green)' : 'var(--bg-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {guide.category}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{guide.readTime}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      {guide.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guide Reader Content */}
          {selectedGuide ? (
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>{selectedGuide.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target: {selectedGuide.targetRole}</span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedGuide.title}
                  </h2>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedGuide.readTime}</span>
              </div>

              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                {selectedGuide.summary}
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Step-by-Step Procedure:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {selectedGuide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-green)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: '#1e40af',
                  fontSize: '13px'
                }}
              >
                <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{selectedGuide.tips}</span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a user guide to read instructions.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HELP DESK & IT SUPPORT */}
      {activeTab === 'helpdesk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Helpdesk Contact Directory Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Municipal Library Help Desk
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Direct contact channels for technical difficulties, scanner hardware repair, and system administration issues.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Support Email</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>library-support@balingasag.gov.ph</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Alternative: it.support@balingasag.gov.ph</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Municipal Telephony / Hotline</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>(088) 333-2145 (Local Ext. 104)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Direct Line to Library Administration</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Desk Service Hours</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Monday to Friday • 8:00 AM – 5:00 PM (PST)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Closed on National & Municipal Holidays</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Physical Helpdesk Station</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>2nd Floor, Municipal Hall Compound</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Poblacion 1, Balingasag, Misamis Oriental</div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-main)',
                fontSize: '12.5px',
                color: 'var(--text-secondary)'
              }}
            >
              <strong>Emergency IT Escalation:</strong> For urgent system outages during peak hours, contact Eleanor Vance (Municipal Information Office) via Extension 101.
            </div>
          </div>

          {/* Submit Support Ticket Form */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Submit a Support Request
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Need assistance with cataloging, barcode hardware, or user accounts? Send a ticket to our IT desk.
            </p>

            {submittedSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: 'var(--radius-md)',
                  color: '#166534',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Your request has been received. Our IT team will contact you shortly.</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Subject / Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barcode scanner not detecting BPL accession stickers"
                  className="form-input"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                  >
                    <option value="Hardware Scanner / Barcode">Hardware Scanner / Barcode</option>
                    <option value="Circulation & Loans">Circulation & Loans</option>
                    <option value="Cataloging & Books">Cataloging & Books</option>
                    <option value="Member QR & ID Cards">Member QR & ID Cards</option>
                    <option value="Account Permissions">Account Permissions</option>
                    <option value="System Bug / Network">System Bug / Network</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                  >
                    <option value="Low">Low - General Inquiry</option>
                    <option value="Normal">Normal - Standard Request</option>
                    <option value="High">High - Desk Operation Blocker</option>
                    <option value="Critical">Critical - System Outage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description & Error Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide steps to reproduce the issue, patron ID or book accession numbers involved..."
                  className="form-textarea"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <Send size={15} />
                  <span>{isSubmittingTicket ? 'Submitting Request…' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: FAQS */}
      {activeTab === 'faq' && (
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Frequently Asked Questions (FAQ)
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Standard operational answers for common library scenarios in Balingasag
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {faq.q}
                    </span>
                    {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                  </button>
                  {isExpanded && (
                    <div
                      style={{
                        padding: '14px 18px',
                        borderTop: '1px solid var(--border-subtle)',
                        backgroundColor: '#ffffff',
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: QUICK LINKS DIRECTORY */}
      {activeTab === 'shortcuts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Internal Workflows */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
              Direct Internal Workflow Shortcuts
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Quickly jump to primary library functions across departments:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <button
                type="button"
                onClick={() => onNavigate('circulation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534' }}>
                  <Repeat size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Circulation Desk Hub</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Issue loans, returns, and approvals</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                  <QrCode size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Attendance Monitoring</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Scan QR entry & exit logs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('books')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Book Catalog & Inventory</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Lookup titles, ISBNs, shelf copies</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('members')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fce7f3', color: '#9d174d' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>Member Registration</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Patron accounts & digital cards</div>
                </div>
              </button>
            </div>
          </div>

          {/* External Portals Directory */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
              National & Regional Verified Library Portals
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Authoritative external portals for reference and research assistance:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {EXTERNAL_QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '14px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-main)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                    className="external-quick-link-card"
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                          <Icon size={16} />
                        </div>
                        <ExternalLink size={14} color="var(--text-muted)" />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {link.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {link.description}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                        {link.badge}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
