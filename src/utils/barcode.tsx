import React from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeProps> = ({
  value,
  height = 50,
  showText = true,
  className = '',
}) => {
  // Generate consistent pseudo-random pattern for barcode bars based on value
  const generateBars = (code: string) => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = (hash << 5) - hash + code.charCodeAt(i);
      hash |= 0;
    }
    
    // Create standard start/stop guard patterns + data pattern
    const pattern: number[] = [2, 1, 1, 2, 1]; // Start guard
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      pattern.push((charCode % 3) + 1);
      pattern.push(((charCode >> 2) % 2) + 1);
      pattern.push(((charCode >> 4) % 3) + 1);
      pattern.push(1);
    }
    pattern.push(2, 1, 2, 1, 2); // Stop guard
    return pattern;
  };

  const bars = generateBars(value || 'BPL-000000');
  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const unitWidth = 2.2;
  const svgWidth = totalUnits * unitWidth + 24;

  let currentX = 12;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${height + (showText ? 20 : 0)}`}
        width={svgWidth}
        height={height + (showText ? 20 : 0)}
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="#ffffff" rx="4" />
        {bars.map((barWidth, index) => {
          const isBlack = index % 2 === 0;
          const x = currentX;
          currentX += barWidth * unitWidth;
          if (!isBlack) return null;
          return (
            <rect
              key={index}
              x={x}
              y={6}
              width={barWidth * unitWidth}
              height={height - 10}
              fill="#0f172a"
            />
          );
        })}
        {showText && (
          <text
            x={svgWidth / 2}
            y={height + 10}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="12"
            fontWeight="600"
            fill="#0f172a"
            letterSpacing="2"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
};
