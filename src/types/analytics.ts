export type ComparisonMetric =
  | 'books_by_category'
  | 'circulation_by_status'
  | 'members_by_tier'
  | 'borrow_vs_return';

export type TrendsMetric =
  | 'circulation'
  | 'members'
  | 'attendance';

export type AnalyticsPeriod =
  | '7d'
  | '30d'
  | '6m'
  | '12m'
  | 'all'
  | 'custom';

export interface AnalyticsSeries {
  key: string;
  label: string;
  color: string;
}

export interface ComparisonAnalyticsResponse {
  metric: ComparisonMetric;
  period: AnalyticsPeriod;
  title: string;
  subtitle?: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: Record<string, any>[];
  series: AnalyticsSeries[];
  total: number;
  summary: string;
}

export interface TrendsAnalyticsResponse {
  metric: TrendsMetric;
  period: AnalyticsPeriod;
  title: string;
  subtitle?: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: Record<string, any>[];
  series: AnalyticsSeries[];
  total: number;
  summary: string;
}

export interface AnalyticsQueryParams {
  metric?: string;
  period?: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}
