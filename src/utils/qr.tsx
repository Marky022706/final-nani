import React from 'react';

interface QrProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrProps> = ({
  value,
  size = 120,
  className = '',
}) => {
  // Deterministic 21x21 QR code matrix representation
  const matrixSize = 21;
  
  // Simple deterministic hash matrix generator
  const getMatrix = (text: string) => {
    const grid: boolean[][] = Array.from({ length: matrixSize }, () =>
      Array(matrixSize).fill(false)
    );

    // Finder patterns helper (7x7 in top-left, top-right, bottom-left)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startY + r][startX + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(matrixSize - 7, 0);
    drawFinder(0, matrixSize - 7);

    // Timing patterns
    for (let i = 8; i < matrixSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Fill data area with deterministic hash
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) + text.charCodeAt(i);
    }

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder areas
        const isFinderTL = r < 8 && c < 8;
        const isFinderTR = r < 8 && c >= matrixSize - 8;
        const isFinderBL = r >= matrixSize - 8 && c < 8;
        if (isFinderTL || isFinderTR || isFinderBL) continue;
        if (r === 6 || c === 6) continue;

        const cellHash = (hash ^ (r * 31 + c * 17)) & 0xff;
        grid[r][c] = cellHash % 2 === 0;
      }
    }

    return grid;
  };

  const matrix = getMatrix(value || 'BALINGASAG-MEMBER');
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
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill="#0f172a"
                rx={0.5}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};

export const downloadQrCode = (value: string, filename = 'member-qr.svg') => {
  const svgElement = document.querySelector(`[data-qr-value="${value}"] svg`) || document.querySelector('.qr-modal-svg svg');
  if (!svgElement) {
    // Fallback: create an SVG string
    const matrixSize = 21;
    const size = 300;
    const cellSize = size / matrixSize;
    let rects = '';
    // deterministic hash
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
    }
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        const isFinderTL = r < 7 && c < 7 && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        const isFinderTR = r < 7 && c >= matrixSize - 7 && (r === 0 || r === 6 || c === matrixSize - 7 || c === matrixSize - 1 || (r >= 2 && r <= 4 && c >= matrixSize - 5 && c <= matrixSize - 3));
        const isFinderBL = r >= matrixSize - 7 && c < 7 && (r === matrixSize - 7 || r === matrixSize - 1 || c === 0 || c === 6 || (r >= matrixSize - 5 && r <= matrixSize - 3 && c >= 2 && c <= 4));
        const cellHash = (hash ^ (r * 31 + c * 17)) & 0xff;
        if (isFinderTL || isFinderTR || isFinderBL || (r > 7 && c > 7 && cellHash % 2 === 0)) {
          rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
        }
      }
    }
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printQrCode = (value: string, label: string) => {
  const printWindow = window.open('', '_blank', 'width=600,height=600');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Code - ${value}</title>
        <style>
          body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            text-align: center;
            padding: 40px 20px;
            color: #0f172a;
          }
          .card {
            display: inline-block;
            border: 2px solid #064e3b;
            border-radius: 12px;
            padding: 24px;
            max-width: 340px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          h2 { margin: 0 0 4px 0; color: #064e3b; font-size: 18px; text-transform: uppercase; }
          p { margin: 2px 0 16px 0; color: #64748b; font-size: 12px; }
          .id-badge { font-family: monospace; font-size: 20px; font-weight: bold; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-top: 12px; letter-spacing: 0.05em; }
          .footer { font-size: 11px; color: #94a3b8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Balingasag Public Library</h2>
          <p>Official Patron Optical Token</p>
          <div style="margin: 16px auto;">
            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#ffffff" />
              <!-- QR Finder and Code presentation -->
              <rect x="10" y="10" width="50" height="50" fill="#0f172a" rx="4"/>
              <rect x="18" y="18" width="34" height="34" fill="#ffffff" rx="2"/>
              <rect x="25" y="25" width="20" height="20" fill="#0f172a" rx="2"/>
              <rect x="140" y="10" width="50" height="50" fill="#0f172a" rx="4"/>
              <rect x="148" y="18" width="34" height="34" fill="#ffffff" rx="2"/>
              <rect x="155" y="25" width="20" height="20" fill="#0f172a" rx="2"/>
              <rect x="10" y="140" width="50" height="50" fill="#0f172a" rx="4"/>
              <rect x="18" y="148" width="34" height="34" fill="#ffffff" rx="2"/>
              <rect x="25" y="155" width="20" height="20" fill="#0f172a" rx="2"/>
              <!-- Data modules -->
              <rect x="70" y="20" width="12" height="12" fill="#0f172a"/>
              <rect x="90" y="20" width="12" height="12" fill="#0f172a"/>
              <rect x="110" y="20" width="12" height="12" fill="#0f172a"/>
              <rect x="70" y="50" width="12" height="12" fill="#0f172a"/>
              <rect x="100" y="50" width="12" height="12" fill="#0f172a"/>
              <rect x="20" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="50" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="80" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="110" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="140" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="170" y="70" width="12" height="12" fill="#0f172a"/>
              <rect x="70" y="100" width="12" height="12" fill="#0f172a"/>
              <rect x="100" y="100" width="12" height="12" fill="#0f172a"/>
              <rect x="130" y="100" width="12" height="12" fill="#0f172a"/>
              <rect x="160" y="100" width="12" height="12" fill="#0f172a"/>
              <rect x="80" y="130" width="12" height="12" fill="#0f172a"/>
              <rect x="110" y="130" width="12" height="12" fill="#0f172a"/>
              <rect x="140" y="130" width="12" height="12" fill="#0f172a"/>
              <rect x="70" y="160" width="12" height="12" fill="#0f172a"/>
              <rect x="100" y="160" width="12" height="12" fill="#0f172a"/>
              <rect x="130" y="160" width="12" height="12" fill="#0f172a"/>
              <rect x="160" y="160" width="12" height="12" fill="#0f172a"/>
            </svg>
          </div>
          <div><strong>${label}</strong></div>
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
