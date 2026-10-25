import React, { useMemo } from 'react';

/**
 * Standard ISO/IEC 15417 compliant Code 128 (Code Set B) Barcode Generator.
 * Decodable by optical camera scanners (Html5Qrcode / ZXing), laser barcode guns,
 * 2D imagers, and smartphone camera scanners.
 */

// Official 107 Code 128 symbol patterns (widths of alternating bars and spaces)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131',
  '211412', // 103: Start Code A
  '211214', // 104: Start Code B (Full standard ASCII 32-126)
  '211232', // 105: Start Code C
  '2331112' // 106: Stop Code (13 modules)
];

const START_CODE_B = 104;
const STOP_CODE = 106;
const QUIET_ZONE_MODULES = 10; // ISO standard minimum quiet zone

interface BarElement {
  isBar: boolean;
  width: number;
}

/**
 * Encode an ASCII string into standard Code 128 (Set B) bar sequence.
 */
export const encodeCode128B = (rawText: string): { elements: BarElement[]; totalModules: number; sanitizedText: string } => {
  // Sanitize: filter out non-printable ASCII
  let sanitized = (rawText || 'BPL-000000')
    .split('')
    .filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126)
    .join('');

  if (!sanitized) sanitized = 'BPL-000000';

  const symbols: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < sanitized.length; i++) {
    const val = sanitized.charCodeAt(i) - 32;
    symbols.push(val);
    checkSum += val * (i + 1);
  }

  const checkDigit = checkSum % 103;
  symbols.push(checkDigit);
  symbols.push(STOP_CODE);

  const elements: BarElement[] = [];

  // Left quiet zone
  elements.push({ isBar: false, width: QUIET_ZONE_MODULES });

  let totalModules = QUIET_ZONE_MODULES;

  for (const sym of symbols) {
    const pattern = CODE128_PATTERNS[sym] || '212222';
    for (let pIdx = 0; pIdx < pattern.length; pIdx++) {
      const width = parseInt(pattern[pIdx], 10);
      const isBar = pIdx % 2 === 0; // Alternates: bar, space, bar, space...
      elements.push({ isBar, width });
      totalModules += width;
    }
  }

  // Right quiet zone
  elements.push({ isBar: false, width: QUIET_ZONE_MODULES });
  totalModules += QUIET_ZONE_MODULES;

  return { elements, totalModules, sanitizedText: sanitized };
};

export interface BarcodeProps {
  value: string;
  height?: number;
  showText?: boolean;
  moduleWidth?: number;
  className?: string;
}

/**
 * High-precision scannable Code 128 Barcode SVG Component.
 */
export const BarcodeSvg: React.FC<BarcodeProps> = ({
  value,
  height = 50,
  showText = true,
  moduleWidth = 1.8,
  className = ''
}) => {
  const { elements, totalModules, sanitizedText } = useMemo(() => {
    return encodeCode128B(value);
  }, [value]);

  const svgWidth = Math.ceil(totalModules * moduleWidth);
  const textOffset = showText ? 18 : 0;
  const svgHeight = height + textOffset;

  let currentX = 0;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      data-barcode-value={sanitizedText}
      style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '2px' }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
        className="block overflow-visible"
        shapeRendering="crispEdges"
      >
        {/* Pure white background for high optical contrast */}
        <rect width="100%" height="100%" fill="#ffffff" />

        {/* Barcode bars */}
        {elements.map((el, index) => {
          const x = currentX;
          const barW = el.width * moduleWidth;
          currentX += barW;

          if (!el.isBar) return null;

          return (
            <rect
              key={index}
              x={x}
              y={2}
              width={barW}
              height={height - 4}
              fill="#000000"
            />
          );
        })}

        {/* Human-readable monospace text label */}
        {showText && (
          <text
            x={svgWidth / 2}
            y={height + 12}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            fontSize="12"
            fontWeight="700"
            fill="#0f172a"
            letterSpacing="2"
          >
            {sanitizedText}
          </text>
        )}
      </svg>
    </div>
  );
};

/**
 * Generate a standalone SVG string of the scannable Code 128 barcode.
 */
export const generateBarcodeSvgString = (
  value: string,
  options: { height?: number; showText?: boolean; moduleWidth?: number } = {}
): string => {
  const { height = 50, showText = true, moduleWidth = 2 } = options;
  const { elements, totalModules, sanitizedText } = encodeCode128B(value);

  const svgWidth = Math.ceil(totalModules * moduleWidth);
  const textOffset = showText ? 18 : 0;
  const svgHeight = height + textOffset;

  let currentX = 0;
  let rects = '';

  for (const el of elements) {
    const barW = el.width * moduleWidth;
    if (el.isBar) {
      rects += `<rect x="${currentX.toFixed(2)}" y="2" width="${barW.toFixed(2)}" height="${height - 4}" fill="#000000" />`;
    }
    currentX += barW;
  }

  const textElement = showText
    ? `<text x="${(svgWidth / 2).toFixed(1)}" y="${height + 12}" text-anchor="middle" font-family="monospace" font-size="12" font-weight="700" fill="#000000" letter-spacing="2">${sanitizedText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${rects}
    ${textElement}
  </svg>`;
};

/**
 * Trigger browser file download of scannable barcode as SVG.
 */
export const downloadBarcodeSvg = (value: string, filename?: string) => {
  try {
    const svgString = generateBarcodeSvgString(value, { height: 60, showText: true, moduleWidth: 2.2 });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const finalFilename = filename || `barcode-${value}.svg`;
    link.download = finalFilename.endsWith('.svg') ? finalFilename : `${finalFilename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download barcode SVG:', err);
  }
};

/**
 * Open a high-precision print window for physical library barcode sticker labels.
 */
export const printBarcodeLabel = (options: {
  barcode: string;
  title?: string;
  author?: string;
  accessionNumber?: string;
  classification?: string;
}) => {
  const { barcode, title = 'Physical Book Copy', author = '', accessionNumber = barcode, classification = '' } = options;
  const printWindow = window.open('', '_blank', 'width=620,height=600');
  if (!printWindow) {
    window.print();
    return;
  }

  const barcodeSvg = generateBarcodeSvgString(barcode, { height: 50, showText: true, moduleWidth: 1.9 });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Barcode - ${barcode}</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            display: flex;
            justify-content: center;
          }
          .sticker-container {
            border: 2px dashed #166534;
            border-radius: 12px;
            padding: 18px 24px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }
          .header {
            font-size: 13px;
            font-weight: 800;
            color: #166534;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .sub {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 12px;
          }
          .book-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 2px;
          }
          .book-author {
            font-size: 11.5px;
            color: #475569;
            margin-bottom: 10px;
          }
          .barcode-wrapper {
            margin: 8px 0;
            display: flex;
            justify-content: center;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #475569;
          }
          .tag {
            font-weight: 700;
            font-family: monospace;
            color: #166534;
            background: #f0fdf4;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #bbf7d0;
          }
        </style>
      </head>
      <body>
        <div class="sticker-container">
          <div class="header">Balingasag Public Library</div>
          <div class="sub">Official Accession Inventory Tag • Code 128</div>
          <div class="book-title">${title}</div>
          ${author ? `<div class="book-author">by ${author}</div>` : ''}
          <div class="barcode-wrapper">
            ${barcodeSvg}
          </div>
          <div class="meta-row">
            <div>Call #: <strong>${classification || 'General'}</strong></div>
            <div>Accession: <span class="tag">${accessionNumber}</span></div>
          </div>
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
