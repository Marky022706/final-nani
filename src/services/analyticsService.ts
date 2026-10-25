import { api } from './api';
import type {
  ComparisonAnalyticsResponse,
  TrendsAnalyticsResponse,
  AnalyticsQueryParams
} from '../types/analytics';

export const analyticsService = {
  /**
   * Fetch bar graph comparison analytics across categories, statuses, or tiers.
   */
  async getComparison(params: AnalyticsQueryParams = {}): Promise<ComparisonAnalyticsResponse> {
    return api.getAnalyticsComparison(params);
  },

  /**
   * Fetch line graph trend analytics over time using actual database timestamps.
   */
  async getTrends(params: AnalyticsQueryParams = {}): Promise<TrendsAnalyticsResponse> {
    return api.getAnalyticsTrends(params);
  }
};
