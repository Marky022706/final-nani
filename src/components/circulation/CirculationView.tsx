import React, { useState } from 'react';
import type {
  CirculationTransaction,
  BookReservation,
  Book,
  PhysicalCopy,
  Member,
  UserRole
} from '../../types';
import { CirculationScannerModal } from './CirculationScannerModal';
import { LoanSlipModal } from './LoanSlipModal';
import { IssueLoanWizardModal } from './IssueLoanWizardModal';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';
import { CirculationSkeleton } from '../common/skeleton';
import { StorageService } from '../../utils/storage';
import { api } from '../../services/api';
import { playSuccessBeep } from '../../utils/sound';
import {
  Repeat,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  BookmarkCheck,
  RefreshCw,
  Clock,
  Check,
  X,
  QrCode,
  Barcode,
  XCircle,
  Layers,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

interface CirculationViewProps {
  transactions: CirculationTransaction[];
  reservations: BookReservation[];
  books: Book[];
  members: Member[];
  userRole: UserRole;
  currentMemberId?: string;
  isLoading?: boolean;
  onBorrowBook: (memberId: string, barcode: string, dueDate: string) => { success: boolean; message: string; transaction?: CirculationTransaction };
  onBorrowBooksBatch?: (memberId: string, barcodes: string[], dueDate: string) => { success: boolean; message: string; transactions?: CirculationTransaction[]; transaction?: CirculationTransaction };
  onReturnBook: (barcode: string) => { success: boolean; message: string; transaction?: CirculationTransaction };
  onRenewBook: (transactionId: string) => { success: boolean; message: string };
  onCancelReservation: (reservationId: string) => void;
  onApproveBorrow?: (transactionId: string) => void;
  onRejectBorrow?: (transactionId: string, reason?: string) => void;
  onApproveReservation?: (reservationId: string) => void;
  onRejectReservation?: (reservationId: string) => void;
  initialBarcode?: string | null;
  onClearInitialBarcode?: () => void;
}

interface InstructionsCardProps {
  lang: 'en' | 'ceb';
  onToggleLang: () => void;
}

const BorrowInstructionsCard: React.FC<InstructionsCardProps> = ({ lang, onToggleLang }) => {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-subtle, #f8fafc)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg, 16px)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {lang === 'en'
                ? 'How to Borrow Books — Step-by-Step Instructions'
                : 'Unsaon Paghulam ug Libro — Mga Lakang ug Giya'}
            </h4>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lang === 'en'
                ? 'Official Balingasag Public Library circulation process for issuing physical loans'
                : 'Opisyal nga pamaagi sa Balingasag Public Library sa pagpagawas sa mga libro'}
            </div>
          </div>
        </div>

        {/* Language Switcher Badge Button */}
        <button
          type="button"
          onClick={onToggleLang}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '999px',
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Switch language between English and Bisaya"
        >
          <span>🌐 {lang === 'en' ? 'English (Switch to Bisaya)' : 'Bisaya (Switch to English)'}</span>
        </button>
      </div>

      {/* 3 Step Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Step 1 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--brand-forest)',
                backgroundColor: 'var(--light-green)',
                border: '1px solid var(--light-green-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 01' : 'LAKANG 01'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <QrCode size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Scan Member QR Code' : 'I-scan ang QR Code sa Miyembro'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Patron presents their digital or physical library card. The system validates that their account is Active, has zero overdue fines, and is within the 3-book loan limit.'
              : 'Ipakita sa patron ang iyang digital o pisikal nga library ID. Susihoon sa sistema kung Active ang account, walay bayronon nga multa, ug wala milapas sa 3 ka libro nga limit.'}
          </p>
        </div>

        {/* Step 2 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--brand-forest)',
                backgroundColor: 'var(--light-green)',
                border: '1px solid var(--light-green-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 02' : 'LAKANG 02'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-forest)'
              }}
            >
              <Barcode size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Scan Book Physical Barcode' : 'I-scan ang Barcode sa Libro'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Locate the physical book on the library shelves. Scan the unique accession barcode on the title page or back cover to verify the copy is Available for lending.'
              : 'Kuhaa ang libro gikan sa estante. I-scan ang accession barcode sa unahan o luyo nga bahin sa libro aron masiguro nga Available pa kini.'}
          </p>
        </div>

        {/* Step 3 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--success)',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 03' : 'LAKANG 03'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)'
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Confirm Loan & Issue Slip' : 'Kumpirmaha & Ihatag ang Slip'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Review standard 7-day lending period. Click "Confirm Borrow" to log the loan, deduct copy from available shelf inventory, and print/issue the official loan slip.'
              : 'Susiha ang standard nga 7 ka adlaw nga due date. I-click ang Confirm Borrow aron ma-rekord ang transaksyon ug ma-print ang opisyal nga loan slip.'}
          </p>
        </div>
      </div>

      {/* Policy Callout - Structured & Readable */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-forest)', fontWeight: 700, fontSize: '13px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-green)' }} />
          <span>{lang === 'en' ? 'Borrowing Rules & Guidelines' : 'Mga Lagda sa Paghulam'}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: '999px',
              backgroundColor: 'var(--light-green)',
              color: 'var(--brand-forest)',
              border: '1px solid var(--light-green-border)'
            }}
          >
            {lang === 'en' ? 'Municipal Policy' : 'Opisyal nga Lagda'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Loan limit: ' : 'Limitasyon sa paghulam: '}
              </strong>
              {lang === 'en' ? 'Maximum of 3 books per patron' : 'Hangtod sa 3 ka libro matag miyembro'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Loan period: ' : 'Gidugayon: '}
              </strong>
              {lang === 'en'
                ? 'Standard loan period is 7 calendar days (1 renewal permitted if no holds exist)'
                : '7 ka adlaw ang standard nga paghulam (pwede ma-renew kausa kung walay hold)'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Material care: ' : 'Pag-amping: '}
              </strong>
              {lang === 'en'
                ? 'Reference books are room-use only; protect items from liquids and damage'
                : 'Ang reference books sa library lang; ampingi batok sa tubig ug kadaot'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReturnInstructionsCard: React.FC<InstructionsCardProps> = ({ lang, onToggleLang }) => {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-subtle, #f8fafc)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg, 16px)',
        marginTop: '24px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {lang === 'en'
                ? 'How to Return Books — Step-by-Step Instructions'
                : 'Unsaon Pag-uli ug Libro — Mga Lakang ug Giya'}
            </h4>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lang === 'en'
                ? 'Official Balingasag Public Library circulation process for check-in and shelf restocking'
                : 'Opisyal nga pamaagi sa Balingasag Public Library sa pagdawat ug pagbalik sa libro sa estante'}
            </div>
          </div>
        </div>

        {/* Language Switcher Badge Button */}
        <button
          type="button"
          onClick={onToggleLang}
          className="btn btn-ghost btn-sm"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '999px',
            border: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Switch language between English and Bisaya"
        >
          <span>🌐 {lang === 'en' ? 'English (Switch to Bisaya)' : 'Bisaya (Switch to English)'}</span>
        </button>
      </div>

      {/* 3 Step Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Step 1 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--brand-forest)',
                backgroundColor: 'var(--light-green)',
                border: '1px solid var(--light-green-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 01' : 'LAKANG 01'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <Barcode size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Scan Book Barcode or Member QR' : 'I-scan ang Barcode o QR Code'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Scan the physical barcode on the returned book copy, or scan the member QR to view all active borrowed items issued under their account.'
              : 'I-scan ang barcode sticker sa giuli nga libro, o i-scan ang QR code sa miyembro aron makita ang tanang libro nga gihulam ubos sa iyang account.'}
          </p>
        </div>

        {/* Step 2 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--warning)',
                backgroundColor: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 02' : 'LAKANG 02'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warning)'
              }}
            >
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Inspect Condition & Verify Fines' : 'Susiha ang Libro & Multa'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Inspect cover, spine, and pages for damage. The automated calculation engine verifies return date and computes overdue fines at ₱5.00/day if late.'
              : 'Susiha ang hapin ug mga panid sa libro. Awtomatikong kwentahon sa sistema kung aduna bay multa (₱5.00 matag adlaw) kung nilapas na sa takna.'}
          </p>
        </div>

        {/* Step 3 */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--success)',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}
            >
              {lang === 'en' ? 'STEP 03' : 'LAKANG 03'}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)'
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {lang === 'en' ? 'Confirm Return & Restock' : 'Kumpirmaha ang Pag-uli'}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {lang === 'en'
              ? 'Click "Confirm Return & Release Copy to Shelf". Transaction updates to Returned, member loan quota is restored, and the physical book is restocked.'
              : 'I-click ang Confirm Return aron ma-clear ang transaksyon, mabalik ang quota sa miyembro, ug maibalik ang libro sa sirkulasyon sa estante.'}
          </p>
        </div>
      </div>

      {/* Policy Callout - Structured & Readable */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-forest)', fontWeight: 700, fontSize: '13px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-green)' }} />
          <span>{lang === 'en' ? 'Return & Restocking Rules' : 'Mga Lagda sa Pag-uli'}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: '999px',
              backgroundColor: 'var(--light-green)',
              color: 'var(--brand-forest)',
              border: '1px solid var(--light-green-border)'
            }}
          >
            {lang === 'en' ? 'Municipal Policy' : 'Opisyal nga Lagda'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Municipal fine rate: ' : 'Taripa sa multa: '}
              </strong>
              {lang === 'en'
                ? '₱5.00/day per overdue book (excluding Sundays & holidays)'
                : '₱5.00 matag adlaw kada libro (walay labot Domingo ug holiday)'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Borrowing restriction: ' : 'Restriksyon sa paghulam: '}
              </strong>
              {lang === 'en'
                ? 'Unsettled fines block new loans until resolved'
                : 'Ang wala nabayran nga multa mopugong sa sunod nga paghulam'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--danger)', fontWeight: 800, marginTop: '1px' }}>•</span>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Lost or damaged items: ' : 'Nawala o nadaot nga libro: '}
              </strong>
              {lang === 'en'
                ? 'Must be replaced with exact title or equivalent retail price assessed by the library'
                : 'Kinahanglan pulihan sa parehong edisyon o bayran sumala sa bili niini'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CirculationView: React.FC<CirculationViewProps> = ({
  transactions,
  reservations,
  books,
  members,
  userRole,
  currentMemberId: _currentMemberId,
  isLoading = false,
  onBorrowBook,
  onBorrowBooksBatch,
  onReturnBook,
  onRenewBook,
  onCancelReservation,
  onApproveBorrow,
  onRejectBorrow,
  onApproveReservation,
  onRejectReservation,
  initialBarcode,
  onClearInitialBarcode
}) => {
  const pendingBorrows = transactions.filter((t) => t.status === 'Pending Approval');
  const pendingReservations = reservations.filter((r) => r.status === 'Pending Approval');
  const totalPending = pendingBorrows.length + pendingReservations.length;

  const [activeTab, setActiveTab] = useState<'approvals' | 'borrow' | 'return' | 'loans' | 'reservations'>('approvals');

  // Modals state
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    mode: 'member_qr' | 'book_barcode';
    targetAction: 'borrow_member' | 'borrow_book' | 'return_scan';
  }>({
    isOpen: false,
    mode: 'member_qr',
    targetAction: 'borrow_member'
  });

  const [loanSlipModal, setLoanSlipModal] = useState<{
    isOpen: boolean;
    transaction: CirculationTransaction | null;
  }>({
    isOpen: false,
    transaction: null
  });

  const [isWizardModalOpen, setIsWizardModalOpen] = useState<boolean>(false);

  // Dynamic Breadcrumb synchronization
  const { setSubTrail, clearSubTrail } = useBreadcrumbs();

  React.useEffect(() => {
    const tabLabels: Record<string, string> = {
      approvals: 'Borrow Requests',
      borrow: 'Issue Loan Wizard',
      return: 'Return Books & Restock',
      loans: 'Active Loans Registry',
      reservations: 'Hold Reservations'
    };
    if (isWizardModalOpen) {
      setSubTrail([{ label: 'Issue Loan Wizard', current: true }]);
    } else if (activeTab && tabLabels[activeTab]) {
      setSubTrail([{ label: tabLabels[activeTab], current: true }]);
    } else {
      setSubTrail([]);
    }

    return () => {
      clearSubTrail();
    };
  }, [activeTab, isWizardModalOpen, setSubTrail, clearSubTrail]);

  // Calculate default dates
  const todayDateStr = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

  // Borrow Form State
  const [borrowMemberId, setBorrowMemberId] = useState<string>('');
  const [borrowBarcode, setBorrowBarcode] = useState<string>('');
  const [borrowDueDate, setBorrowDueDate] = useState<string>(defaultDueDateStr);
  const [borrowStatusMessage, setBorrowStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBorrowManual, setShowBorrowManual] = useState<boolean>(false);
  const [instructionLang, setInstructionLang] = useState<'en' | 'ceb'>('en');

  // Return Form State
  const [returnBarcode, setReturnBarcode] = useState<string>('');
  const [fineSettled, setFineSettled] = useState<boolean>(true);
  const [returnStatusMessage, setReturnStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search in transactions table
  const [loansSearch, setLoansSearch] = useState<string>('');

  // Collect available book copies for quick pick
  const availableCopies: { bookTitle: string; author: string; barcode: string; accession: string }[] = [];
  books.forEach((b) => {
    b.copies.forEach((c) => {
      if (c.status === 'Available') {
        availableCopies.push({
          bookTitle: b.title,
          author: b.author,
          barcode: c.barcode,
          accession: c.accessionNumber
        });
      }
    });
  });

  // Active borrowed items
  const activeLoans = transactions.filter((t) => t.status === 'Active' || t.status === 'Overdue');

  // Derive selected Member and Eligibility
  const selectedMember = members.find((m) => m.memberId === borrowMemberId);
  const memberActiveLoans = transactions.filter(
    (t) => t.memberId === borrowMemberId && (t.status === 'Active' || t.status === 'Overdue')
  );
  const memberOverdueLoans = transactions.filter(
    (t) => t.memberId === borrowMemberId && t.status === 'Overdue'
  );

  // Superadmin global settings & tier policies
  const systemSettings = StorageService.getSystemSettings();
  const selectedMemberTier = systemSettings.tierPolicies.find(
    (p) => p.tierName.toLowerCase() === (selectedMember?.membershipType || '').toLowerCase()
  ) || systemSettings.tierPolicies[0];
  const maxAllowedLoans = selectedMemberTier?.maxLoanLimit ?? 3;

  const isAccountActive = selectedMember?.status === 'active';
  const isWithinLimit = memberActiveLoans.length < maxAllowedLoans;
  const hasNoOverdue = memberOverdueLoans.length === 0;
  const hasNoBlockedFines = true;
  const isMemberEligible = !!selectedMember && isAccountActive && isWithinLimit && hasNoOverdue && hasNoBlockedFines;

  // Derive selected Book & Physical Copy
  let selectedBook: Book | null = null;
  let selectedCopy: PhysicalCopy | null = null;
  if (borrowBarcode.trim()) {
    for (const b of books) {
      const copy = b.copies.find(
        (c) =>
          c.barcode.toUpperCase() === borrowBarcode.trim().toUpperCase() ||
          c.accessionNumber.toUpperCase() === borrowBarcode.trim().toUpperCase()
      );
      if (copy) {
        selectedBook = b;
        selectedCopy = copy;
        break;
      }
    }
  }

  const isCopyAvailable = selectedCopy?.status === 'Available';
  const currentCopyBorrower = selectedCopy && !isCopyAvailable
    ? transactions.find(
        (t) => t.barcode === selectedCopy?.barcode && (t.status === 'Active' || t.status === 'Overdue')
      )
    : null;

  // Derive matched loan for Return
  let matchedReturnLoan: CirculationTransaction | null = null;
  if (returnBarcode.trim()) {
    matchedReturnLoan =
      transactions.find(
        (t) =>
          (t.barcode.toUpperCase() === returnBarcode.trim().toUpperCase() ||
           t.accessionNumber.toUpperCase() === returnBarcode.trim().toUpperCase() ||
           t.memberId.toUpperCase() === returnBarcode.trim().toUpperCase()) &&
          (t.status === 'Active' || t.status === 'Overdue')
      ) || null;
  }

  // Calculate dynamic fine for matched return loan using Superadmin tier policy
  const computeOverdueInfo = (tx: CirculationTransaction | null) => {
    if (!tx) return { isOverdue: false, daysLate: 0, fine: 0, rate: systemSettings.dailyFineRate, isExempt: false };
    const today = new Date();
    const dueDate = new Date(tx.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      const txMember = members.find((m) => m.memberId === tx.memberId);
      const tierPolicy = systemSettings.tierPolicies.find(
        (p) => p.tierName.toLowerCase() === (txMember?.membershipType || '').toLowerCase()
      ) || systemSettings.tierPolicies[0];

      if (tierPolicy?.fineExempt) {
        return { isOverdue: true, daysLate: diffDays, fine: 0, rate: 0, isExempt: true };
      }

      const graceDays = tierPolicy?.gracePeriodDays ?? systemSettings.gracePeriodDays ?? 1;
      const chargeableDays = Math.max(0, diffDays - graceDays);
      const rate = tierPolicy?.dailyFineRate ?? systemSettings.dailyFineRate ?? 5;
      const rawFine = chargeableDays * rate;
      const fine = Math.min(rawFine, systemSettings.maxFineCap || 300);

      return { isOverdue: true, daysLate: diffDays, fine, rate, isExempt: false };
    }
    return { isOverdue: false, daysLate: 0, fine: 0, rate: systemSettings.dailyFineRate, isExempt: false };
  };

  const overdueInfo = computeOverdueInfo(matchedReturnLoan);

  const cleanScannedCode = (raw: string): string => {
    let text = (raw || '').trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        text = parsed.memberId || parsed.id || parsed.qrCodeData || parsed.barcode || parsed.code || text;
      } catch {
        // use raw
      }
    }
    if (text.includes('/') && !text.includes(' ')) {
      const parts = text.split('/');
      const last = parts[parts.length - 1];
      if (last) text = last;
    }
    return text.trim();
  };

  // Auto-fill and route when tested or navigated with initialBarcode
  React.useEffect(() => {
    if (initialBarcode) {
      const upper = initialBarcode.trim().toUpperCase();
      const isBorrowed = transactions.some(
        (t) =>
          (t.barcode.toUpperCase() === upper || t.accessionNumber.toUpperCase() === upper) &&
          (t.status === 'Active' || t.status === 'Overdue')
      );
      if (isBorrowed) {
        setActiveTab('return');
        setReturnBarcode(initialBarcode.trim());
        setReturnStatusMessage({ type: 'success', text: `Loaded borrowed physical copy "${initialBarcode}" for check-in.` });
      } else {
        setActiveTab('borrow');
        setBorrowBarcode(initialBarcode.trim());
        setBorrowStatusMessage({ type: 'success', text: `Scanned physical barcode "${initialBarcode}" ready to be issued.` });
      }
      if (onClearInitialBarcode) {
        onClearInitialBarcode();
      }
    }
  }, [initialBarcode, transactions, onClearInitialBarcode]);

  const handleScannerDetected = async (rawCode: string) => {
    const code = cleanScannedCode(rawCode);
    const upperCode = code.toUpperCase();

    if (scannerModal.isOpen) {
      if (scannerModal.targetAction === 'borrow_member') {
        let found = members.find(
          (m) =>
            m.memberId.toUpperCase() === upperCode ||
            (m.qrCodeData && m.qrCodeData.toUpperCase() === upperCode) ||
            m.id.toUpperCase() === upperCode ||
            m.fullName.toUpperCase().includes(upperCode)
        );

        if (!found) {
          try {
            const remote = await api.getMemberByQr(code);
            if (remote && remote.memberId) found = remote;
          } catch {
            // not found
          }
        }

        if (found) {
          setBorrowMemberId(found.memberId);
          setBorrowStatusMessage(null);
        } else {
          setBorrowStatusMessage({ type: 'error', text: `Member with code "${code}" not found.` });
        }
      } else if (scannerModal.targetAction === 'borrow_book') {
        setBorrowBarcode(code);
        setBorrowStatusMessage(null);
      } else if (scannerModal.targetAction === 'return_scan') {
        // Check if scanned code matches a member QR
        const foundMember = members.find(
          (m) =>
            m.memberId.toUpperCase() === upperCode ||
            (m.qrCodeData && m.qrCodeData.toUpperCase() === upperCode) ||
            m.id.toUpperCase() === upperCode
        );

        if (foundMember) {
          setReturnBarcode(foundMember.memberId);
          setReturnStatusMessage(null);
        } else {
          setReturnBarcode(code);
          setReturnStatusMessage(null);
        }
      }
    } else {
      // Direct / USB Hardware Wedge Barcode Scan (Zero-keystroke mode)
      const foundMember = members.find(
        (m) =>
          m.memberId.toUpperCase() === upperCode ||
          (m.qrCodeData && m.qrCodeData.toUpperCase() === upperCode) ||
          m.id.toUpperCase() === upperCode
      );

      if (foundMember) {
        if (activeTab === 'return') {
          setReturnBarcode(foundMember.memberId);
          setReturnStatusMessage({ type: 'success', text: `Patron "${foundMember.fullName}" identified (${foundMember.memberId}). Showing loans.` });
        } else {
          setActiveTab('borrow');
          setBorrowMemberId(foundMember.memberId);
          setBorrowStatusMessage({ type: 'success', text: `Patron "${foundMember.fullName}" verified.` });
        }
        playSuccessBeep();
        return;
      }

      // Check if scanned code matches an active borrowed copy
      const activeLoan = transactions.find(
        (t) =>
          (t.barcode.toUpperCase() === upperCode || t.accessionNumber.toUpperCase() === upperCode) &&
          (t.status === 'Active' || t.status === 'Overdue')
      );

      if (activeLoan || activeTab === 'return') {
        setActiveTab('return');
        setReturnBarcode(code);
        setReturnStatusMessage({ type: 'success', text: `Identified returned book: "${activeLoan ? activeLoan.bookTitle : code}"` });
      } else {
        setActiveTab('borrow');
        setBorrowBarcode(code);
        setBorrowStatusMessage({ type: 'success', text: `Scanned book barcode: "${code}". Ready to issue loan.` });
      }
      playSuccessBeep();
    }
  };

  // Hardware Barcode Scanner Listener (USB / Bluetooth Wedge Mode)
  React.useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && !isInput) {
          e.preventDefault();
          const scanned = buffer.trim();
          buffer = '';
          handleScannerDetected(scanned);
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [members, books, transactions, activeTab, scannerModal.isOpen]);

  const handleExecuteBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowMemberId || !borrowBarcode) {
      setBorrowStatusMessage({ type: 'error', text: 'Please scan or select both a Member QR and a Book Barcode.' });
      return;
    }

    if (!isMemberEligible) {
      setBorrowStatusMessage({
        type: 'error',
        text: !isAccountActive
          ? 'Member account is inactive or suspended.'
          : !isWithinLimit
          ? 'Member has reached the maximum 3 books borrowing limit.'
          : 'Member has overdue loans that must be settled first.'
      });
      return;
    }

    if (!isCopyAvailable) {
      setBorrowStatusMessage({
        type: 'error',
        text: `Physical copy ${borrowBarcode} is not available (Status: ${selectedCopy?.status || 'Unknown'}).`
      });
      return;
    }

    const res = onBorrowBook(borrowMemberId, borrowBarcode, borrowDueDate);
    if (res.success) {
      setBorrowStatusMessage({ type: 'success', text: res.message });
      if (res.transaction) {
        setLoanSlipModal({ isOpen: true, transaction: res.transaction });
      }
      setBorrowBarcode('');
    } else {
      setBorrowStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleExecuteReturn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcodeToReturn = matchedReturnLoan ? matchedReturnLoan.barcode : returnBarcode.trim();
    if (!barcodeToReturn) {
      setReturnStatusMessage({ type: 'error', text: 'Please scan or enter a book barcode to return.' });
      return;
    }

    const res = onReturnBook(barcodeToReturn);
    if (res.success) {
      const fineMsg = overdueInfo.isOverdue ? ` Overdue fine of ₱${overdueInfo.fine}.00 recorded.` : '';
      setReturnStatusMessage({ type: 'success', text: `${res.message}${fineMsg}` });
      setReturnBarcode('');
    } else {
      setReturnStatusMessage({ type: 'error', text: res.message });
    }
  };


  const filteredLoans = transactions.filter((tx) => {
    const bookTitle = tx.bookTitle || (tx as any).book_title || '';
    const memberName = tx.memberName || (tx as any).member_name || '';
    const barcode = tx.barcode || '';
    const memberId = tx.memberId || (tx as any).member_id || '';
    const q = loansSearch.toLowerCase();
    return (
      bookTitle.toLowerCase().includes(q) ||
      memberName.toLowerCase().includes(q) ||
      barcode.toLowerCase().includes(q) ||
      memberId.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return <CirculationSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Circulation Management</div>
          <div className="page-subtitle">
            Book Borrowing, Barcode Returns, Loan Renewals, and Active Reservation Holds
          </div>
        </div>
        {userRole !== 'member' && (
          <div className="page-actions">
            <button
              onClick={() => setIsWizardModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', fontWeight: 700 }}
            >
              <BookOpen size={16} />
              <span>Borrow Book</span>
            </button>
          </div>
        )}
      </div>

      {/* Circulation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px' }}>
        {userRole !== 'member' && (
          <>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`btn btn-ghost ${activeTab === 'approvals' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'approvals' ? '2px solid var(--primary-600)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'approvals' ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={16} color={totalPending > 0 ? 'var(--warning)' : undefined} />
              <span>Pending Approvals</span>
              {totalPending > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    lineHeight: 1.3
                  }}
                >
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('borrow')}
              className={`btn btn-ghost ${activeTab === 'borrow' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'borrow' ? '2px solid var(--primary-600, #1E4D38)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'borrow' ? 600 : 500
              }}
            >
              <BookOpen size={16} />
              <span>Borrow Book</span>
            </button>

            <button
              onClick={() => setActiveTab('return')}
              className={`btn btn-ghost ${activeTab === 'return' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'return' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'return' ? 600 : 500
              }}
            >
              <CheckCircle2 size={16} />
              <span>Return (Scan Barcode)</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('loans')}
          className={`btn btn-ghost ${activeTab === 'loans' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'loans' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'loans' ? 600 : 500
          }}
        >
          <Repeat size={16} />
          <span>Active Loans ({activeLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`btn btn-ghost ${activeTab === 'reservations' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'reservations' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'reservations' ? 600 : 500
          }}
        >
          <BookmarkCheck size={16} />
          <span>Reservations ({reservations.length})</span>
        </button>
      </div>

      {/* TAB 0: PENDING APPROVALS */}
      {activeTab === 'approvals' && userRole !== 'member' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Borrow Requests Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Borrow Requests Awaiting Approval</span>
                  <span className={`badge ${pendingBorrows.length > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                    {pendingBorrows.length} Pending
                  </span>
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Members who requested to borrow physical books from the online catalog
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patron / Member</th>
                    <th>Book Title & Accession</th>
                    <th>Barcode</th>
                    <th>Date Requested</th>
                    <th style={{ textAlign: 'right' }}>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No pending borrow requests at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingBorrows.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.memberName}</div>
                          <code style={{ fontSize: '11.5px' }}>{tx.memberId}</code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.bookTitle}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            by {tx.bookAuthor} • Accession: <code>{tx.accessionNumber}</code>
                          </div>
                        </td>
                        <td>
                          <code>{tx.barcode}</code>
                        </td>
                        <td>{tx.requestDate || tx.borrowDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {onApproveBorrow && (
                              <button
                                onClick={() => onApproveBorrow(tx.id)}
                                className="btn btn-primary btn-sm"
                                title="Approve borrow request (activates 14-day loan)"
                              >
                                <Check size={14} />
                                <span>Approve</span>
                              </button>
                            )}
                            {onRejectBorrow && (
                              <button
                                onClick={() => onRejectBorrow(tx.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                                title="Decline request"
                              >
                                <X size={14} />
                                <span>Decline</span>
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
          </div>

          {/* Reservation Requests Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Reservation Holds Awaiting Approval</span>
                  <span className={`badge ${pendingReservations.length > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                    {pendingReservations.length} Pending
                  </span>
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Hold requests placed by patrons waiting for shelf clearance
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patron / Member</th>
                    <th>Book Title</th>
                    <th>Date Requested</th>
                    <th>Queue Pos.</th>
                    <th style={{ textAlign: 'right' }}>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No pending reservation holds.
                      </td>
                    </tr>
                  ) : (
                    pendingReservations.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{res.memberName}</div>
                          <code style={{ fontSize: '11.5px' }}>{res.memberId}</code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{res.bookTitle}</div>
                        </td>
                        <td>{res.reservationDate}</td>
                        <td>
                          <span className="badge badge-warning">Queue #{res.queuePosition}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {onApproveReservation && (
                              <button
                                onClick={() => onApproveReservation(res.id)}
                                className="btn btn-primary btn-sm"
                                title="Approve hold and notify patron that book is ready for pickup"
                              >
                                <Check size={14} />
                                <span>Approve (Ready for Pickup)</span>
                              </button>
                            )}
                            {onRejectReservation && (
                              <button
                                onClick={() => onRejectReservation(res.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                                title="Decline reservation"
                              >
                                <X size={14} />
                                <span>Decline</span>
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
          </div>
        </div>
      )}

      {/* TAB 1: BORROW WORKFLOW */}
      {activeTab === 'borrow' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Borrow Card - Exact Match to Return Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Borrow Book & Issue Loan</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: '4px auto 0' }}>
                Scan the member QR or book physical barcode to verify borrowing eligibility, inspect physical shelf copies, and confirm loan.
              </p>
            </div>

            {/* Centered Scan Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                margin: '28px 0 20px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => setScannerModal({ isOpen: true, mode: 'book_barcode', targetAction: 'borrow_book' })}
                className="btn btn-primary"
                style={{ gap: '8px', padding: '12px 26px', fontSize: '14px', fontWeight: 600 }}
              >
                <Barcode size={18} />
                <span>Scan Barcode</span>
              </button>
              <button
                type="button"
                onClick={() => setScannerModal({ isOpen: true, mode: 'member_qr', targetAction: 'borrow_member' })}
                className="btn btn-secondary"
                style={{ gap: '8px', padding: '12px 26px', fontSize: '14px', fontWeight: 600 }}
              >
                <QrCode size={18} />
                <span>Scan Member QR</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWizardModalOpen(true)}
                className="btn btn-ghost"
                style={{ gap: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, border: '1px dashed var(--border-main)' }}
                title="Launch multi-book borrowing wizard"
              >
                <Layers size={18} />
                <span>Full Borrow Wizard</span>
              </button>
            </div>

            {/* Scanned Badges Indicator */}
            {(borrowMemberId || borrowBarcode) && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px',
                  flexWrap: 'wrap'
                }}
              >
                {borrowMemberId && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-blue-light, rgba(2, 132, 199, 0.1))',
                      color: 'var(--accent-blue, #0284C7)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <UserIcon size={14} />
                    <span>Patron: {selectedMember?.fullName || borrowMemberId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBorrowMemberId('');
                        setBorrowStatusMessage(null);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px', color: 'inherit' }}
                      title="Clear patron"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {borrowBarcode && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <Barcode size={14} />
                    <span>Copy: {borrowBarcode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBorrowBarcode('');
                        setBorrowStatusMessage(null);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px', color: 'inherit' }}
                      title="Clear barcode"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBorrowMemberId('');
                    setBorrowBarcode('');
                    setBorrowStatusMessage(null);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Matched Borrower and Book Verification Card */}
            {(selectedMember || selectedCopy) ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* 1. Patron Verification Section */}
                {selectedMember ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            backgroundColor: 'var(--brand-forest, #1E4D38)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}
                        >
                          {selectedMember.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {selectedMember.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Member ID: <code>{selectedMember.memberId}</code> • {selectedMember.membershipType}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${isMemberEligible ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                        {isMemberEligible ? '✓ Eligible to Borrow' : '❌ Ineligible'}
                      </span>
                    </div>

                    {/* Eligibility Checklist */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '8px',
                        fontSize: '11.5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAccountActive ? 'var(--success)' : 'var(--danger)' }}>
                        {isAccountActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Account Active</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isWithinLimit ? 'var(--success)' : 'var(--danger)' }}>
                        {isWithinLimit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Limit ({memberActiveLoans.length}/3 Loans)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoOverdue ? 'var(--success)' : 'var(--danger)' }}>
                        {hasNoOverdue ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>No Overdues</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoBlockedFines ? 'var(--success)' : 'var(--danger)' }}>
                        {hasNoBlockedFines ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>No Unpaid Fines</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(2, 132, 199, 0.06)',
                      border: '1px dashed rgba(2, 132, 199, 0.3)',
                      textAlign: 'center',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    👉 <strong>Scan Member QR</strong> above to link patron account to this loan.
                  </div>
                )}

                {/* 2. Book Copy Verification Section */}
                {selectedCopy && selectedBook ? (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                          {selectedBook.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          by {selectedBook.author} • ISBN: <code>{selectedBook.isbn}</code>
                        </div>
                      </div>
                      <span
                        className={`badge ${isCopyAvailable ? 'badge-success' : 'badge-danger'}`}
                        style={{ fontSize: '11px', fontWeight: 600 }}
                      >
                        {isCopyAvailable ? '✓ Copy Available on Shelf' : `❌ ${selectedCopy.status}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div>Accession: <code>{selectedCopy.accessionNumber}</code></div>
                      <div>Barcode: <code>{selectedCopy.barcode}</code></div>
                    </div>

                    {currentCopyBorrower && (
                      <div style={{ fontSize: '11px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', padding: '6px 10px', borderRadius: '4px' }}>
                        Currently checked out to <strong>{currentCopyBorrower.memberName}</strong> ({currentCopyBorrower.memberId}), due {currentCopyBorrower.dueDate}.
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(30, 77, 56, 0.06)',
                      border: '1px dashed rgba(30, 77, 56, 0.3)',
                      textAlign: 'center',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    👉 <strong>Scan Book Barcode</strong> above to select the physical copy from the shelf.
                  </div>
                )}

                {/* 3. Due Date & Final Submit Button */}
                {selectedMember && selectedCopy && (
                  <form onSubmit={handleExecuteBorrow} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Borrow Date
                        </label>
                        <input
                          type="text"
                          disabled
                          className="form-input"
                          value={todayDateStr}
                          style={{ backgroundColor: 'var(--bg-page)', cursor: 'not-allowed' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Due Date (7 Days Default)
                        </label>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={borrowDueDate}
                          onChange={(e) => setBorrowDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedMember || !isMemberEligible || !selectedCopy || !isCopyAvailable}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700 }}
                    >
                      <Check size={16} />
                      <span>Confirm Borrow & Issue Loan Slip</span>
                    </button>
                  </form>
                )}
              </div>
            ) : null}

            {/* Manual Selection Fallback Drawer/Toggle */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowBorrowManual(!showBorrowManual)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                <span>{showBorrowManual ? 'Hide manual selectors' : 'Or select patron / shelf copy manually'}</span>
                {showBorrowManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showBorrowManual && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '14px', textAlign: 'left' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Select Patron:</label>
                    <select
                      className="form-select"
                      value={borrowMemberId}
                      onChange={(e) => {
                        setBorrowMemberId(e.target.value);
                        setBorrowStatusMessage(null);
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Choose Patron --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.memberId}>
                          {m.fullName} ({m.memberId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>Select Shelf Copy:</label>
                    <select
                      className="form-select"
                      value={borrowBarcode}
                      onChange={(e) => {
                        setBorrowBarcode(e.target.value);
                        setBorrowStatusMessage(null);
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Choose Shelf Copy --</option>
                      {availableCopies.map((c, idx) => (
                        <option key={idx} value={c.barcode}>
                          {c.bookTitle} ({c.barcode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Status Feedback Message */}
            {borrowStatusMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: borrowStatusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: borrowStatusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${borrowStatusMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}
              >
                {borrowStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{borrowStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* INSTRUCTIONS: HOW TO BORROW BOOKS */}
          <BorrowInstructionsCard lang={instructionLang} onToggleLang={() => setInstructionLang(instructionLang === 'en' ? 'ceb' : 'en')} />
        </div>
      )}

      {/* TAB 2: RETURN WORKFLOW */}
      {activeTab === 'return' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Return Book & Restock Shelf</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: '4px auto 0' }}>
                Scan the member QR or book physical barcode to verify borrowing, check overdue fine calculations, and confirm return.
              </p>
            </div>

            {/* Centered Scan Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                margin: '28px 0 20px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => setScannerModal({ isOpen: true, mode: 'book_barcode', targetAction: 'return_scan' })}
                className="btn btn-primary"
                style={{ gap: '8px', padding: '12px 26px', fontSize: '14px', fontWeight: 600 }}
              >
                <Barcode size={18} />
                <span>Scan Barcode</span>
              </button>
              <button
                type="button"
                onClick={() => setScannerModal({ isOpen: true, mode: 'member_qr', targetAction: 'return_scan' })}
                className="btn btn-secondary"
                style={{ gap: '8px', padding: '12px 26px', fontSize: '14px', fontWeight: 600 }}
              >
                <QrCode size={18} />
                <span>Scan Member QR</span>
              </button>
            </div>

            {returnBarcode && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scanned Code:</span>
                <code style={{ fontSize: '13px', fontWeight: 700 }}>{returnBarcode}</code>
                <button
                  type="button"
                  onClick={() => {
                    setReturnBarcode('');
                    setReturnStatusMessage(null);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Matched Loan Card with Overdue Fine Engine */}
            {matchedReturnLoan ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      Active Loan Found: <code>{matchedReturnLoan.id}</code>
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {matchedReturnLoan.bookTitle}
                    </h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      by {matchedReturnLoan.bookAuthor}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Accession No:</div>
                    <code style={{ fontSize: '13px', fontWeight: 700 }}>{matchedReturnLoan.accessionNumber}</code>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Borrower Patron:</span>
                    <div style={{ fontWeight: 600 }}>{matchedReturnLoan.memberName} (<code>{matchedReturnLoan.memberId}</code>)</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Borrow Date:</span>
                    <div>{matchedReturnLoan.borrowDate}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Scheduled Due Date:</span>
                    <div style={{ fontWeight: 700, color: overdueInfo.isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {matchedReturnLoan.dueDate}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Physical Copy Barcode:</span>
                    <div><code>{matchedReturnLoan.barcode}</code></div>
                  </div>
                </div>

                {/* Overdue Fine Engine */}
                <div
                  style={{
                    backgroundColor: overdueInfo.isOverdue ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${overdueInfo.isOverdue ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {overdueInfo.isOverdue ? (
                      <AlertCircle size={20} color="var(--danger)" />
                    ) : (
                      <CheckCircle2 size={20} color="var(--success)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: overdueInfo.isOverdue ? '#991b1b' : '#166534' }}>
                        {overdueInfo.isOverdue ? `Overdue by ${overdueInfo.daysLate} day(s)` : 'Returned on Schedule'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: overdueInfo.isOverdue ? '#b91c1c' : '#15803d' }}>
                        {overdueInfo.isOverdue
                          ? overdueInfo.isExempt
                            ? 'Patron tier is fine-exempt (₱0.00 assessed).'
                            : `Daily Rate: ₱${overdueInfo.rate.toFixed(2)} / day • Total Fine: ₱${overdueInfo.fine.toFixed(2)}`
                          : 'No overdue fines assessed. Account in good standing.'}
                      </div>
                    </div>
                  </div>

                  {overdueInfo.isOverdue && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={fineSettled}
                        onChange={(e) => setFineSettled(e.target.checked)}
                      />
                      <span style={{ fontWeight: 600 }}>Fine Paid at Counter</span>
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteReturn()}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm Return & Release Copy to Shelf</span>
                </button>
              </div>
            ) : returnBarcode.trim() ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                No active or overdue loan record found for identifier "{returnBarcode}".
              </div>
            ) : null}

            {returnStatusMessage && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: returnStatusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: returnStatusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${returnStatusMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}
              >
                {returnStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{returnStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* INSTRUCTIONS: HOW TO RETURN BOOKS */}
          <ReturnInstructionsCard lang={instructionLang} onToggleLang={() => setInstructionLang(instructionLang === 'en' ? 'ceb' : 'en')} />
        </div>
      )}

      {/* TAB 3: ACTIVE LOANS TABLE */}
      {activeTab === 'loans' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '16px' }}>Active & Historical Circulation Loans</h3>
            <div style={{ width: '260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search loans, member, barcode..."
                value={loansSearch}
                onChange={(e) => setLoansSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Barcode</th>
                  <th>Patron</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  {userRole !== 'member' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.bookTitle}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {loan.bookAuthor}</div>
                      </td>
                      <td>
                        <code style={{ fontWeight: 600 }}>{loan.barcode}</code>
                      </td>
                      <td>
                        <div>{loan.memberName}</div>
                        <code style={{ fontSize: '11px' }}>{loan.memberId}</code>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{loan.borrowDate}</td>
                      <td style={{ fontSize: '12.5px' }}>
                        <strong>{loan.dueDate}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            loan.status === 'Overdue'
                              ? 'badge-danger'
                              : loan.status === 'Returned'
                              ? 'badge-neutral'
                              : loan.status === 'Pending Approval'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      {userRole !== 'member' && (
                        <td style={{ textAlign: 'right' }}>
                          {loan.status === 'Pending Approval' ? (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {onApproveBorrow && (
                                <button
                                  onClick={() => onApproveBorrow(loan.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '11px' }}
                                  title="Approve loan"
                                >
                                  <Check size={12} />
                                  <span>Approve</span>
                                </button>
                              )}
                              {onRejectBorrow && (
                                <button
                                  onClick={() => onRejectBorrow(loan.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--danger)', padding: '3px 6px' }}
                                  title="Decline loan"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            loan.status !== 'Returned' && (
                              <button
                                onClick={() => onRenewBook(loan.id)}
                                className="btn btn-secondary btn-sm"
                                title="Extend Due Date by 14 days"
                              >
                                <RefreshCw size={13} />
                                <span>Renew</span>
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RESERVATIONS QUEUE */}
      {activeTab === 'reservations' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Book Hold & Reservations Queue</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Reserved By</th>
                  <th>Reservation Date</th>
                  <th>Expiry Date</th>
                  <th>Queue Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No active hold reservations.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 600 }}>{res.bookTitle}</td>
                      <td>
                        <div>{res.memberName}</div>
                        <code style={{ fontSize: '11px' }}>{res.memberId}</code>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{res.reservationDate}</td>
                      <td style={{ fontSize: '12.5px' }}>{res.expiryDate}</td>
                      <td>
                        {res.status === 'Ready for Pickup' ? (
                          <span className="badge badge-success">Ready for Pickup</span>
                        ) : res.status === 'Pending Approval' ? (
                          <span className="badge badge-warning">Pending Approval</span>
                        ) : res.status === 'Waiting' ? (
                          <span className="badge badge-info">Queue #{res.queuePosition}</span>
                        ) : (
                          <span className="badge badge-neutral">{res.status}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {res.status === 'Pending Approval' && onApproveReservation && (
                            <button
                              onClick={() => onApproveReservation(res.id)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Approve hold and mark ready for pickup"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => onCancelReservation(res.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', padding: '3px 8px', fontSize: '11px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal (Member QR & Book Barcode) */}
      <CirculationScannerModal
        isOpen={scannerModal.isOpen}
        onClose={() => setScannerModal({ ...scannerModal, isOpen: false })}
        mode={scannerModal.mode}
        members={members}
        books={books}
        onCodeDetected={handleScannerDetected}
      />

      {/* Official Loan Slip Modal / Receipt */}
      <LoanSlipModal
        isOpen={loanSlipModal.isOpen}
        onClose={() => setLoanSlipModal({ isOpen: false, transaction: null })}
        transaction={loanSlipModal.transaction}
      />

      {/* Modern Redesigned Borrow Book Modal */}
      <IssueLoanWizardModal
        isOpen={isWizardModalOpen}
        onClose={() => setIsWizardModalOpen(false)}
        members={members}
        books={books}
        transactions={transactions}
        onConfirmBorrow={onBorrowBook}
        onConfirmBorrowBatch={onBorrowBooksBatch}
      />
    </div>
  );
};
