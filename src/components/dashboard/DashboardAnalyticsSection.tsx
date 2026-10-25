import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  AlertCircle,
  Filter
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { LibraryBarChart } from '../analytics/LibraryBarChart';
import { LibraryLineChart } from '../analytics/LibraryLineChart';
import type {
  ComparisonMetric,
  TrendsMetric,
  AnalyticsPeriod,
  ComparisonAnalyticsResponse,
  TrendsAnalyticsResponse
} from '../../types/analytics';

type ActiveViewTab = 'comparison' | 'trends' | 'dual';

interface DashboardAnalyticsSectionProps {
  userRole?: string;
}

export const DashboardAnalyticsSection: React.FC<DashboardAnalyticsSectionProps> = ({
  userRole: _userRole
}) => {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('dual');

  // Filters state
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('books_by_category');
  const [trendsMetric, setTrendsMetric] = useState<TrendsMetric>('circulation');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Data state
  const [comparisonData, setComparisonData] = useState<ComparisonAnalyticsResponse | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsAnalyticsResponse | null>(null);

  // Status state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch data from real backend analytics endpoints
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    const params: {
      period: AnalyticsPeriod;
      start_date?: string;
      end_date?: string;
    } = {
      period: isCustomRangeOpen && customStartDate && customEndDate ? 'custom' : period,
    };

    if (isCustomRangeOpen && customStartDate && customEndDate) {
      params.start_date = customStartDate;
      params.end_date = customEndDate;
    }

    try {
      const [compRes, trendRes] = await Promise.all([
        analyticsService.getComparison({ ...params, metric: comparisonMetric }),
        analyticsService.getTrends({ ...params, metric: trendsMetric }),
      ]);

      setComparisonData(compRes);
      setTrendsData(trendRes);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to retrieve analytics from the library database. Please check your connection and retry.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [comparisonMetric, trendsMetric, period, isCustomRangeOpen, customStartDate, customEndDate]);

  // Initial and reactive fetch on filter change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    if (newPeriod === 'custom') {
      setIsCustomRangeOpen(true);
    } else {
      setIsCustomRangeOpen(false);
      setPeriod(newPeriod);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      fetchAnalytics();
    }
  };

  return (
    <div
      className="card analytics-dashboard-card"
      style={{
        padding: '24px',
        marginBottom: '28px',
        backgroundColor: 'var(--bg-surface, #FFFFFF)',
        borderRadius: '16px',
        border: '1px solid var(--border-main, #E2E8F0)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* 1. Header with Title & View Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: '1px solid var(--border-subtle, #F1F5F9)',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#166534',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Library Operations & Traffic Analytics
              </h2>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                Interactive comparative bar graphs and operational historical trends
              </div>
            </div>
          </div>
        </div>

        {/* View Layout Tabs & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-subtle, #F1F5F9)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-main, #E2E8F0)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('dual')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'dual' ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                color: activeTab === 'dual' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748B)',
                boxShadow: activeTab === 'dual' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={14} />
              <span>Dual Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'comparison' ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                color: activeTab === 'comparison' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748B)',
                boxShadow: activeTab === 'comparison' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={14} />
              <span>Bar Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'trends' ? 'var(--bg-surface, #FFFFFF)' : 'transparent',
                color: activeTab === 'trends' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748B)',
                boxShadow: activeTab === 'trends' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <TrendingUp size={14} />
              <span>Line Graph</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={isLoading || isRefreshing}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-main, #CBD5E1)',
              color: 'var(--text-primary, #334155)',
              cursor: isLoading || isRefreshing ? 'not-allowed' : 'pointer',
            }}
            title="Refresh latest data from database"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin-smooth' : ''}
              style={{ color: '#166534' }}
            />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Control Toolbar (Metric & Period Selectors) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: 'var(--bg-subtle, #F8FAFC)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-main, #E2E8F0)',
          marginBottom: '20px',
        }}
      >
        {/* Metric Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #475569)', fontSize: '13px', fontWeight: 600 }}>
            <Filter size={15} color="#166534" />
            <span>Dataset:</span>
          </div>

          {/* Bar Graph Metric Selector */}
          {(activeTab === 'comparison' || activeTab === 'dual') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="comp-metric-select" style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>
                Bar:
              </label>
              <select
                id="comp-metric-select"
                value={comparisonMetric}
                onChange={(e) => setComparisonMetric(e.target.value as ComparisonMetric)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main, #CBD5E1)',
                  backgroundColor: 'var(--input-bg, #FFFFFF)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #1E293B)',
                  cursor: 'pointer',
                }}
              >
                <option value="books_by_category">Holdings by Category</option>
                <option value="circulation_by_status">Circulation Status (Active, Returned, Overdue)</option>
                <option value="members_by_tier">Registered Members by Tier</option>
                <option value="borrow_vs_return">Borrow vs Return Comparison</option>
              </select>
            </div>
          )}

          {/* Line Graph Metric Selector */}
          {(activeTab === 'trends' || activeTab === 'dual') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="trend-metric-select" style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>
                Line:
              </label>
              <select
                id="trend-metric-select"
                value={trendsMetric}
                onChange={(e) => setTrendsMetric(e.target.value as TrendsMetric)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main, #CBD5E1)',
                  backgroundColor: 'var(--input-bg, #FFFFFF)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #1E293B)',
                  cursor: 'pointer',
                }}
              >
                <option value="circulation">Circulation Activity (Borrow vs Return)</option>
                <option value="members">Patron Registration Growth</option>
                <option value="attendance">Library Foot Traffic & Attendance</option>
              </select>
            </div>
          )}
        </div>

        {/* Quick Filter Period Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['7d', '30d', '6m', '12m', 'all'] as AnalyticsPeriod[]).map((pKey) => {
            const labels: Record<string, string> = {
              '7d': '7 Days',
              '30d': '30 Days',
              '6m': '6 Months',
              '12m': '12 Months',
              all: 'All Time',
            };
            const isSelected = !isCustomRangeOpen && period === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => handlePeriodChange(pKey)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '7px',
                  border: isSelected ? '1px solid var(--brand-forest, #166534)' : '1px solid var(--border-main, #CBD5E1)',
                  backgroundColor: isSelected ? 'var(--brand-forest, #166534)' : 'var(--bg-surface, #FFFFFF)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                {labels[pKey]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCustomRangeOpen(!isCustomRangeOpen)}
            style={{
              padding: '5px 11px',
              borderRadius: '7px',
              border: isCustomRangeOpen ? '1px solid var(--brand-forest, #166534)' : '1px solid var(--border-main, #CBD5E1)',
              backgroundColor: isCustomRangeOpen ? 'var(--light-green, #DCFCE7)' : 'var(--bg-surface, #FFFFFF)',
              color: isCustomRangeOpen ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #475569)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Calendar size={13} />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* 3. Custom Date Range Inputs Panel (Conditional) */}
      {isCustomRangeOpen && (
        <form
          onSubmit={handleApplyCustomRange}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle, #F0FDF4)',
            border: '1px solid var(--border-main, #BBF7D0)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="custom-start-date" style={{ fontWeight: 600, color: 'var(--brand-forest, #166534)' }}>
              Start Date:
            </label>
            <input
              id="custom-start-date"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              required
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-main, #86EFAC)',
                backgroundColor: 'var(--input-bg, #FFFFFF)',
                color: 'var(--text-primary, #0F172A)',
                fontSize: '12.5px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="custom-end-date" style={{ fontWeight: 600, color: 'var(--brand-forest, #166534)' }}>
              End Date:
            </label>
            <input
              id="custom-end-date"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              required
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-main, #86EFAC)',
                backgroundColor: 'var(--input-bg, #FFFFFF)',
                color: 'var(--text-primary, #0F172A)',
                fontSize: '12.5px',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              backgroundColor: '#166534',
              borderColor: '#166534',
              color: '#FFFFFF',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Apply Filter
          </button>
        </form>
      )}

      {/* 4. Error Message Banner with Retry */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(false)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #DC2626',
              backgroundColor: '#FFFFFF',
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Loading Skeleton */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeTab === 'dual' ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr',
            gap: '20px',
            minHeight: '340px',
          }}
        >
          <div
            style={{
              height: '340px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#94A3B8',
            }}
          >
            <RefreshCw size={24} className="animate-spin-smooth" style={{ color: '#166534' }} />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              Querying database records and calculating metrics...
            </span>
          </div>
          {activeTab === 'dual' && (
            <div
              style={{
                height: '340px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#94A3B8',
              }}
            >
              <RefreshCw size={24} className="animate-spin-smooth" style={{ color: '#166534' }} />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                Loading historical trend series...
              </span>
            </div>
          )}
        </div>
      ) : (
        /* 6. Active Charts Content */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeTab === 'dual' ? 'repeat(auto-fit, minmax(420px, 1fr))' : '1fr',
            gap: '24px',
          }}
        >
          {/* BAR GRAPH PANEL */}
          {(activeTab === 'comparison' || activeTab === 'dual') && comparisonData && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                borderRadius: '12px',
                border: '1px solid var(--border-main, #E2E8F0)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={17} color="#166534" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#166534', margin: 0 }}>
                      {comparisonData.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    Bar Graph
                  </span>
                </div>
                {comparisonData.subtitle && (
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                    {comparisonData.subtitle}
                  </p>
                )}
              </div>

              {/* The Reusable Bar Chart Component */}
              <LibraryBarChart
                data={comparisonData.data}
                series={comparisonData.series}
                xAxisLabel={comparisonData.xAxisLabel}
                yAxisLabel={comparisonData.yAxisLabel}
                height={300}
                emptyMessage="No comparative records found matching the selected filters."
              />

              {/* Data Summary Footer */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-main, #F1F5F9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #64748B)',
                }}
              >
                <span>{comparisonData.summary}</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>
                  Total: {comparisonData.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* LINE GRAPH PANEL */}
          {(activeTab === 'trends' || activeTab === 'dual') && trendsData && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                borderRadius: '12px',
                border: '1px solid var(--border-main, #E2E8F0)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={17} color="#166534" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#166534', margin: 0 }}>
                      {trendsData.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    Line Graph
                  </span>
                </div>
                {trendsData.subtitle && (
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                    {trendsData.subtitle}
                  </p>
                )}
              </div>

              {/* The Reusable Line Chart Component */}
              <LibraryLineChart
                data={trendsData.data}
                series={trendsData.series}
                xAxisLabel={trendsData.xAxisLabel}
                yAxisLabel={trendsData.yAxisLabel}
                height={300}
                emptyMessage="No historical trend records found matching this timeframe."
              />

              {/* Data Summary Footer */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-main, #F1F5F9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #64748B)',
                }}
              >
                <span>{trendsData.summary}</span>
                <span style={{ fontWeight: 600, color: '#166534' }}>
                  Series Total: {trendsData.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
