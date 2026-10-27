import React, { useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
  type CameraDevice
} from 'html5-qrcode';
import { RefreshCw, CheckCircle, VideoOff, FlipHorizontal, Barcode, QrCode, Upload } from 'lucide-react';
import { playSuccessBeep } from '../../utils/sound';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  scannerId?: string;
  isActive?: boolean;
  label?: string;
  mode?: 'qr' | 'barcode' | 'all';
  variant?: 'default' | 'kiosk';
  reticleShape?: 'auto' | 'square' | 'barcode';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  scannerId = 'live-camera-scanner',
  isActive = true,
  label = 'Position QR code inside the target reticle',
  mode = 'all',
  variant = 'default',
  reticleShape = 'auto'
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isTransitioningRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Global unhandled rejection suppressor for browser video aborts
  useEffect(() => {
    isMountedRef.current = true;

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = String(reason?.message || reason || '');
      if (
        reason?.name === 'AbortError' ||
        msg.includes('The play() request was interrupted') ||
        msg.includes('interrupted because the media was removed')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Stop scanner safely, release media tracks, and purge any leftover DOM elements
  const stopScanner = async () => {
    if (scannerRef.current) {
      const activeInstance = scannerRef.current;
      scannerRef.current = null;
      try {
        const state = activeInstance.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          try {
            await activeInstance.stop();
          } catch {
            // Ignore internal html5-qrcode DOM removal race condition
          }
        }
        try {
          activeInstance.clear();
        } catch {
          // ignore
        }
      } catch (err: unknown) {
        const msg = String((err as Error)?.message || '');
        if (!msg.includes('AbortError') && !msg.includes('play()') && !msg.includes('removeChild')) {
          console.warn('Error stopping scanner:', err);
        }
      }
    }

    // Force release any orphaned video tracks & wipe container HTML
    const element = document.getElementById(scannerId);
    if (element) {
      const videos = element.querySelectorAll('video');
      videos.forEach((video) => {
        try {
          video.pause();
        } catch {
          // Ignore
        }
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {
              // Ignore
            }
          });
          try {
            video.srcObject = null;
          } catch {
            // Ignore
          }
        }
      });
      try {
        element.innerHTML = '';
      } catch {
        // Ignore
      }
    }
  };

  // Safe camera lifecycle effect: atomic startup without race conditions
  useEffect(() => {
    if (!isActive) {
      stopScanner();
      setStatus('idle');
      return;
    }

    let isSubscribed = true;
    let timerId: ReturnType<typeof setTimeout>;

    const startCamera = async () => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      try {
        await stopScanner();
        // Hardware release buffer: Windows Media Foundation requires ~120ms to free camera locks
        await new Promise((resolve) => setTimeout(resolve, 120));

        if (!isSubscribed || !isMountedRef.current) {
          isTransitioningRef.current = false;
          return;
        }

        const element = document.getElementById(scannerId);
        if (!element) {
          isTransitioningRef.current = false;
          return;
        }

        element.innerHTML = '';
        setStatus('starting');
        setErrorMessage(null);

        // Enumerate cameras if not already populated
        let availableDevices = cameras;
        if (availableDevices.length === 0) {
          try {
            const devices = await Html5Qrcode.getCameras();
            if (isMountedRef.current && devices && devices.length > 0) {
              setCameras(devices);
              availableDevices = devices;
            }
          } catch (camErr) {
            console.info('Camera getCameras note:', camErr);
          }
        }

        if (!isSubscribed || !isMountedRef.current) {
          isTransitioningRef.current = false;
          return;
        }

        // Determine target device ID
        let targetId = selectedCameraId;
        if (!targetId && availableDevices.length > 0) {
          const backCam = availableDevices.find((d) => {
            const lbl = (d.label || '').toLowerCase();
            return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment');
          });
          const frontCam = availableDevices.find((d) => {
            const lbl = (d.label || '').toLowerCase();
            return (
              lbl.includes('front') ||
              lbl.includes('user') ||
              lbl.includes('webcam') ||
              lbl.includes('integrated') ||
              lbl.includes('camera')
            );
          });
          targetId = backCam ? backCam.id : frontCam ? frontCam.id : availableDevices[0].id;
          if (isMountedRef.current && targetId) {
            setSelectedCameraId(targetId);
            const chosen = availableDevices.find((d) => d.id === targetId);
            const isFront = chosen
              ? !chosen.label.toLowerCase().includes('back') && !chosen.label.toLowerCase().includes('rear')
              : true;
            setIsMirrored(isFront);
          }
        }

        const formatsToSupport =
          mode === 'qr'
            ? [Html5QrcodeSupportedFormats.QR_CODE]
            : mode === 'barcode'
            ? [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF
              ]
            : [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF,
                Html5QrcodeSupportedFormats.QR_CODE
              ];

        // Safe qrbox function: CAN NEVER exceed viewfinder dimensions (prevents html5-qrcode exception)
        const scanConfig: {
          fps: number;
          disableFlip: boolean;
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => { width: number; height: number };
        } = {
          fps: mode === 'barcode' ? 12 : 15,
          disableFlip: false,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const safeW = Math.max(10, viewfinderWidth - 10);
            const safeH = Math.max(10, viewfinderHeight - 10);
            if (mode === 'barcode') {
              const targetW = Math.min(Math.floor(viewfinderWidth * 0.88), 540);
              const targetH = Math.min(Math.floor(viewfinderHeight * 0.44), 200);
              return {
                width: Math.max(40, Math.min(targetW, safeW)),
                height: Math.max(30, Math.min(targetH, safeH))
              };
            } else if (mode === 'qr') {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const targetS = Math.floor(minEdge * 0.75);
              return {
                width: Math.max(40, Math.min(targetS, safeW)),
                height: Math.max(40, Math.min(targetS, safeH))
              };
            } else {
              const targetW = Math.min(Math.floor(viewfinderWidth * 0.82), 480);
              const targetH = Math.min(Math.floor(viewfinderHeight * 0.55), 280);
              return {
                width: Math.max(40, Math.min(targetW, safeW)),
                height: Math.max(30, Math.min(targetH, safeH))
              };
            }
          }
        };

        const onScanSuccess = (decodedText: string) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current < 1200) return;
          lastScanTimeRef.current = now;

          playSuccessBeep();
          const cleanText = decodedText.trim();
          setLastScannedCode(cleanText);
          setStatus('success');
          onScan(cleanText);

          setTimeout(() => {
            if (isMountedRef.current) {
              setStatus('scanning');
            }
          }, 1200);
        };

        const onScanFailure = () => {
          // Frame scanned without decodable code
        };

        // Determine candidate sequence: specific camera ID first, then front cam (user), then back cam (env)
        const candidates: Array<string | MediaTrackConstraints> = [];
        if (targetId) {
          candidates.push(targetId);
        }
        for (const dev of availableDevices) {
          if (dev.id !== targetId && !candidates.includes(dev.id)) {
            candidates.push(dev.id);
          }
        }
        // General fallback constraints: 'user' (laptop/desktop webcam) first, then 'environment' (mobile back)
        candidates.push({ facingMode: 'user' });
        candidates.push({ facingMode: 'environment' });

        let startedSuccessfully = false;
        let lastError: unknown = null;

        for (const candidate of candidates) {
          if (!isSubscribed || !isMountedRef.current) break;
          let instance: Html5Qrcode | null = null;
          try {
            const containerEl = document.getElementById(scannerId);
            if (!containerEl) break;
            containerEl.innerHTML = '';

            instance = new Html5Qrcode(scannerId, {
              formatsToSupport,
              verbose: false,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: false
              }
            });
            scannerRef.current = instance;

            await instance.start(candidate, scanConfig, onScanSuccess, onScanFailure);
            startedSuccessfully = true;
            break;
          } catch (candidateErr) {
            lastError = candidateErr;
            if (instance) {
              try {
                const s = instance.getState();
                if (s === Html5QrcodeScannerState.SCANNING || s === Html5QrcodeScannerState.PAUSED) {
                  await instance.stop();
                }
              } catch {
                // ignore
              }
              try {
                instance.clear();
              } catch {
                // ignore
              }
            }
            scannerRef.current = null;
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }

        if (!startedSuccessfully) {
          throw lastError || new Error('No compatible video input device could be started.');
        }

        if (isSubscribed && isMountedRef.current) {
          setStatus('scanning');
        }
      } catch (err: unknown) {
        if (!isSubscribed || !isMountedRef.current) return;
        console.error('Failed to start camera scanner:', err);
        const rawMsg = (err as Error)?.message || '';
        let friendlyMsg = 'Camera access was blocked or unavailable.';
        if (rawMsg.toLowerCase().includes('permission') || rawMsg.toLowerCase().includes('notallowed')) {
          friendlyMsg = 'Camera permission was denied. Please allow camera access in your browser address bar.';
        } else if (rawMsg.toLowerCase().includes('notreadable') || rawMsg.toLowerCase().includes('in use')) {
          friendlyMsg = 'Camera is currently in use by another application or tab. Please close other camera tabs and click Retry.';
        } else if (rawMsg.toLowerCase().includes('notfound') || rawMsg.toLowerCase().includes('devices')) {
          friendlyMsg = 'No camera device detected. You can enter or search codes manually.';
        } else if (rawMsg) {
          friendlyMsg = rawMsg;
        }

        setErrorMessage(friendlyMsg);
        setStatus('error');
      } finally {
        isTransitioningRef.current = false;
      }
    };

    // Debounce camera start by 150ms to ensure DOM node is laid out and previous streams settled
    timerId = setTimeout(() => {
      startCamera();
    }, 150);

    return () => {
      isSubscribed = false;
      clearTimeout(timerId);
      stopScanner();
    };
  }, [isActive, selectedCameraId, scannerId, mode]);

  const handleRestart = () => {
    setStatus('idle');
    setErrorMessage(null);
    setLastScannedCode(null);
    setSelectedCameraId((prev) => (prev ? `${prev}` : ''));
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatus('starting');
      setErrorMessage(null);
      await stopScanner();

      const sandboxId = `${scannerId}-sandbox-file`;
      let sandboxEl = document.getElementById(sandboxId);
      if (!sandboxEl) {
        sandboxEl = document.createElement('div');
        sandboxEl.id = sandboxId;
        sandboxEl.style.display = 'none';
        document.body.appendChild(sandboxEl);
      }

      const fileScanner = new Html5Qrcode(sandboxId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });

      const decodedText = await fileScanner.scanFile(file, false);
      try {
        fileScanner.clear();
      } catch {
        // ignore
      }

      if (decodedText) {
        playSuccessBeep();
        const cleanText = decodedText.trim();
        setLastScannedCode(cleanText);
        setStatus('success');
        onScan(cleanText);
      }
    } catch (err: unknown) {
      console.warn('File scan note:', err);
      setErrorMessage('Could not decode barcode from uploaded image. Please ensure the barcode is clear, flat, and well-lit.');
      setStatus('error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const isKiosk = variant === 'kiosk';
  const isBarcode =
    reticleShape === 'barcode' ||
    mode === 'barcode' ||
    (typeof scannerId === 'string' && scannerId.toLowerCase().includes('barcode'));
  const reticleColor = isBarcode ? '#EF4444' : '#10B981';
  const reticleGlow = isBarcode
    ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.95))'
    : 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isKiosk ? '100%' : 'auto',
        minHeight: isKiosk ? '420px' : isBarcode ? '360px' : '280px',
        backgroundColor: '#020617',
        borderRadius: isKiosk ? '16px' : 'var(--radius-lg)',
        border: isKiosk ? 'none' : '1px solid #1e293b',
        padding: isKiosk ? 0 : '16px',
        color: '#ffffff',
        marginBottom: isKiosk ? 0 : '16px',
        overflow: 'hidden',
        boxShadow: isKiosk ? 'none' : '0 4px 18px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Dynamic Scoped CSS for html5-qrcode Container & Video */}
      <style>{`
        #${scannerId} {
          width: 100% !important;
          height: 100% !important;
          min-height: ${isKiosk ? '420px' : isBarcode ? '360px' : '280px'} !important;
          position: relative !important;
          overflow: hidden !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: #020617 !important;
        }
        #${scannerId} video {
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          display: block !important;
          border-radius: ${isKiosk ? '16px' : '8px'} !important;
          ${isMirrored ? 'transform: scaleX(-1);' : ''}
        }
        /* Hide any duplicate video instances caused by fast hot reloads */
        #${scannerId} video:not(:last-of-type) {
          display: none !important;
        }
        /* Hide internal canvas elements */
        #${scannerId} canvas {
          display: none !important;
        }
        /* Hide html5-qrcode's awkward built-in shaded box */
        #${scannerId} #qr-shaded-region {
          display: none !important;
        }
        #${scannerId} img[alt="Info icon"] {
          display: none !important;
        }

        @keyframes laser-sweep {
          0% {
            top: 4px;
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: calc(100% - 6px);
            opacity: 0.4;
          }
        }

        @keyframes barcode-laser-sweep {
          0% {
            top: 6px;
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: calc(100% - 8px);
            opacity: 0.55;
          }
        }
      `}</style>

      {/* Floating Header Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'auto'
        }}
      >
        {/* Live Camera Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '999px',
            backgroundColor: isBarcode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            backdropFilter: 'blur(8px)',
            border: isBarcode ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(16, 185, 129, 0.45)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            color: isBarcode ? '#FCA5A5' : '#6EE7B7'
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: status === 'scanning' ? reticleColor : status === 'starting' ? '#f59e0b' : '#ef4444',
              boxShadow: status === 'scanning' ? `0 0 10px ${reticleColor}` : 'none'
            }}
          />
          <span>
            {status === 'scanning'
              ? isBarcode
                ? '1D Barcode Camera Active'
                : '2D QR Scanner Active'
              : status === 'starting'
              ? 'Starting Camera...'
              : 'Camera Offline'}
          </span>
        </div>

        {/* Camera Selector & Mirror Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Mirror toggle button */}
          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            title={isMirrored ? 'Disable Mirror View' : 'Enable Mirror View'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: isMirrored ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.75)',
              color: isMirrored ? '#34D399' : '#CBD5E1',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FlipHorizontal size={15} />
          </button>

          {/* Upload / Snap Barcode Image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image or snap photo of barcode/QR"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#38BDF8',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Upload size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileScan}
          />

          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '5px 10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#F1F5F9',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                maxWidth: '190px',
                textOverflow: 'ellipsis'
              }}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id} style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Video Viewport (Html5Qrcode renders video here) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: isKiosk ? '420px' : isBarcode ? '360px' : '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Scanner Element where Html5Qrcode injects video */}
        <div id={scannerId} />

        {/* Custom Scanning Reticle with 4 Corner Brackets & Laser */}
        {status === 'scanning' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3
            }}
          >
            {/* Center Target Box */}
            <div
              style={{
                width: isBarcode
                  ? isKiosk ? 'clamp(380px, 92%, 580px)' : 'clamp(350px, 90%, 540px)'
                  : isKiosk ? '260px' : '220px',
                height: isBarcode
                  ? isKiosk ? '160px' : '150px'
                  : isKiosk ? '260px' : '220px',
                position: 'relative',
                borderRadius: isBarcode ? '12px' : '16px',
                boxShadow: isBarcode
                  ? '0 0 0 9999px rgba(2, 6, 23, 0.38)'
                  : '0 0 0 9999px rgba(2, 6, 23, 0.42)',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Corner 1: Top-Left */}
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  width: isBarcode ? '64px' : '36px',
                  height: isBarcode ? '32px' : '36px',
                  borderTop: `4px solid ${reticleColor}`,
                  borderLeft: `4px solid ${reticleColor}`,
                  borderTopLeftRadius: isBarcode ? '8px' : '12px',
                  filter: reticleGlow
                }}
              />
              {/* Corner 2: Top-Right */}
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: isBarcode ? '64px' : '36px',
                  height: isBarcode ? '32px' : '36px',
                  borderTop: `4px solid ${reticleColor}`,
                  borderRight: `4px solid ${reticleColor}`,
                  borderTopRightRadius: isBarcode ? '8px' : '12px',
                  filter: reticleGlow
                }}
              />
              {/* Corner 3: Bottom-Left */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-2px',
                  width: isBarcode ? '64px' : '36px',
                  height: isBarcode ? '32px' : '36px',
                  borderBottom: `4px solid ${reticleColor}`,
                  borderLeft: `4px solid ${reticleColor}`,
                  borderBottomLeftRadius: isBarcode ? '8px' : '12px',
                  filter: reticleGlow
                }}
              />
              {/* Corner 4: Bottom-Right */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: isBarcode ? '64px' : '36px',
                  height: isBarcode ? '32px' : '36px',
                  borderBottom: `4px solid ${reticleColor}`,
                  borderRight: `4px solid ${reticleColor}`,
                  borderBottomRightRadius: isBarcode ? '8px' : '12px',
                  filter: reticleGlow
                }}
              />

              {isBarcode ? (
                <>
                  {/* Left & Right Aiming Laser Notches */}
                  <span
                    style={{
                      position: 'absolute',
                      left: '-12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '3px',
                      backgroundColor: '#EF4444',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px #EF4444'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '-12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '3px',
                      backgroundColor: '#EF4444',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px #EF4444'
                    }}
                  />

                  {/* Faint Horizontal Reference Alignment Line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '1px',
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.25) 15%, rgba(248, 113, 113, 0.55) 50%, rgba(239, 68, 68, 0.25) 85%, transparent 100%)',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Faint Barcode Stripes Watermark Guide */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '16px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.13,
                      pointerEvents: 'none'
                    }}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 200 45" preserveAspectRatio="none" fill="#FFFFFF">
                      <rect x="0" y="0" width="4" height="45" />
                      <rect x="8" y="0" width="2" height="45" />
                      <rect x="14" y="0" width="6" height="45" />
                      <rect x="24" y="0" width="2" height="45" />
                      <rect x="30" y="0" width="8" height="45" />
                      <rect x="42" y="0" width="3" height="45" />
                      <rect x="48" y="0" width="5" height="45" />
                      <rect x="58" y="0" width="2" height="45" />
                      <rect x="64" y="0" width="7" height="45" />
                      <rect x="75" y="0" width="4" height="45" />
                      <rect x="82" y="0" width="2" height="45" />
                      <rect x="88" y="0" width="6" height="45" />
                      <rect x="98" y="0" width="3" height="45" />
                      <rect x="105" y="0" width="5" height="45" />
                      <rect x="114" y="0" width="2" height="45" />
                      <rect x="120" y="0" width="8" height="45" />
                      <rect x="132" y="0" width="4" height="45" />
                      <rect x="140" y="0" width="3" height="45" />
                      <rect x="147" y="0" width="6" height="45" />
                      <rect x="157" y="0" width="2" height="45" />
                      <rect x="163" y="0" width="7" height="45" />
                      <rect x="174" y="0" width="3" height="45" />
                      <rect x="181" y="0" width="5" height="45" />
                      <rect x="190" y="0" width="2" height="45" />
                      <rect x="196" y="0" width="4" height="45" />
                    </svg>
                  </div>

                  {/* Animated Barcode Red Laser Sweep */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '6px',
                      right: '6px',
                      height: '2.5px',
                      background:
                        'linear-gradient(90deg, transparent 0%, #EF4444 15%, #F87171 50%, #EF4444 85%, transparent 100%)',
                      boxShadow: '0 0 8px #EF4444, 0 0 16px rgba(248, 113, 113, 0.8), 0 0 24px rgba(239, 68, 68, 0.4)',
                      animation: 'barcode-laser-sweep 1.8s ease-in-out infinite alternate'
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Center crosshair dot */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.4)',
                      border: '1.5px solid #10B981'
                    }}
                  />

                  {/* Animated Laser Scanning Beam */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      height: '2px',
                      background:
                        'linear-gradient(90deg, transparent 0%, #10b981 30%, #34d399 50%, #10b981 70%, transparent 100%)',
                      boxShadow: '0 0 10px #10b981, 0 0 18px rgba(52, 211, 153, 0.7)',
                      animation: 'laser-sweep 2.2s ease-in-out infinite alternate'
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Starting / Loading Overlay */}
        {status === 'starting' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#020617',
              color: '#94a3b8',
              padding: '24px',
              zIndex: 4
            }}
          >
            <RefreshCw className="animate-spin" size={32} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
              Accessing camera feed...
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              Please allow camera permission if prompted by your browser
            </span>
          </div>
        )}

        {/* Error / Offline Fallback */}
        {status === 'error' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#020617',
              color: '#f87171',
              textAlign: 'center',
              padding: '24px',
              zIndex: 5
            }}
          >
            <VideoOff size={36} color="#EF4444" />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F87171' }}>
              Camera Unavailable
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, maxWidth: '320px' }}>
              {errorMessage || 'Please check camera permissions in your browser or enter Member ID below.'}
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '12px',
                marginTop: '6px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                gap: '6px'
              }}
            >
              <RefreshCw size={13} />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Success Detection Badge Overlay */}
        {status === 'success' && lastScannedCode && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(16, 185, 129, 0.95)',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              zIndex: 15,
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <CheckCircle size={16} />
            <span>Captured: {lastScannedCode}</span>
          </div>
        )}

        {/* Floating Bottom Helper Tag & Barcode Tips */}
        {isBarcode && status === 'scanning' && (
          <div
            style={{
              position: 'absolute',
              bottom: '44px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(2, 6, 23, 0.88)',
              backdropFilter: 'blur(8px)',
              color: '#CBD5E1',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              zIndex: 10,
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            <span>📐 Hold flat & horizontal</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <span>📏 15–25 cm distance</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <span>✨ Avoid glossy glare</span>
          </div>
        )}

        {/* Floating Bottom Helper Tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: '999px',
            backgroundColor: isBarcode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            color: '#E2E8F0',
            border: isBarcode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          {isBarcode ? (
            <Barcode size={14} style={{ color: '#EF4444' }} />
          ) : (
            <QrCode size={14} style={{ color: '#10b981' }} />
          )}
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
};
