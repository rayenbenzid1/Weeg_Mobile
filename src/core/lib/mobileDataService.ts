/**
 * mobileDataService.ts — WEEG Mobile v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Strictly mirrors the backend API.
 * ALL filtering is done server-side: the mobile app sends the exact same
 * query parameters as the web app (dataApi.ts / dataHooks.ts).
 * No client-side filtering logic is permitted here.
 *
 * Backend source references (documents provided):
 *   - dataApi.ts      → parameter names + response shapes
 *   - dataHooks.ts    → normalizeMovementType helper
 *   - TransactionsPage.tsx, AgingPage.tsx, InventoryPage.tsx → exact params used
 *   - views.py (aging, inventory, transactions, kpi) → server-side filtering
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('weeg_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const headers = await getAuthHeader();
  const url = new URL(`${BASE_URL}/api${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      // Mirror qs() helper from dataApi.ts: skip undefined, null, empty string
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Movement type normaliser (mirrors dataHooks.ts normalizeMovementType)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips whitespace from movement_type before sending to the API.
 * Some Excel files stored values with trailing spaces (e.g. 'ف بيع ').
 * Mirrors the normalizeMovementType() helper in dataHooks.ts.
 */
function normalizeMovementType(t?: string): string | undefined {
  return t?.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Arabic movement type constants
// Mirrors MOVEMENT_TYPES in dataApi.ts — never use English equivalents
// ─────────────────────────────────────────────────────────────────────────────

export const MOVEMENT_TYPES = {
  SALE:             'ف بيع',
  SALE_RETURN:      'مردودات بيع',
  PURCHASE:         'ف شراء',
  PURCHASE_RETURN:  'مردودات شراء',
  MAIN_ENTRY:       'ادخال رئيسي',
} as const;

export type MovementTypeValue = typeof MOVEMENT_TYPES[keyof typeof MOVEMENT_TYPES];

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirrors dataApi.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: any;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface Movement {
  id: string;
  material_code: string;
  material_name: string;
  movement_date: string;
  /** Raw Arabic label as stored in DB, e.g. "ف بيع" */
  movement_type: string;
  movement_type_display?: string;
  qty_in: number | null;
  qty_out: number | null;
  total_in: number | null;
  total_out: number | null;
  balance_price: number | null;
  branch_name_resolved: string | null;
  customer_name: string | null;
}

export interface MovementsListResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  totals: { total_in_value: number; total_out_value: number };
  movements: Movement[];
}

export interface MonthlySummaryItem {
  year: number;
  month: number;
  month_label: string;
  total_sales: number;
  total_purchases: number;
  total_profit?: number;
  total_qty?: number;
  sales_count: number;
  purchases_count: number;
}

export interface BranchBreakdownItem {
  branch: string;
  count: number;
  total: number;
  total_profit?: number;
}

export interface BranchMonthlyResponse {
  movement_type: string;
  metric: string;
  branches: string[];
  monthly_data: Array<{ month: string; year: number; [branch: string]: string | number }>;
}

export interface TypeBreakdownItem {
  movement_type: string;
  label?: string;
  count: number;
  total_in: number;
  total_out: number;
}

// ── Aging ─────────────────────────────────────────────────────────────────────

export interface AgingRow {
  id: string;
  snapshot_id: string;
  account_code: string;
  account: string;
  customer_name: string | null;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d91_120: number;
  d121_150: number;
  d151_180: number;
  d181_210: number;
  d211_240: number;
  d241_270: number;
  d271_300: number;
  d301_330: number;
  over_330: number;
  total: number;
  overdue_total: number;
  risk_score: 'low' | 'medium' | 'high' | 'critical';
  branch?: string | null;
}

export interface AgingListResponse {
  snapshot_id: string | null;
  report_date: string | null;
  count: number;
  grand_total: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: AgingRow[];
}

export interface AgingRiskItem {
  id: string;
  account: string;
  account_code: string;
  customer_name: string | null;
  branch: string | null;
  total: number;
  overdue_total: number;
  risk_score: string;
}

export interface AgingDistributionItem {
  bucket: string;
  label: string;
  total: number;
  percentage: number;
  midpoint_days: number;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface InventorySnapshot {
  id: string;
  company_name: string;
  label: string;
  snapshot_date: string | null;
  fiscal_year: string;
  source_file: string;
  uploaded_at: string;
  line_count: number;
  total_lines_value: number | string | null;
}

export interface InventorySnapshotListResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: InventorySnapshot[];
}

export interface InventoryLine {
  id: string;
  product_category: string;
  product_code: string;
  product_name: string;
  branch_name: string;
  quantity: number | string;
  unit_cost: number | string;
  line_value: number | string;
}

export interface InventoryLinesResponse {
  snapshot_id: string;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  totals: {
    grand_total_qty: number;
    grand_total_value: number;
    distinct_products: number;
    out_of_stock_count: number;
    critical_count: number;
    low_count: number;
  };
  lines: InventoryLine[];
}

export interface BranchSummary {
  branch: string;
  total_qty: number;
  total_value: number;
}

export interface CategoryBreakdown {
  category: string;
  total_qty: number;
  total_value: number;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalSales: number;
  totalSalesPrev: number;
  salesEvolution: number | null;
  stockValue: number;
  totalReceivables: number;
  overdueAmount: number;
  overdueRate: number;
  collectionRate: number;
  dso: number;
  creditCustomers: number;
  totalCustomers: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Service
// ─────────────────────────────────────────────────────────────────────────────

export const DashboardService = {
  /**
   * Aggregates KPIs from sales (/api/kpi/sales/), credit (/api/kpi/credit/),
   * and inventory (/api/inventory/branch-summary/).
   * Mirrors kpiApi.getAll() in dataApi.ts.
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const [salesRes, creditRes, stockRes] = await Promise.allSettled([
      apiFetch<any>('/kpi/sales/'),
      apiFetch<any>('/kpi/credit/'),
      apiFetch<any>('/inventory/branch-summary/'),
    ]);

    const sales  = salesRes.status  === 'fulfilled' ? salesRes.value  : null;
    const credit = creditRes.status === 'fulfilled' ? creditRes.value : null;
    const stock  = stockRes.status  === 'fulfilled' ? stockRes.value  : null;

    const stockValue = (stock?.branches ?? []).reduce(
      (sum: number, b: BranchSummary) => sum + (Number(b.total_value) || 0), 0,
    );

    return {
      totalSales:      Number(sales?.ca?.total)      || 0,
      totalSalesPrev:  Number(sales?.ca?.previous)   || 0,
      salesEvolution:  sales?.sales_evolution?.value != null ? Number(sales.sales_evolution.value) : null,
      stockValue,
      totalReceivables: Number(credit?.summary?.grand_total_receivables) || 0,
      overdueAmount:    Number(credit?.summary?.overdue_amount)           || 0,
      overdueRate:      Number(credit?.kpis?.taux_impayes?.value)        || 0,
      collectionRate:   Number(credit?.kpis?.taux_recouvrement?.value)   || 0,
      dso:              Number(credit?.kpis?.dmp?.value)                 || 0,
      creditCustomers:  Number(credit?.summary?.credit_customers)        || 0,
      totalCustomers:   Number(credit?.summary?.total_customers)         || 0,
    };
  },

  /**
   * GET /api/transactions/summary/
   * Mirrors transactionsApi.summary() in dataApi.ts.
   * Params: year?, date_from?, date_to?, branch?
   */
  async getMonthlySummary(params?: {
    year?: number;
    date_from?: string;
    date_to?: string;
    branch?: string;
  }): Promise<{ summary: MonthlySummaryItem[] }> {
    return apiFetch('/transactions/summary/', params as any);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Aging Service
// ─────────────────────────────────────────────────────────────────────────────

export const AgingService = {
  /**
   * GET /api/aging/
   * Mirrors agingApi.list() in dataApi.ts.
   *
   * Backend filtering (views.py AgingListView):
   *   - search: icontains on account + account_code
   *   - risk:   client-side in Python after fetching (risk_score property)
   *             → send 'risk' param, backend filters by risk_score
   *   - ordering: field name, prefix '-' for DESC
   *   - snapshot_id: optional — defaults to latest
   */
  async getList(params?: QueryParams & {
    search?: string;
    risk?: string;
    ordering?: string;
    snapshot_id?: string;
  }): Promise<AgingListResponse> {
    return apiFetch('/aging/', params as any);
  },

  /**
   * GET /api/aging/risk/
   * Mirrors agingApi.risk() in dataApi.ts.
   * Returns top N customers by risk score.
   * Backend: excludes 'low' by default, orders by total DESC.
   *   - limit: max results (default 20, max 100)
   *   - risk: filter by exact risk_score
   *   - snapshot_id: optional
   */
  async getTopRisk(params?: {
    limit?: number;
    risk?: string;
    snapshot_id?: string;
  }): Promise<{ snapshot_id: string | null; count: number; top_risk: AgingRiskItem[] }> {
    return apiFetch('/aging/risk/', params as any);
  },

  /**
   * GET /api/aging/distribution/
   * Mirrors agingApi.distribution() in dataApi.ts.
   * Aggregates all bucket totals for the latest (or specified) snapshot.
   *   - snapshot_id: optional
   */
  async getDistribution(params?: {
    snapshot_id?: string;
  }): Promise<{ grand_total: number; distribution: AgingDistributionItem[] }> {
    return apiFetch('/aging/distribution/', params as any);
  },

  /**
   * GET /api/aging/dates/
   * Returns available report date strings.
   */
  async getDates(): Promise<{ dates: string[] }> {
    return apiFetch('/aging/dates/');
  },

  /**
   * GET /api/aging/snapshots/
   * Lists all aging import sessions.
   */
  async getSnapshots(): Promise<{ count: number; items: any[] }> {
    return apiFetch('/aging/snapshots/');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Service
// ─────────────────────────────────────────────────────────────────────────────

export const InventoryMobileService = {
  /**
   * GET /api/inventory/
   * Mirrors inventoryApi.listSnapshots() in dataApi.ts.
   * Returns paginated list of snapshot sessions.
   */
  async listSnapshots(params?: QueryParams & { search?: string }): Promise<InventorySnapshotListResponse> {
    return apiFetch('/inventory/', params as any);
  },

  /**
   * GET /api/inventory/branch-summary/
   * Mirrors inventoryApi.branchSummary() in dataApi.ts.
   * Backend (InventoryBranchSummaryView):
   *   - snapshot_id: optional — filters to one snapshot
   *   - branch: optional — filters to one branch (icontains)
   *
   * ⚠️  'branch' parameter filters at DB level — do NOT filter client-side.
   */
  async getBranchSummary(params?: {
    snapshot_id?: string;
    branch?: string;
  }): Promise<{ branches: BranchSummary[] }> {
    return apiFetch('/inventory/branch-summary/', params as any);
  },

  /**
   * GET /api/inventory/category-breakdown/
   * Mirrors inventoryApi.categoryBreakdown() in dataApi.ts.
   * Backend (InventoryCategoryBreakdownView):
   *   - snapshot_id: optional
   *   - branch: optional — filters to one branch (icontains)
   */
  async getCategoryBreakdown(params?: {
    snapshot_id?: string;
    branch?: string;
  }): Promise<{ categories: CategoryBreakdown[] }> {
    return apiFetch('/inventory/category-breakdown/', params as any);
  },

  /**
   * GET /api/inventory/<snapshot_id>/lines/
   * Mirrors inventoryApi.getLines() in dataApi.ts.
   * Backend (InventorySnapshotLinesView):
   *   - branch: icontains on branch_name — SERVER-SIDE, NOT client
   *   - search: icontains on product_name + product_code — SERVER-SIDE
   *   - page, page_size: pagination
   *
   * ⚠️  Do NOT filter lines client-side. All filtering is done by the backend.
   *     KPI totals (grand_total_qty, distinct_products, etc.) reflect the
   *     FULL filtered queryset, not just the current page.
   */
  async getLines(
    snapshotId: string,
    params?: QueryParams & { branch?: string; search?: string },
  ): Promise<InventoryLinesResponse> {
    return apiFetch(`/inventory/${snapshotId}/lines/`, params as any);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Service
// ─────────────────────────────────────────────────────────────────────────────

export const TransactionMobileService = {
  /**
   * GET /api/transactions/
   * Mirrors transactionsApi.list() in dataApi.ts.
   * Backend (TransactionListView):
   *   - movement_type: exact match on raw Arabic value (trimmed via migration 0003)
   *   - branch: icontains on branch__name (FK)
   *   - search: icontains on material_code | material_name | customer_name | lab_code
   *   - date_from, date_to: movement_date__gte / lte
   *   - ordering: field name
   *   - page, page_size
   *
   * ⚠️  movement_type MUST be the raw Arabic value, e.g. MOVEMENT_TYPES.SALE.
   *     It is trimmed via normalizeMovementType() before being sent.
   *     totals in the response reflect ALL matching rows (not just current page).
   */
  async getList(params?: QueryParams & {
    movement_type?: string;
    branch?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<MovementsListResponse> {
    return apiFetch('/transactions/', {
      ...params,
      // FIX: always trim movement_type — mirrors normalizeMovementType in dataHooks.ts
      movement_type: normalizeMovementType(params?.movement_type),
    } as any);
  },

  /**
   * GET /api/transactions/movement-types/
   * Returns all distinct movement_type values for this company.
   * Use to dynamically populate filter dropdowns — do NOT hardcode Arabic values.
   */
  async getMovementTypes(): Promise<{ movement_types: string[] }> {
    return apiFetch('/transactions/movement-types/');
  },

  /**
   * GET /api/transactions/branches/
   * Returns all distinct branch names for this company.
   */
  async getBranches(): Promise<{ branches: string[] }> {
    return apiFetch('/transactions/branches/');
  },

  /**
   * GET /api/transactions/summary/
   * Mirrors transactionsApi.summary() in dataApi.ts.
   * Backend (TransactionSummaryView):
   *   - year, date_from, date_to: period filter
   *   - branch: optional branch filter
   */
  async getSummary(params?: {
    year?: number;
    date_from?: string;
    date_to?: string;
    branch?: string;
  }): Promise<{ summary: MonthlySummaryItem[] }> {
    return apiFetch('/transactions/summary/', params as any);
  },

  /**
   * GET /api/transactions/type-breakdown/
   * Mirrors transactionsApi.typeBreakdown() in dataApi.ts.
   * Backend (TransactionTypeBreakdownView):
   *   - date_from, date_to
   *   - branch: optional
   */
  async getTypeBreakdown(params?: {
    date_from?: string;
    date_to?: string;
    branch?: string;
  }): Promise<{ breakdown: TypeBreakdownItem[] }> {
    return apiFetch('/transactions/type-breakdown/', params as any);
  },

  /**
   * GET /api/transactions/branch-breakdown/
   * Mirrors transactionsApi.branchBreakdown() in dataApi.ts.
   * Backend (TransactionBranchBreakdownView):
   *   - movement_type: raw Arabic value (trimmed), default "ف بيع"
   *   - date_from, date_to
   *
   * ⚠️  movement_type is trimmed before sending.
   */
  async getBranchBreakdown(params?: {
    movement_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ movement_type: string; branches: BranchBreakdownItem[] }> {
    return apiFetch('/transactions/branch-breakdown/', {
      ...params,
      movement_type: normalizeMovementType(params?.movement_type),
    } as any);
  },

  /**
   * GET /api/transactions/branch-monthly/
   * Mirrors transactionsApi.branchMonthly() in dataApi.ts.
   * Backend (TransactionBranchMonthlyView):
   *   - movement_type: raw Arabic value (trimmed), default "ف بيع"
   *   - metric: 'revenue' | 'profit'
   *   - year, date_from, date_to
   *
   * ⚠️  movement_type is trimmed before sending.
   * ⚠️  Returns all branches with 0-fill for months with no data (backend fix).
   */
  async getBranchMonthly(params?: {
    movement_type?: string;
    metric?: string;
    year?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<BranchMonthlyResponse> {
    // Mirror the URL construction from dataApi.ts branchMonthly()
    const p: Record<string, any> = {};
    if (params?.movement_type) p.movement_type = normalizeMovementType(params.movement_type);
    if (params?.metric)        p.metric        = params.metric;
    if (params?.year)          p.year          = params.year;
    if (params?.date_from)     p.date_from     = params.date_from;
    if (params?.date_to)       p.date_to       = params.date_to;
    return apiFetch('/transactions/branch-monthly/', p);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Period helper — mirrors periodToDates() in TransactionsPage.tsx / AgingPage.tsx
// ─────────────────────────────────────────────────────────────────────────────

export function periodToDates(period: string): { date_from?: string; date_to?: string } {
  if (period === 'all') return {};
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dateTo = fmt(today);

  if (period === '1m' || period === '30') {
    const f = new Date(today); f.setMonth(f.getMonth() - 1);
    return { date_from: fmt(f), date_to: dateTo };
  }
  if (period === '3m' || period === '90') {
    const f = new Date(today); f.setMonth(f.getMonth() - 3);
    return { date_from: fmt(f), date_to: dateTo };
  }
  if (period === '6m' || period === '180') {
    const f = new Date(today); f.setMonth(f.getMonth() - 6);
    return { date_from: fmt(f), date_to: dateTo };
  }
  if (period === '12m' || period === '365') {
    const f = new Date(today); f.setFullYear(f.getFullYear() - 1);
    return { date_from: fmt(f), date_to: dateTo };
  }
  if (period === 'ytd' || period === 'this_year') {
    return { date_from: `${today.getFullYear()}-01-01`, date_to: dateTo };
  }
  // Numeric string = days
  const days = parseInt(period);
  if (!isNaN(days)) {
    const f = new Date(today); f.setDate(f.getDate() - days);
    return { date_from: fmt(f), date_to: dateTo };
  }
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export unified service
// ─────────────────────────────────────────────────────────────────────────────

export const MobileDataService = {
  Dashboard:    DashboardService,
  Aging:        AgingService,
  Inventory:    InventoryMobileService,
  Transactions: TransactionMobileService,
};

export default MobileDataService;