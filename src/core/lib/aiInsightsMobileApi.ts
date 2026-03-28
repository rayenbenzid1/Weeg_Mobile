/**
 * src/core/lib/aiInsightsMobileApi.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Mobile API client for all AI Insights endpoints.
 * Mirrors aiInsightsApi.ts (web) but uses AsyncStorage for JWT auth.
 *
 * Available to MANAGER role only — caller screens must guard access.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

const API_URL = `${BASE_URL}/api`;

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('weeg_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export type Severity    = 'low' | 'medium' | 'high' | 'critical';
export type Confidence  = 'low' | 'medium' | 'high';
export type TrafficLight = 'green' | 'amber' | 'red';
export type Urgency     = 'critical' | 'high' | 'medium' | 'low';
export type Topic       = 'credit' | 'stock' | 'churn' | 'forecast' | 'revenue' | 'general';

// ─── Critical Detector ────────────────────────────────────────────────────────

export interface CriticalSituation {
  source: string;
  title: string;
  severity: Severity;
  composite_score: number;
  summary: string;
  financial_exposure_lyd: number;
  recommended_action: string;
  urgency_hours: number;
  customer_name?: string;
  account_name?: string;
  product_name?: string;
  direction?: string;
}

export interface CausalCluster {
  cluster_name: string;
  situations: string[];
  common_cause: string;
  unified_action: string;
  combined_exposure_lyd?: number;
}

export interface GroupedAction {
  situation: string;
  action: string;
  owner: string;
}

export interface CriticalResult {
  generated_at: string;
  critical_count: number;
  total_situations: number;
  total_exposure_lyd: number;
  risk_level: Severity;
  executive_briefing: string;
  situations: CriticalSituation[];
  causal_clusters: CausalCluster[];
  grouped_actions: {
    act_within_24h: GroupedAction[];
    act_this_week: GroupedAction[];
    monitor: GroupedAction[];
  };
  confidence: Confidence;
  cached: boolean;
}

// ─── KPI Analyzer ─────────────────────────────────────────────────────────────

export interface KPIValue {
  current: number;
  baseline: number;
  delta_pct: number;
  status: TrafficLight;
  label?: string;
  source?: string;
}

export interface KPIResult {
  health_score: number;
  health_label: string;
  kpis: Record<string, KPIValue>;
  executive_summary: string;
  top_insight: string;
  kpi_commentary: Record<string, string>;
  recommended_actions: { priority: number; action: string; owner: string; impact: string }[];
  risk_flags: string[];
  summary: { total_kpis: number; green: number; amber: number; red: number };
  confidence: Confidence;
  cached: boolean;
}

// ─── Anomaly Detector ─────────────────────────────────────────────────────────

export interface Anomaly {
  stream: string;
  product_name?: string;
  date: string;
  observed_value: number;
  expected_value: number;
  z_score: number;
  deviation_pct: number;
  direction: 'spike' | 'drop';
  severity: Severity;
  ai_explanation: string;
  likely_causes: string[];
  business_impact: string;
  recommended_actions: string[];
  confidence: Confidence;
}

export interface AnomalyResult {
  summary: { total: number; critical: number; high: number; medium: number; low: number };
  anomalies: Anomaly[];
  cached: boolean;
}

// ─── Seasonal Analyzer ────────────────────────────────────────────────────────

export interface SeasonalityIndex {
  month_num: number;
  month_name: string;
  seasonality_index: number | null;
  avg_monthly_revenue_lyd: number;
  label: 'peak' | 'trough' | 'normal' | 'no_data';
}

export interface SeasonalResult {
  error?: string;
  current_season: string;
  upcoming_peak_alert: boolean;
  trend: { direction: string; slope_pct_per_month: number; r_squared: number };
  seasonality_indices: Record<string, SeasonalityIndex>;
  peak_month_names: string[];
  trough_month_names: string[];
  seasonal_narrative: string;
  stock_preparation_calendar: { month: string; action: string; lead_time_weeks: number; rationale: string }[];
  staffing_implications: string;
  ai_recommendations: string[];
  confidence: Confidence;
  cached: boolean;
}

// ─── Churn Predictor ──────────────────────────────────────────────────────────

export interface ChurnPrediction {
  customer_id: string | null;
  account_code: string;
  customer_name: string;
  churn_score: number;
  churn_label: Severity;
  days_since_last_purchase: number;
  purchase_count_12m: number;
  avg_monthly_revenue_lyd: number;
  avg_order_value_lyd: number;
  revenue_trend: number;
  aging_risk_score: string;
  overdue_ratio: number;
  total_receivable_lyd: number;
  ai_explanation: string;
  recommended_actions: string[];
  key_risk_factors: string[];
  confidence: Confidence;
}

export interface ChurnResult {
  summary: { total: number; critical: number; high: number; medium: number; low: number; avg_churn_score: number };
  predictions: ChurnPrediction[];
  cached: boolean;
}

// ─── Stock Optimizer ──────────────────────────────────────────────────────────

export interface StockItem {
  product_code: string;
  product_name: string;
  branch_name: string;
  abc_class: 'A' | 'B' | 'C';
  total_revenue_lyd: number;
  revenue_pct: number;
  current_stock: number;
  avg_daily_demand: number;
  revenue_per_unit_lyd: number;
  reorder_point: number;
  safety_stock: number;
  eoq: number;
  estimated_days_to_stockout: number | null;
  urgency: 'immediate' | 'soon' | 'watch' | 'ok';
  ai_recommendation: string;
  order_suggestion: { quantity: number; timing: string; rationale: string };
  revenue_at_risk_lyd: number;
  confidence: Confidence;
  stock_source: 'real' | 'estimate';
}

export interface StockResult {
  summary: {
    total_items: number;
    class_a_count: number;
    class_b_count: number;
    class_c_count: number;
    immediate_reorders: number;
    soon_reorders: number;
  };
  items: StockItem[];
  service_level: string;
  cached: boolean;
}

// ─── Predictor ────────────────────────────────────────────────────────────────

export interface ForecastMonth {
  month: number;
  year: number;
  period: string;
  base_lyd: number;
  optimistic_lyd: number;
  pessimistic_lyd: number;
  p10_lyd: number;
  p50_lyd: number;
  p90_lyd: number;
  upside_pct: number;
  downside_pct: number;
  seasonality_index: number;
}

export interface PredictorResult {
  error?: string;
  trend_model: {
    direction: string;
    slope_pct: number;
    mape: number;
    r_squared: number;
  };
  revenue_forecast: ForecastMonth[];
  forecast_total_base_lyd: number;
  forecast_total_optimistic_lyd: number;
  forecast_total_pessimistic_lyd: number;
  forecast_narrative: string;
  primary_risk: string;
  cash_flow_forecast: {
    current_receivable_lyd: number;
    collection_rate_pct: number;
  };
  confidence: Confidence;
  cached: boolean;
}

// ─── Chat types ───────────────────────────────────────────────────────────────

export interface DecisionOption { label: string; pros: string; cons: string }
export interface DecisionCard {
  question: string;
  recommendation: string;
  rationale: string;
  options: DecisionOption[];
  owner: string;
  deadline: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  loading?: boolean;
  error?: boolean;
  decision_needed?: boolean;
  decision_card?: DecisionCard | null;
  suggested_followups?: string[];
  urgency?: Urgency;
  topic?: Topic;
  fallback?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const aiInsightsMobileApi = {
  critical: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<CriticalResult>('/ai-insights/critical/', params),

  kpis: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<KPIResult>('/ai-insights/kpis/', params),

  anomalies: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<AnomalyResult>('/ai-insights/anomalies/', params),

  seasonal: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<SeasonalResult>('/ai-insights/seasonal/', params),

  churn: (params?: { top_n?: number; use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<ChurnResult>('/ai-insights/churn/', params),

  stock: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<StockResult>('/ai-insights/stock/', params),

  predict: (params?: { use_ai?: boolean; refresh?: boolean }) =>
    apiFetch<PredictorResult>('/ai-insights/predict/', params),

  conversations: () =>
    apiFetch<{ count: number; conversations: ConversationSummary[] }>('/ai-insights/conversations/'),

  conversationMessages: (id: string) =>
    apiFetch<{ count: number; messages: any[] }>(`/ai-insights/conversations/${id}/messages/`),

  chat: (body: {
    messages: { role: string; content: string }[];
    conversation_id?: string;
  }) => apiPost<{
    conversation_id: string;
    answer: string;
    decision_needed: boolean;
    decision_card: DecisionCard | null;
    suggested_followups: string[];
    urgency: Urgency;
    topic: Topic;
    fallback: boolean;
  }>('/ai-insights/chat/', body),
};