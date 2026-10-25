import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { AnalyticsSeries } from '../../types/analytics';

interface LibraryBarChartProps {
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
                    backgroundColor: entry.color || entry.fill,
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

// Truncate long category names cleanly for ticks
const formatXAxisTick = (value: string) => {
  if (!value) return '';
  if (value.length > 15) {
    return `${value.slice(0, 13)}...`;
  }
  return value;
};

export const LibraryBarChart: React.FC<LibraryBarChartProps> = ({
  data,
  series,
  xAxisKey = 'name',
  xAxisLabel,
  yAxisLabel,
  height = 320,
  emptyMessage = 'No comparative records available for this period.',
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
          📊
        </div>
        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', marginBottom: '4px' }}>
          No Activity Records Found
        </div>
        <div style={{ fontSize: '12.5px', color: '#64748B', maxWidth: '320px' }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Pre-curated BPL harmonic green shades for multi-item or individual bars
  const bplBarColors = [
    '#166534', // forest green
    '#22C55E', // medium vibrant green
    '#15803D', // emerald
    '#10B981', // teal green
    '#84CC16', // lime green
    '#059669', // rich emerald
  ];

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 16,
            right: 20,
            left: yAxisLabel ? 10 : -10,
            bottom: 24,
          }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.8} />

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxisTick}
            stroke="#94A3B8"
            tick={{ fill: '#475569', fontSize: 11.5, fontWeight: 500 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#CBD5E1' }}
            interval={0}
            angle={data.length > 5 ? -20 : 0}
            textAnchor={data.length > 5 ? 'end' : 'middle'}
            height={data.length > 5 ? 45 : 30}
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

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22, 101, 52, 0.05)' }} />

          {series.length > 1 && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
            />
          )}

          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color || bplBarColors[idx % bplBarColors.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {/* If single series, give each bar a refined harmonious shade for visual distinction */}
              {series.length === 1 &&
                data.map((_, entryIdx) => (
                  <Cell
                    key={`cell-${entryIdx}`}
                    fill={bplBarColors[entryIdx % bplBarColors.length]}
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
