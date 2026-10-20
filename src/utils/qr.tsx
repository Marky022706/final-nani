import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QrProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Standard ISO/IEC 18004 compliant QR Code SVG component.
 * Decodable by optical cameras, barcode scanners, and mobile devices.
 */
export const QrCodeSvg: React.FC<QrProps> = ({
  value,
  size = 120,
  className = '',
}) => {
  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'BALINGASAG-MEMBER', { errorCorrectionLevel: 'M' });
      const modSize = qr.modules.size;
      const grid: boolean[][] = [];
      for (let r = 0; r < modSize; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < modSize; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        grid.push(row);
      }
      return grid;
    } catch {
      return [];
    }
  }, [value]);

  const matrixSize = matrix.length || 21;
  const cellSize = size / matrixSize;

  return (
    <div className={`inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.15}
                height={cellSize + 0.15}
                fill="#0f172a"
              />
            );
          })
        )}
      </svg>
    </div>
  );
};

export const downloadQrCode = async (value: string, filename = 'member-qr.svg') => {
  try {
    const svgString = await QRCode.toString(value || 'BALINGASAG-MEMBER', {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      width: 320
    });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to generate downloadable QR code:', err);
  }
};

export const printQrCode = async (value: string, label: string) => {
  const printWindow = window.open('', '_blank', 'width=640,height=680');
  if (!printWindow) {
    window.print();
    return;
  }

  let qrSvg = '';
  try {
    qrSvg = await QRCode.toString(value || 'BALINGASAG-MEMBER', {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      width: 220
    });
  } catch {
    qrSvg = `<div style="font-family:monospace;padding:20px;border:1px solid #000">${value}</div>`;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Patron QR - ${value}</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            text-align: center;
            padding: 30px 20px;
            color: #0f172a;
          }
          .card {
            display: inline-block;
            border: 2px solid #166534;
            border-radius: 14px;
            padding: 24px;
            max-width: 360px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          h2 { margin: 0 0 4px 0; color: #166534; font-size: 18px; text-transform: uppercase; letter-spacing: -0.01em; }
          p { margin: 2px 0 16px 0; color: #64748b; font-size: 12px; }
          .qr-container { margin: 12px auto; display: flex; justify-content: center; }
          .qr-container svg { width: 220px; height: 220px; }
          .id-badge { font-family: monospace; font-size: 18px; font-weight: bold; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 6px 14px; border-radius: 8px; display: inline-block; margin-top: 10px; letter-spacing: 0.05em; }
          .footer { font-size: 11px; color: #94a3b8; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="/logo.png" alt="Logo" style="width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 8px; display: block;" />
          <h2>Balingasag Municipal Library</h2>
          <p>Official Patron Optical Token • Est. 1991</p>
          <div class="qr-container">
            ${qrSvg}
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 6px;">${label}</div>
          <div class="id-badge">${value}</div>
          <div class="footer">Scan for Attendance, Borrowing & Return</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
