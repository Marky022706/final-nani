import React, { useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
  type CameraDevice
} from 'html5-qrcode';
import { Camera, RefreshCw, CheckCircle, VideoOff } from 'lucide-react';
import { playSuccessBeep } from '../../utils/sound';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  scannerId?: string;
  isActive?: boolean;
  label?: string;
  mode?: 'qr' | 'barcode' | 'all';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScan,
  scannerId = 'live-camera-scanner',
  isActive = true,
  label = 'Position QR code or Barcode in front of camera',
  mode = 'all'
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastScanTimeRef = useRef<number>(0);

  // Enumerate cameras on mount with pre-permission probe
  useEffect(() => {
    isMountedRef.current = true;

    const queryCameras = async () => {
      try {
        // Modern browsers only reveal device IDs and labels after getUserMedia permission is granted
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          try {
            const probeStream = await navigator.mediaDevices.getUserMedia({ video: true });
            probeStream.getTracks().forEach((track) => track.stop());
          } catch (permErr) {
            console.info('Permission probe note:', permErr);
          }
        }

        if (!isMountedRef.current) return;
        const devices = await Html5Qrcode.getCameras();
        if (!isMountedRef.current) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/rear camera on mobile devices if available, else first device
          const backCam = devices.find((d) => {
            const lbl = (d.label || '').toLowerCase();
            return lbl.includes('back') || lbl.includes('rear') || lbl.includes('environment');
          });
          const frontCam = devices.find((d) => {
            const lbl = (d.label || '').toLowerCase();
            return lbl.includes('front') || lbl.includes('user') || lbl.includes('webcam') || lbl.includes('integrated');
          });
          setSelectedCameraId(backCam ? backCam.id : frontCam ? frontCam.id : devices[0].id);
        } else {
          // If no devices enumerated, still allow generic start attempts (facingMode fallback)
          setCameras([]);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        console.warn('Camera enumeration note:', err);
      }
    };

    queryCameras();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Stop scanner and release all media stream tracks
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }

    // Force release any orphaned video tracks
    const element = document.getElementById(scannerId);
    if (element) {
      const videos = element.querySelectorAll('video');
      videos.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {
              // Ignore
            }
          });
          video.srcObject = null;
        }
      });
    }
  };

  // Start / stop scanner based on isActive and selected camera
  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    let isSubscribed = true;
    let timerId: ReturnType<typeof setTimeout>;

    const startCamera = async () => {
      // Allow slight 120ms debounce for modal animation and previous track cleanup
      await stopScanner();
      if (!isSubscribed || !isMountedRef.current) return;

      const element = document.getElementById(scannerId);
      if (!element) return;

      setStatus('starting');
      setErrorMessage(null);

      try {
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
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF
              ]
            : [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF
              ];

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false
        });
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            if (mode === 'barcode') {
              const width = Math.max(120, Math.min(Math.floor(viewfinderWidth * 0.85), viewfinderWidth - 16));
              const height = Math.max(60, Math.min(Math.floor(minDimension * 0.5), viewfinderHeight - 16));
              return { width, height };
            }
            const edge = Math.max(100, Math.min(Math.floor(minDimension * 0.72), minDimension - 16));
            return { width: edge, height: edge };
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
          // Normal frame scan without decodable payload
        };

        // Determine camera fallback sequence:
        // 1. Explicitly selected camera device ID
        // 2. Available enumerated camera ID
        // 3. User webcam (default on laptops / PCs)
        // 4. Environment camera (rear on mobile)
        const candidates: Array<string | MediaTrackConstraints> = [];
        if (selectedCameraId) {
          candidates.push(selectedCameraId);
        }
        if (cameras.length > 0 && (!selectedCameraId || !cameras.some((c) => c.id === selectedCameraId))) {
          candidates.push(cameras[0].id);
        }
        candidates.push({ facingMode: 'user' });
        candidates.push({ facingMode: 'environment' });

        let startedSuccessfully = false;
        let lastError: unknown = null;

        for (const candidate of candidates) {
          if (!isSubscribed || !isMountedRef.current) break;
          try {
            await html5QrCode.start(candidate, scanConfig, onScanSuccess, onScanFailure);
            startedSuccessfully = true;
            break;
          } catch (candidateErr) {
            lastError = candidateErr;
            console.info(`Camera candidate attempt with`, candidate, `not available, trying next fallback:`, candidateErr);
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
          friendlyMsg = 'Camera is currently in use by another application or tab.';
        } else if (rawMsg.toLowerCase().includes('notfound') || rawMsg.toLowerCase().includes('devices')) {
          friendlyMsg = 'No camera device detected. You can enter or search codes manually below.';
        } else if (rawMsg) {
          friendlyMsg = rawMsg;
        }

        setErrorMessage(friendlyMsg);
        setStatus('error');
      }
    };

    timerId = setTimeout(() => {
      startCamera();
    }, 120);

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
    // Trigger re-mount start
    setSelectedCameraId((prev) => (prev ? `${prev}` : ''));
  };

  return (
    <div
      style={{
        backgroundColor: '#090d16',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #1e293b',
        padding: '16px',
        color: '#ffffff',
        marginBottom: '16px',
        position: 'relative',
        boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
      }}
    >
      {/* Header / Camera Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                status === 'scanning' ? '#10b981' : status === 'starting' ? '#f59e0b' : '#ef4444',
              boxShadow: status === 'scanning' ? '0 0 8px #10b981' : 'none'
            }}
          />
          <span>{status === 'scanning' ? 'Live Camera Active' : status === 'starting' ? 'Starting Camera...' : 'Camera Offline'}</span>
        </div>

        {cameras.length > 1 && (
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || `Camera ${c.id.slice(0, 5)}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Video Container (Html5Qrcode injects video/canvas here) */}
      <div
        style={{
          position: 'relative',
          minHeight: '220px',
          maxHeight: '300px',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#020617',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <style>{`
          #${scannerId} video {
            width: 100% !important;
            height: 100% !important;
            max-height: 280px !important;
            object-fit: cover !important;
            border-radius: 8px !important;
          }
          #${scannerId} img[alt="Info icon"] {
            display: none !important;
          }
          #${scannerId} {
            border: none !important;
          }
        `}</style>

        {/* Scanner Element where Html5Qrcode renders (must always have block display so dimensions are non-zero) */}
        <div
          id={scannerId}
          style={{
            width: '100%',
            minHeight: '220px',
            display: 'block'
          }}
        />

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
              gap: '10px',
              backgroundColor: '#020617',
              color: '#94a3b8',
              padding: '24px',
              zIndex: 4
            }}
          >
            <RefreshCw className="animate-spin" size={28} style={{ color: 'var(--brand-forest)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 500 }}>Accessing camera feed...</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Please allow camera access if prompted</span>
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
              gap: '10px',
              backgroundColor: '#020617',
              color: '#f87171',
              textAlign: 'center',
              padding: '20px',
              zIndex: 5
            }}
          >
            <VideoOff size={32} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Camera Not Available</div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4, maxWidth: '320px' }}>
              {errorMessage || 'Please check camera permissions in your browser or enter the code manually below.'}
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '11px',
                marginTop: '6px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155'
              }}
            >
              <RefreshCw size={12} />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Success Detection Badge overlay */}
        {status === 'success' && lastScannedCode && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(16, 185, 129, 0.95)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <CheckCircle size={15} />
            <span>Captured: {lastScannedCode}</span>
          </div>
        )}
      </div>

      {/* Subtext Footer */}
      <div
        style={{
          marginTop: '10px',
          fontSize: '11.5px',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <Camera size={13} style={{ color: '#10b981' }} />
        <span>{label}</span>
      </div>
    </div>
  );
};
