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
