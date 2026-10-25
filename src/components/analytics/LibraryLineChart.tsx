import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { AnalyticsSeries } from '../../types/analytics';

interface LibraryLineChartProps {
  data: Record<string, any>[];
  series: AnalyticsSeries[];
  xAxisKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  emptyMessage?: string;
}

// Custom Tooltip styled for Balingasag Public Library Design System
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--chart-tooltip-bg, #FFFFFF)',
          borderRadius: '10px',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.15))',
          border: '1px solid var(--chart-tooltip-border, #E2E8F0)',
          fontSize: '12.5px',
          minWidth: '160px',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: 'var(--deep-green, #166534)',
            marginBottom: '8px',
            borderBottom: '1px solid var(--border-subtle, #F1F5F9)',
            paddingBottom: '4px',
            fontSize: '13px',
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {payload.map((entry: any, index: number) => (
            <div
              key={`tooltip-item-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: entry.color,
                  }}
                />
                <span style={{ color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>{entry.name}:</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                {Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const LibraryLineChart: React.FC<LibraryLineChartProps> = ({
  data,
  series,
  xAxisKey = 'date',
  xAxisLabel,
  yAxisLabel,
  height = 320,
  emptyMessage = 'No historical activity records found for this period.',
}) => {
  // Check if data is completely empty or all series values are 0
  const hasData =
    data.length > 0 &&
    data.some((item) =>
      series.some((s) => Number(item[s.key] || 0) > 0)
    );

  if (!hasData) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px dashed #CBD5E1',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          📈
        </div>
        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', marginBottom: '4px' }}>
          Zero Activity Logged in Period
        </div>
        <div style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '320px' }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Pre-curated BPL harmonic green shades for lines
  const bplLineColors = ['#166534', '#10B981', '#84CC16', '#059669'];

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 16,
            right: 20,
            left: yAxisLabel ? 10 : -10,
            bottom: 24,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.8} />

          <XAxis
            dataKey={xAxisKey}
            stroke="#94A3B8"
            tick={{ fill: '#475569', fontSize: 11.5, fontWeight: 500 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#CBD5E1' }}
            interval="preserveStartEnd"
            angle={data.length > 10 ? -20 : 0}
            textAnchor={data.length > 10 ? 'end' : 'middle'}
            height={data.length > 10 ? 45 : 30}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -14,
                    fill: '#64748B',
                    fontSize: 11,
                    fontWeight: 600,
                  }
                : undefined
            }
          />

          <YAxis
            allowDecimals={false}
            stroke="#94A3B8"
            tick={{ fill: '#475569', fontSize: 11.5, fontWeight: 500 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#CBD5E1' }}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748B',
                    fontSize: 11,
                    fontWeight: 600,
                    offset: yAxisLabel ? 2 : 10,
                  }
                : undefined
            }
          />

          <Tooltip content={<CustomTooltip />} />

          {series.length > 1 && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
            />
          )}

          {series.map((s, idx) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color || bplLineColors[idx % bplLineColors.length]}
              strokeWidth={2.5}
              dot={{
                r: 3.5,
                fill: '#FFFFFF',
                stroke: s.color || bplLineColors[idx % bplLineColors.length],
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: s.color || bplLineColors[idx % bplLineColors.length],
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
