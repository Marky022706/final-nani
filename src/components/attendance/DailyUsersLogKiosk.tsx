import React, { useState, useEffect, useRef } from 'react';
import type { Member, AttendanceRecord } from '../../types';
import {
  Camera,
  Users,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  X,
  Sparkles
} from 'lucide-react';
import { CameraScanner } from '../common/CameraScanner';
import { playSuccessBeep, playErrorTone } from '../../utils/sound';
import { api } from '../../services/api';

export interface DailyUsersLogKioskProps {
  members: Member[];
  activeAttendance: AttendanceRecord[];
  onAttendanceProcessed: (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => void;
  isFullscreenMode?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

interface ScanFeedbackState {
  type: 'time_in' | 'error';
  member?: Member;
  record?: AttendanceRecord;
  message: string;
  timestamp: string;
}

export const DailyUsersLogKiosk: React.FC<DailyUsersLogKioskProps> = ({
  members,
  activeAttendance,
  onAttendanceProcessed,
  isFullscreenMode = false,
  onToggleFullscreen,
  onClose
}) => {
  // Live Ticking Clock
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Input & Processing State
  const [manualCode, setManualCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScannedMember, setLastScannedMember] = useState<Member | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedbackState | null>(null);
  const [inlineError, setInlineError] = useState<{
    title: string;
    message: string;
    code?: string;
  } | null>(null);

  // Anti-duplicate protection cooldown map (memberId -> timestamp)
  const lastScanTimeRef = useRef<{ [key: string]: number }>({});
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Live Clock Tick (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-reset feedback and errors to "READY TO SCAN" after 8 seconds
  useEffect(() => {
    if (!feedback && !inlineError) return;
    const timer = setTimeout(() => {
      setFeedback(null);
      setInlineError(null);
      setLastScannedMember(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [feedback, inlineError]);

  // Clean scanned code (handles JSON, URLs, spaces)
  const cleanScannedCode = (raw: string): string => {
    let text = (raw || '').trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        text = parsed.memberId || parsed.id || parsed.qrCodeData || parsed.code || text;
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

  // Find member in local registry or query backend
  const resolveMember = async (code: string): Promise<Member | null> => {
    const clean = cleanScannedCode(code);
    if (!clean) return null;
    const upper = clean.toUpperCase();
    const alphaClean = upper.replace(/[^A-Z0-9]/g, '');

    // Check local members state with full null-safety
    let matched = members.find((m) => {
      if (!m) return false;
      const memId = m.memberId ? String(m.memberId).toUpperCase() : '';
      const qrData = m.qrCodeData ? String(m.qrCodeData).toUpperCase() : '';
      const idStr = m.id ? String(m.id).toUpperCase() : '';
      const nameStr = m.fullName ? String(m.fullName).toUpperCase() : '';
      const uName = m.username ? String(m.username).toUpperCase() : '';

      const memIdClean = memId.replace(/[^A-Z0-9]/g, '');
      const qrDataClean = qrData.replace(/[^A-Z0-9]/g, '');

      return (
        memId === upper ||
        qrData === upper ||
        idStr === upper ||
        uName === upper ||
        (alphaClean.length >= 4 && (memIdClean === alphaClean || qrDataClean === alphaClean)) ||
        (memId && memId.includes(upper)) ||
        (nameStr && nameStr.includes(upper))
      );
    });

    // If not found locally, query backend by QR code or ID
    if (!matched) {
      try {
        const backendMember = await api.getMemberByQr(clean);
        if (backendMember && (backendMember.memberId || backendMember.id)) {
          matched = backendMember;
        }
      } catch {
        // Query /members directly to search by name/id
        try {
          const allMembers = await api.getMembers();
          if (Array.isArray(allMembers)) {
            const found = allMembers.find((m) => {
              const memId = m.memberId ? String(m.memberId).toUpperCase() : '';
              const idStr = m.id ? String(m.id).toUpperCase() : '';
              const nameStr = m.fullName ? String(m.fullName).toUpperCase() : '';
              return memId === upper || idStr === upper || nameStr.includes(upper);
            });
            if (found) matched = found;
          }
        } catch {
          // Ignored
        }
      }
    }

    return matched || null;
  };

  // Main Attendance Processing Function
  const processAttendanceScan = async (rawCode: string, isManual: boolean = false) => {
    if (!rawCode || isProcessing) return;

    const cleanCode = cleanScannedCode(rawCode);
    if (!cleanCode) return;

    // Cooldown check (prevent rapid duplicate trigger within 3 seconds for camera scans)
    const nowTimestamp = Date.now();
    const lastScan = lastScanTimeRef.current[cleanCode.toUpperCase()] || 0;
    if (!isManual && nowTimestamp - lastScan < 3000) {
      return;
    }
    lastScanTimeRef.current[cleanCode.toUpperCase()] = nowTimestamp;

    setIsProcessing(true);

    try {
      const member = await resolveMember(cleanCode);

      if (!member) {
        playErrorTone();
        const errObj = {
          title: 'Patron Not Found',
          message: `No patron record was found matching code "${cleanCode}". Please verify the ID number or register at the librarian desk.`,
          code: cleanCode
        };
        setInlineError(errObj);
        setFeedback({
          type: 'error',
          message: `NO RECORD FOUND FOR "${cleanCode.toUpperCase()}"`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        setLastScannedMember(null);
        return;
      }

      setLastScannedMember(member);

      // Validate account status
      if (member.status === 'inactive') {
        playErrorTone();
        const errObj = {
          title: 'Patron Account Inactive',
          message: `Patron account for ${member.fullName} (${member.memberId}) is currently marked inactive. Access to library services is paused until reactivated.`,
          code: member.memberId
        };
        setInlineError(errObj);
        setFeedback({
          type: 'error',
          member,
          message: `ACCOUNT INACTIVE — ENTRY REJECTED`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        return;
      }

      if (member.status === 'suspended') {
        playErrorTone();
        const errObj = {
          title: 'Patron Account Suspended',
          message: `Patron account for ${member.fullName} (${member.memberId}) has a suspended status. Please consult the chief librarian desk.`,
          code: member.memberId
        };
        setInlineError(errObj);
        setFeedback({
          type: 'error',
          member,
          message: `ACCOUNT SUSPENDED — ENTRY REJECTED`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        return;
      }

      // Success: clear any existing inline error
      setInlineError(null);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const timeWithSec = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Check if patron already recorded a Time-In in the same minute today (prevent double-beep duplication)
      const recentSameMinute = activeAttendance.find(
        (a) =>
          ((a.memberId && member.memberId && a.memberId.toUpperCase() === member.memberId.toUpperCase()) ||
            a.memberId === member.id ||
            a.memberId === String(member.id)) &&
          a.date === todayStr &&
          a.timeIn === timeFormatted
      );

      if (recentSameMinute) {
        playSuccessBeep();
        setFeedback({
          type: 'time_in',
          member,
          record: recentSameMinute,
          message: `ALREADY TIMED IN (${recentSameMinute.timeIn})`,
          timestamp: timeWithSec
        });
        return;
      }

      // TIME IN EVENT (In Only - No Time Out)
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId: member.memberId,
        memberName: member.fullName,
        membershipType: member.membershipType || 'Student',
        date: todayStr,
        timeIn: timeFormatted,
        status: 'Inside',
        notes: 'Optical QR scan entry'
      };

      onAttendanceProcessed(newRecord, 'time_in');
      playSuccessBeep();
      setFeedback({
        type: 'time_in',
        member,
        record: newRecord,
        message: `TIME IN SUCCESSFUL`,
        timestamp: timeWithSec
      });
    } finally {
      setIsProcessing(false);
      setManualCode('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) {
      playErrorTone();
      setInlineError({
        title: 'Member ID Required',
        message: 'Please enter a patron ID number (e.g. BPL-2026-0001) or scan an ID card barcode.'
      });
      manualInputRef.current?.focus();
      return;
    }
    processAttendanceScan(trimmed, true);
  };

  // Formatted Date & Time Strings matching the reference image layout
  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Calculate age if date of birth exists
  const calculateAge = (dobString?: string): string => {
    if (!dobString) return '';
    try {
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDt = new Date(diffMs);
      const age = Math.abs(ageDt.getUTCFullYear() - 1970);
      return isNaN(age) ? '' : `${age} Y/O`;
    } catch {
      return '';
    }
  };

  const displayMember = lastScannedMember;
  const ageDisplay = displayMember ? calculateAge(displayMember.dateOfBirth) : '';

  // Floating background QR code sprites driven by 60FPS RAF physics
  const bgContainerRef = useRef<HTMLDivElement | null>(null);
  const qrDomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const qrPhysicsRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);

  const [qrSpritesConfig] = useState(() => [
    { size: 76, opacity: 0.18 },
    { size: 92, opacity: 0.16 },
    { size: 84, opacity: 0.20 },
    { size: 68, opacity: 0.16 },
    { size: 80, opacity: 0.19 },
    { size: 96, opacity: 0.15 },
    { size: 72, opacity: 0.18 },
    { size: 88, opacity: 0.17 },
    { size: 64, opacity: 0.15 },
    { size: 78, opacity: 0.18 },
    { size: 85, opacity: 0.16 },
    { size: 70, opacity: 0.19 }
  ]);

  useEffect(() => {
    const getBounds = () => {
      const container = bgContainerRef.current;
      const w = container?.clientWidth || window.innerWidth || 1200;
      const h = container?.clientHeight || window.innerHeight || 800;
      return { width: Math.max(w, 320), height: Math.max(h, 320) };
    };

    const { width, height } = getBounds();

    // Initialize positions staggered nicely across the screen
    qrPhysicsRef.current = qrSpritesConfig.map(({ size }, idx) => {
      const speed = 0.75 + (idx % 3) * 0.35;
      const angle = (idx * (Math.PI * 2 / qrSpritesConfig.length)) + 0.3;
      return {
        size,
        x: ((idx * (width / qrSpritesConfig.length)) + 40) % Math.max(width - size, 40),
        y: ((idx * 67 + 50) % Math.max(height - size, 40)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: idx * 25,
        rotationSpeed: (idx % 2 === 0 ? 0.35 : -0.35)
      };
    });

    let animId: number;
    const tick = () => {
      const { width, height } = getBounds();
      const sprites = qrPhysicsRef.current;

      for (let i = 0; i < sprites.length; i++) {
        const s = sprites[i];
        const el = qrDomRefs.current[i];
        if (!s || !el) continue;

        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;

        const maxX = Math.max(width - s.size, 10);
        const maxY = Math.max(height - s.size, 10);

        // Smooth bounce off edges
        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        } else if (s.x >= maxX) {
          s.x = maxX;
          s.vx = -Math.abs(s.vx);
        }

        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        } else if (s.y >= maxY) {
          s.y = maxY;
          s.vy = -Math.abs(s.vy);
        }

        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotation}deg)`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [qrSpritesConfig]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: isFullscreenMode ? '100vh' : 'auto',
        backgroundColor: '#0F2D1F',
        backgroundImage:
          'radial-gradient(ellipse at 50% 12%, #1E5C3D 0%, #144A2F 45%, #0A2618 100%)',
        borderRadius: isFullscreenMode ? '0' : '24px',
        padding: 'clamp(16px, 2.5vw, 32px)',
        boxSizing: 'border-box',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: isFullscreenMode ? 'fixed' : 'relative',
        inset: isFullscreenMode ? 0 : 'auto',
        zIndex: isFullscreenMode ? 9999 : 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: isFullscreenMode ? 'none' : '0 25px 60px -12px rgba(8, 34, 22, 0.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Dynamic Keyframes for Background Floating & Running QR Codes */}
      <style>{`
        @keyframes kioskQrFloatA {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.96); }
          25% { transform: translate3d(30px, -35px, 0) rotate(10deg) scale(1.04); }
          50% { transform: translate3d(60px, -10px, 0) rotate(22deg) scale(1); }
          75% { transform: translate3d(25px, 30px, 0) rotate(8deg) scale(0.97); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.96); }
        }

        @keyframes kioskQrFloatB {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
          25% { transform: translate3d(-35px, 40px, 0) rotate(-14deg) scale(1.06); }
          50% { transform: translate3d(-60px, 10px, 0) rotate(-24deg) scale(0.96); }
          75% { transform: translate3d(-20px, -35px, 0) rotate(-10deg) scale(1.03); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
        }

        @keyframes kioskQrFloatC {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(20px, -65px, 0) rotate(18deg) scale(1.08); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @keyframes kioskQrRunRight {
          0% {
            transform: translate3d(-120px, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(50vw, -45px, 0) rotate(180deg);
          }
          100% {
            transform: translate3d(calc(100vw + 120px), 15px, 0) rotate(360deg);
          }
        }

        @keyframes kioskQrRunLeft {
          0% {
            transform: translate3d(calc(100vw + 120px), 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(50vw, 50px, 0) rotate(-180deg);
          }
          100% {
            transform: translate3d(-140px, -25px, 0) rotate(-360deg);
          }
        }

        @keyframes kioskQrRunDiag {
          0% {
            transform: translate3d(-100px, 40px, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(50vw, -80px, 0) rotate(180deg);
          }
          100% {
            transform: translate3d(calc(100vw + 100px), -160px, 0) rotate(360deg);
          }
        }

      `}</style>

      {/* ==================================================== */}
      {/* ANIMATED BACKGROUND LAYER: DRIFTING & BOUNCING QR CODES */}
      {/* ==================================================== */}
      <div
        ref={bgContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0
        }}
        aria-hidden="true"
      >
        {/* Subtle grid mesh overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: `radial-gradient(circle at 1px 1px, #34D399 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Floating and actively moving QR code particle elements */}
        {qrSpritesConfig.map((item, idx) => (
          <div
            key={idx}
            ref={(el) => {
              qrDomRefs.current[idx] = el;
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${item.size}px`,
              height: `${item.size}px`,
              opacity: item.opacity,
              filter: 'drop-shadow(0 4px 14px rgba(16, 185, 129, 0.3))',
              willChange: 'transform',
              pointerEvents: 'none'
            }}
          >
            <img
              src="/attendance-qr.png"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
          </div>
        ))}
      </div>

      {/* Floating Kiosk Controls (Top Right: Fullscreen / Close) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          gap: '8px',
          zIndex: 20
        }}
      >
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreenMode ? 'Exit Fullscreen Kiosk' : 'Enter Fullscreen Kiosk'}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              backgroundColor: 'rgba(10, 36, 24, 0.65)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isFullscreenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreenMode ? 'Exit Kiosk' : 'Kiosk Mode'}</span>
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              backgroundColor: 'rgba(10, 36, 24, 0.65)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* SECTION A: HEADER                                    */}
      {/* ==================================================== */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '20px' }}>
        {/* Main Header Container (Rounded Capsule) */}
        <div
          style={{
            backgroundColor: 'rgba(15, 52, 34, 0.92)',
            borderRadius: '24px',
            border: '2px solid rgba(52, 211, 153, 0.45)',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Left: Library Logo Crest */}
          <div
            style={{
              width: 'clamp(54px, 6vw, 76px)',
              height: 'clamp(54px, 6vw, 76px)',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0
            }}
          >
            <img
              src="/logo.png"
              alt="Balingasag Public Library"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Center: Large Bold Title "DAILY USERS LOG" */}
          <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
            <h1
              style={{
                fontSize: 'clamp(26px, 4.2vw, 54px)',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                margin: 0,
                textTransform: 'uppercase',
                textShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                lineHeight: 1.1
              }}
            >
              DAILY USERS LOG
            </h1>
          </div>

          {/* Right: Decorative Library QR Graphic using uploaded asset */}
          <div
            style={{
              width: 'clamp(50px, 5.5vw, 72px)',
              height: 'clamp(50px, 5.5vw, 72px)',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
            }}
          >
            <img
              src="/attendance-qr.png"
              alt="Library QR"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Sub-banner: "PLEASE SCAN YOUR LIBRARY QR CODE HERE" with horizontal divider lines */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '18px',
            marginTop: '16px',
            padding: '0 8px'
          }}
        >
          <div
            style={{
              flex: 1,
              height: '3px',
              backgroundColor: '#34D399',
              borderRadius: '999px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
            }}
          />
          <h2
            style={{
              fontSize: 'clamp(14px, 1.8vw, 22px)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#FFFFFF',
              margin: 0,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            PLEASE SCAN YOUR LIBRARY QR CODE HERE
          </h2>
          <div
            style={{
              flex: 1,
              height: '3px',
              backgroundColor: '#34D399',
              borderRadius: '999px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
            }}
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* SECTION B: MAIN CONTENT AREA (2-Column Layout)       */}
      {/* ==================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 2,
          flex: 1,
          marginBottom: '20px'
        }}
      >
        {/* ========================================== */}
        {/* LEFT PANEL: LIVE CAMERA CAPTURE            */}
        {/* ========================================== */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header Row: "LIVE CAPTURE" Pill + Date & Time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid #E2E8F0'
            }}
          >
            {/* Pill Badge: LIVE CAPTURE in Theme Green */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#166534',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 2px 10px rgba(22, 101, 52, 0.35)'
              }}
            >
              <Camera size={18} />
              <span>LIVE CAPTURE</span>
            </div>

            {/* Live Date & Time Display */}
            <div style={{ textAlign: 'right', color: '#0F172A' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>{formattedDate}</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#166534',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                  marginTop: '1px'
                }}
              >
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Video / Camera Scanner Feed */}
          <div
            style={{
              flex: 1,
              minHeight: '340px',
              height: '380px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#020617',
              border: '2px solid rgba(22, 101, 52, 0.45)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CameraScanner
              onScan={processAttendanceScan}
              scannerId="daily-kiosk-camera"
              isActive={true}
              mode="qr"
              variant="kiosk"
              label="Position Library QR Code directly within the camera reticle"
            />
          </div>

          {/* Manual Input Fallback Bar (Under Camera) */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              marginTop: '14px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color={inlineError ? '#DC2626' : '#94A3B8'}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="kiosk-manual-member-id"
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                placeholder="Or enter Member ID (e.g. BPL-2026-0001)..."
                style={{
                  width: '100%',
                  height: '40px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: '10px',
                  border: inlineError ? '2px solid #EF4444' : '1px solid #CBD5E1',
                  outline: inlineError ? '2px solid rgba(239, 68, 68, 0.25)' : 'none',
                  fontSize: '13px',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              />
            </div>
            <button
              id="kiosk-manual-log-btn"
              type="submit"
              disabled={isProcessing}
              style={{
                height: '40px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isProcessing ? '#94A3B8' : '#166534',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isProcessing ? 'none' : '0 2px 8px rgba(22, 101, 52, 0.3)'
              }}
            >
              {isProcessing ? 'Verifying...' : 'Log'}
            </button>
          </form>

          {/* Inline Error Banner (Directly Below Input) */}
          {inlineError && (
            <div
              className="animate-modal-fade-in"
              role="alert"
              style={{
                marginTop: '10px',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '10px',
                color: '#991B1B',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                <AlertCircle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#991B1B', fontWeight: 800 }}>
                    {inlineError.title}
                  </strong>
                  <span style={{ color: '#7F1D1D' }}>{inlineError.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInlineError(null)}
                title="Dismiss error message"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* RIGHT PANEL: MEMBER PROFILE DISPLAY        */}
        {/* ========================================== */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(20, 62, 42, 0.94) 0%, rgba(13, 44, 30, 0.97) 100%)',
            borderRadius: '24px',
            border: (inlineError || feedback?.type === 'error')
              ? '2px solid rgba(239, 68, 68, 0.55)'
              : '2px solid rgba(52, 211, 153, 0.45)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
            transition: 'border-color 0.25s ease'
          }}
        >
          {/* Main Content Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 'clamp(16px, 2.5vw, 28px)',
              flex: 1
            }}
          >
            {/* Left: Circular Member Profile Photo / Error Icon / Placeholder */}
            <div
              style={{
                width: 'clamp(140px, 16vw, 220px)',
                height: 'clamp(140px, 16vw, 220px)',
                borderRadius: '50%',
                backgroundColor: (inlineError || feedback?.type === 'error') ? '#FEF2F2' : '#FFFFFF',
                border: (inlineError || feedback?.type === 'error')
                  ? '4px solid #EF4444'
                  : '4px solid #FFFFFF',
                boxShadow: (inlineError || feedback?.type === 'error')
                  ? '0 12px 30px rgba(239, 68, 68, 0.35)'
                  : '0 12px 30px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.25s ease'
              }}
            >
              {displayMember ? (
                displayMember.photoUrl ? (
                  <img
                    src={displayMember.photoUrl}
                    alt={displayMember.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: displayMember.status !== 'active' ? '#FEE2E2' : '#DCFCE7',
                      color: displayMember.status !== 'active' ? '#DC2626' : '#166534',
                      fontSize: 'clamp(36px, 4.5vw, 64px)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {displayMember.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )
              ) : (inlineError || feedback?.type === 'error') ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px'
                  }}
                >
                  <AlertCircle size={56} color="#DC2626" />
                  <span style={{ fontSize: '11px', fontWeight: 800, marginTop: '8px', color: '#DC2626', letterSpacing: '0.04em' }}>
                    VERIFICATION FAILED
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F1F5F9',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  title="No profile picture"
                >
                  <svg
                    viewBox="0 0 128 128"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block'
                    }}
                    aria-label="No profile picture"
                  >
                    <circle cx="64" cy="48" r="25" fill="#94A3B8" />
                    <path
                      d="M64 82 C38 82 20 98 18 128 L110 128 C108 98 90 82 64 82 Z"
                      fill="#94A3B8"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Right: Member Details Column or Inline Error State */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {displayMember ? (
                <div className="animate-modal-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Top Badges Row: Username Pill + Role Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.18)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <UserIcon size={15} />
                      <span>{displayMember.username || displayMember.memberId}</span>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.95)'
                      }}
                    >
                      <Users size={22} />
                      <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {displayMember.membershipType || 'USER'}
                      </span>
                    </div>
                  </div>

                  {/* Full Name */}
                  <h3
                    style={{
                      fontSize: 'clamp(22px, 2.6vw, 34px)',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: '4px 0 0',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.15,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    {displayMember.fullName}
                  </h3>

                  {/* Age / Classification */}
                  {ageDisplay ? (
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {ageDisplay}
                    </div>
                  ) : (
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {displayMember.membershipType} Patron
                    </div>
                  )}

                  {/* Department / Level / School */}
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.35 }}>
                    {displayMember.membershipType === 'Student'
                      ? 'Grade 11 - HUMSS • Student Services'
                      : 'Community Reader • General Services'}
                  </div>

                  {/* School / Institution */}
                  <div style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35 }}>
                    {displayMember.address || 'Balingasag Municipal Library Community Service'}
                  </div>

                  {/* Member ID Monospace with Mint Highlight */}
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: '#86EFAC',
                      marginTop: '4px'
                    }}
                  >
                    Member ID: {displayMember.memberId}
                  </div>

                  {/* Inactive or Suspended Inline Banner */}
                  {displayMember.status !== 'active' && (
                    <div
                      style={{
                        marginTop: '6px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        color: '#991B1B'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={16} color="#DC2626" />
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>
                          Account is currently {displayMember.status.toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLastScannedMember(null);
                          setInlineError(null);
                          setFeedback(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Scan Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (inlineError || feedback?.type === 'error') ? (
                /* Inline Error State Card in Right Panel */
                <div className="animate-modal-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: '#FCA5A5',
                      width: 'fit-content'
                    }}
                  >
                    <ShieldAlert size={15} />
                    <span>VERIFICATION FAILED</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(20px, 2.4vw, 30px)',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: '4px 0 0'
                    }}
                  >
                    {inlineError?.title || 'Patron Not Found'}
                  </h3>

                  <p style={{ fontSize: '14px', color: '#FCA5A5', margin: 0, lineHeight: 1.5 }}>
                    {inlineError?.message || feedback?.message || 'The scanned card could not be matched with an active library record.'}
                  </p>

                  <div
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      border: '1px dashed rgba(252, 165, 165, 0.4)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                      Recommended Next Steps:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
                      <li>Check the library card surface for smudges or glare under the camera.</li>
                      <li>Type the ID manually into the input box below the camera preview.</li>
                      <li>Inquire at the circulation desk to confirm patron registration.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInlineError(null);
                      setFeedback(null);
                      manualInputRef.current?.focus();
                    }}
                    style={{
                      marginTop: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: 'fit-content',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Dismiss & Ready Next Patron</span>
                  </button>
                </div>
              ) : (
                /* Neutral Placeholder when no member scanned yet */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      fontSize: '13px',
                      fontWeight: 700,
                      width: 'fit-content'
                    }}
                  >
                    <UserIcon size={15} />
                    <span>PATRON PROFILE</span>
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(20px, 2.4vw, 30px)',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: '4px 0 0'
                    }}
                  >
                    Ready for Next Patron
                  </h3>

                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.5 }}>
                    Hold up your official Balingasag Public Library ID card in front of the live capture camera on the left to automatically record your Time-In.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ATTENDANCE FEEDBACK BANNER (Bottom of Right Panel) */}
          <div style={{ marginTop: '20px' }}>
            {feedback ? (
              <div
                className="animate-modal-fade-in"
                style={{
                  backgroundColor:
                    feedback.type === 'time_in'
                      ? '#166534'
                      : '#991B1B',
                  borderRadius: '14px',
                  border:
                    feedback.type === 'time_in'
                      ? '2px solid #4ADE80'
                      : '2px solid #FCA5A5',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {feedback.type === 'error' ? (
                    <AlertCircle size={22} color="#FFFFFF" />
                  ) : (
                    <CheckCircle2 size={22} color="#FFFFFF" />
                  )}
                  <div>
                    <strong style={{ fontSize: '15px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {feedback.message}
                    </strong>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {feedback.timestamp}
                </span>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(9, 34, 23, 0.7)',
                  borderRadius: '14px',
                  border: '1px dashed rgba(52, 211, 153, 0.45)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="#34D399" />
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    Awaiting scan... Present your QR code to record entry or exit.
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    backgroundColor: 'rgba(52, 211, 153, 0.2)',
                    color: '#A7F3D0',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  STANDBY
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
