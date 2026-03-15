/**
 * DashboardScreen.tsx — WEEG Mobile v2
 * ─────────────────────────────────────────────────────────────────────────────
 * The old inline gradient header (WEEG logo + greeting + icons) has been
 * REMOVED.  The shared <AppHeader /> injected by MainNavigator/withHeader()
 * now handles branding, greeting, notification bell, and profile avatar.
 *
 * Filters on risky customers:
 *   risk   → GET /api/aging/risk/?risk=X          (server-side)
 *   branch → client-side filter on returned results
 *            (branch resolved by backend via _resolve_branch())
 *
 * KPIs come from:
 *   GET /api/kpi/sales/   → totalSales, salesEvolution
 *   GET /api/kpi/credit/  → receivables, overdueRate, collectionRate, dso
 *   GET /api/inventory/branch-summary/ → stockValue
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, BorderRadius, getRiskColor } from '../../constants/theme';
import {
  RiskPill, BranchTag, SectionHeader, SummaryStrip,
  MiniKpi, FilterChip, EmptyState, Avatar,
} from '../../components/SharedComponents';
import { FilterSheet, ActiveFilterChips } from '../../components/FilterSheet';
import {
  DashboardService,
  AgingService,
  TransactionMobileService,
  type DashboardKPIs,
  type AgingRiskItem,
  type MonthlySummaryItem,
} from '../../lib/mobileDataService';

const { width } = Dimensions.get('window');
const CARD_W = (width - 32 - 10) / 2;

const fmt = (n?: number | null): string => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
};
const fmtCurrency = (n?: number | null) => n == null ? '—' : `${fmt(n)} DL`;
const safe = (n?: number | null, fb = 0) => n == null || isNaN(Number(n)) ? fb : Number(n);

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ color, pts }: { color: string; pts: number[] }) {
  const H = 28; const W = CARD_W - 40;
  const max = Math.max(...pts); const min = Math.min(...pts);
  const px = (i: number) => (i / (pts.length - 1)) * W;
  const py = (v: number) => H - ((v - min) / (max - min + 1)) * H;
  return (
    <View style={{ height: H, overflow:'hidden', marginTop:8 }}>
      {pts.map((v, i) => {
        if (i === 0) return null;
        const x1 = px(i-1), y1 = py(pts[i-1]), x2 = px(i), y2 = py(v);
        const len   = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
        return (
          <View key={i} style={{
            position:'absolute', left:x1, top:y1,
            width:len, height:2, backgroundColor:color,
            transform:[{ rotate:`${angle}deg` }],
            // @ts-ignore
            transformOrigin:'0 50%',
          }} />
        );
      })}
    </View>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, trend, isPositive, icon, accentColor, sparkPts, loading }: {
  title: string; value: string; trend?: number|null; isPositive?: boolean;
  icon: string; accentColor: string; sparkPts: number[]; loading?: boolean;
}) {
  return (
    <View style={[S.kpiCard, Shadow.sm]}>
      <View style={[S.kpiAccent, { backgroundColor:accentColor }]} />
      <View style={[S.kpiIcon, { backgroundColor:accentColor+'18' }]}>
        <Ionicons name={icon as any} size={16} color={accentColor} />
      </View>
      <Text style={S.kpiLabel}>{title}</Text>
      {loading
        ? <View style={[S.skeleton, { width:80, height:20, marginTop:2 }]} />
        : <Text style={S.kpiValue}>{value}</Text>
      }
      {trend != null && !loading && (
        <View style={{ flexDirection:'row', alignItems:'center', gap:3, marginTop:4 }}>
          <Text style={{ fontSize:10, fontWeight:'700', color: isPositive ? Colors.green : Colors.red }}>
            {isPositive ? '↑' : '↓'} {Math.abs(safe(trend)).toFixed(1)}%
          </Text>
        </View>
      )}
      <Sparkline color={accentColor} pts={sparkPts} />
    </View>
  );
}

// ─── Risk Customer Row ────────────────────────────────────────────────────────
function RiskRow({ item, onPress }: { item: AgingRiskItem; onPress?: () => void }) {
  const riskColor  = getRiskColor(item.risk_score);
  const overduePct = item.total > 0 ? (item.overdue_total / item.total) * 100 : 0;
  return (
    <TouchableOpacity style={[S.riskRow, Shadow.sm]} onPress={onPress} activeOpacity={0.75}>
      <View style={{ flexDirection:'row', alignItems:'flex-start', gap:10 }}>
        <Avatar name={item.customer_name || item.account} size={36} colors={[Colors.navy2, Colors.blueDim as any]} />
        <View style={{ flex:1, minWidth:0 }}>
          <Text style={S.riskName} numberOfLines={1}>{item.customer_name || item.account}</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:3, flexWrap:'wrap' }}>
            <Text style={{ fontSize:10.5, color:Colors.text3 }}>{item.account_code}</Text>
            <RiskPill risk={item.risk_score} />
            {item.branch && <BranchTag label={item.branch} />}
          </View>
        </View>
        <View style={{ alignItems:'flex-end', flexShrink:0 }}>
          <Text style={{ fontSize:14, fontWeight:'700', color:Colors.text }}>{fmtCurrency(item.total)}</Text>
          <Text style={{ fontSize:10.5, fontWeight:'600', color:Colors.red, marginTop:2 }}>{fmtCurrency(item.overdue_total)}</Text>
        </View>
      </View>
      <View style={{ marginTop:10 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
          <Text style={{ fontSize:9.5, color:Colors.text3 }}>Overdue ratio</Text>
          <Text style={{ fontSize:9.5, fontWeight:'700', color:riskColor }}>{safe(overduePct).toFixed(0)}%</Text>
        </View>
        <View style={{ height:4, borderRadius:2, backgroundColor:Colors.bg }}>
          <View style={{ height:4, borderRadius:2, backgroundColor:riskColor, width:`${Math.min(100, overduePct)}%` as any }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Monthly Bar Chart ────────────────────────────────────────────────────────
function MonthlyBars({ data }: { data: MonthlySummaryItem[] }) {
  const last6 = data.slice(-6);
  const maxS  = Math.max(...last6.map(m => m.total_sales), 1);
  return (
    <View style={S.chartCard}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <Text style={{ fontSize:13, fontWeight:'700', color:Colors.text }}>Monthly Trend</Text>
        <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:BorderRadius.full, backgroundColor:'rgba(26,92,240,0.08)', borderWidth:1, borderColor:'rgba(26,92,240,0.15)' }}>
          <Text style={{ fontSize:10, fontWeight:'600', color:Colors.blue }}>Last 6 months</Text>
        </View>
      </View>
      <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
        {[['#1a5cf0','Sales'],['#f07020','Purchases']].map(([c,l]) => (
          <View key={l} style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <View style={{ width:10, height:10, borderRadius:2, backgroundColor:c }} />
            <Text style={{ fontSize:10.5, fontWeight:'600', color:c }}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection:'row', alignItems:'flex-end', gap:4, height:80, paddingHorizontal:4 }}>
        {last6.map((m, i) => {
          const sh = Math.round((m.total_sales     / maxS) * 64);
          const ph = Math.round((m.total_purchases / maxS) * 64);
          return (
            <View key={i} style={{ flex:1, flexDirection:'row', alignItems:'flex-end', gap:2 }}>
              <LinearGradient colors={[Colors.blue3 as any, Colors.blueDim as any]} style={{ flex:1, height:sh, borderRadius:3 }} start={{ x:0,y:0 }} end={{ x:0,y:1 }} />
              <View style={{ flex:1, height:ph, borderRadius:3, backgroundColor:'rgba(240,112,32,0.55)' }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection:'row', gap:4, paddingTop:6, paddingHorizontal:4 }}>
        {last6.map((m, i) => (
          <Text key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:Colors.text3, fontWeight:'600' }}>{m.month_label}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function DashboardScreen({ navigation }: any) {
  const [kpis,       setKpis]       = useState<DashboardKPIs|null>(null);
  const [monthly,    setMonthly]    = useState<MonthlySummaryItem[]>([]);
  const [topRisk,    setTopRisk]    = useState<AgingRiskItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string|null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters,    setFilters]    = useState({ risk:'all', branch:'all' });
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);

  const fetchAll = useCallback(async (isRefresh = false, f = filters) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const riskParam = f.risk !== 'all' ? f.risk : undefined;
      const [kpisRes, monthlyRes, riskRes] = await Promise.allSettled([
        DashboardService.getDashboardKPIs(),
        DashboardService.getMonthlySummary(),
        AgingService.getTopRisk({ limit: 10, risk: riskParam }),
      ]);
      if (kpisRes.status    === 'fulfilled') setKpis(kpisRes.value);
      if (monthlyRes.status === 'fulfilled') setMonthly(monthlyRes.value.summary ?? []);
      if (riskRes.status    === 'fulfilled') setTopRisk(riskRes.value.top_risk ?? []);
      if (kpisRes.status    === 'rejected')  setError('Failed to load KPIs.');
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    TransactionMobileService.getBranches()
      .then(r => setAvailableBranches(r.branches ?? []))
      .catch(() => {});
  }, []);

  const filteredRisk = filters.branch !== 'all'
    ? topRisk.filter(r => r.branch === filters.branch)
    : topRisk;

  const salesTrend = (() => {
    const sorted = [...monthly].sort((a,b) => a.year*100+a.month - (b.year*100+b.month));
    const last   = sorted.slice(-2);
    if (last.length < 2 || last[0].total_sales === 0) return null;
    return ((last[1].total_sales - last[0].total_sales) / last[0].total_sales) * 100;
  })();

  const sp1=[30,42,35,55,40,60,45,65,50,70,55,72];
  const sp2=[60,55,70,65,80,75,85,70,90,75,88,92];
  const sp3=[85,82,78,80,75,72,70,73,68,71,69,74];
  const sp4=[45,50,48,55,52,60,58,65,62,68,65,71];

  const hasActive = filters.risk !== 'all' || filters.branch !== 'all';

  return (
    <View style={{ flex:1, backgroundColor:Colors.bg }}>
      {/* ── Filter button (floating, just below header) ── */}
      {hasActive && (
        <View style={{ backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border, paddingVertical:8 }}>
          <ActiveFilterChips
            values={filters}
            labelMap={{ risk:'Risk', branch:'Branch' }}
            onClear={key => {
              const newF = { ...filters, [key]:'all' };
              setFilters(newF);
              fetchAll(false, newF);
            }}
          />
        </View>
      )}

      {/* ── Filter trigger row ── */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:4, flexDirection:'row', justifyContent:'flex-end' }}>
        <TouchableOpacity
          style={[S.filterBtn, hasActive && S.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
        >
          <Ionicons name="options-outline" size={16} color={hasActive ? '#fff' : Colors.text3} />
          {hasActive && <View style={S.filterDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(true); }}
            tintColor={Colors.blue}
          />
        }
      >
        {/* Error */}
        {error && (
          <View style={S.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.red} />
            <Text style={{ flex:1, fontSize:12, color:Colors.red }}>{error}</Text>
            <TouchableOpacity onPress={() => fetchAll()}>
              <Text style={{ fontSize:12, fontWeight:'700', color:Colors.red }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Grid */}
        <View style={S.section}>
          <SectionHeader title="Key Metrics" />
          <View style={S.kpiGrid}>
            <KpiCard title="Total Sales"  value={kpis ? fmtCurrency(kpis.totalSales) : '—'}       trend={salesTrend} isPositive={(salesTrend??0)>=0} icon="trending-up-outline"      accentColor={Colors.blue}   sparkPts={sp1} loading={loading} />
            <KpiCard title="Stock Value"  value={kpis ? fmtCurrency(kpis.stockValue) : '—'}       icon="cube-outline"            accentColor={Colors.orange} sparkPts={sp2} loading={loading} />
            <KpiCard title="Receivables" value={kpis ? fmtCurrency(kpis.totalReceivables) : '—'} icon="wallet-outline"          accentColor={Colors.red}    sparkPts={sp3} loading={loading} />
            <KpiCard title="Collection"  value={kpis ? `${safe(kpis.collectionRate).toFixed(1)}%` : '—'} icon="checkmark-circle-outline" accentColor={Colors.teal} sparkPts={sp4} isPositive={safe(kpis?.collectionRate)>=70} loading={loading} />
          </View>
        </View>

        {/* Monthly Trend */}
        {monthly.length > 0 && (
          <View style={[S.section, { paddingTop:0 }]}>
            <MonthlyBars data={monthly} />
          </View>
        )}

        {/* Credit Health */}
        <View style={[S.section, { paddingTop:0 }]}>
          <SectionHeader title="Credit Health" />
          <View style={[S.card, Shadow.sm]}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:Colors.text }}>Global Risk Level</Text>
              <RiskPill risk={safe(kpis?.overdueRate) > 25 ? 'critical' : safe(kpis?.overdueRate) > 15 ? 'high' : 'low'} />
            </View>
            <View style={{ height:10, borderRadius:5, overflow:'hidden', marginBottom:5 }}>
              <LinearGradient colors={[Colors.green, Colors.amber, Colors.red]} style={{ flex:1, borderRadius:5 }} start={{ x:0,y:0 }} end={{ x:1,y:0 }} />
            </View>
            <View style={{ height:18, position:'relative', marginBottom:8 }}>
              <View style={{
                position:'absolute',
                left:`${Math.min(90, Math.max(5, safe(kpis?.overdueRate)))}%` as any,
                top:0,
                width:16, height:16, borderRadius:8,
                backgroundColor:Colors.surface,
                borderWidth:2.5, borderColor:Colors.text,
                marginLeft:-8,
                ...Shadow.sm,
              }} />
            </View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:14 }}>
              <Text style={{ fontSize:10, fontWeight:'600', color:Colors.green }}>Low</Text>
              <Text style={{ fontSize:10, fontWeight:'600', color:Colors.amber }}>Medium</Text>
              <Text style={{ fontSize:10, fontWeight:'600', color:Colors.red }}>High</Text>
            </View>
            {[
              { label:'Collection Rate', value:`${safe(kpis?.collectionRate).toFixed(1)}%`, good: safe(kpis?.collectionRate) >= 70 },
              { label:'Overdue Rate',    value:`${safe(kpis?.overdueRate).toFixed(1)}%`,    good: safe(kpis?.overdueRate) <= 20 },
              { label:'DSO (avg days)',  value:`${safe(kpis?.dso).toFixed(0)} days`,         good: safe(kpis?.dso) <= 90 },
            ].map(({ label, value, good }, i) => (
              <View key={i} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:10, borderTopWidth: i===0 ? 1 : 0, borderTopColor:Colors.border }}>
                <Text style={{ fontSize:12.5, color:Colors.text2 }}>{label}</Text>
                {loading
                  ? <View style={[S.skeleton, { width:60, height:14 }]} />
                  : (
                    <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                      <Text style={{ fontSize:13, fontWeight:'700', color: good ? Colors.green : Colors.red }}>{value}</Text>
                      <View style={{ paddingHorizontal:7, paddingVertical:2, borderRadius:BorderRadius.full, backgroundColor: good ? Colors.greenBg : Colors.redBg }}>
                        <Text style={{ fontSize:9, fontWeight:'800', color: good ? Colors.greenText as any : Colors.redText as any }}>{good ? 'GOOD' : 'ALERT'}</Text>
                      </View>
                    </View>
                  )}
              </View>
            ))}
          </View>
        </View>

        {/* Top Risky Customers */}
        <View style={[S.section, { paddingTop:0 }]}>
          <SectionHeader
            title="Top Risky Customers"
            action="Aging →"
            onAction={() => navigation?.navigate?.('Control', { tab:'aging' })}
          />
          {loading
            ? <ActivityIndicator color={Colors.blue} style={{ marginTop:20 }} />
            : filteredRisk.length === 0
              ? <EmptyState icon="checkmark-circle-outline" title="No risky customers" subtitle={hasActive ? 'Try adjusting your filters' : 'All customers are in good standing'} />
              : filteredRisk.map(item => (
                <RiskRow
                  key={item.id}
                  item={item}
                  onPress={() => navigation?.navigate?.('Control', { tab:'aging' })}
                />
              ))
          }
        </View>

        <View style={{ height:24 }} />
      </ScrollView>

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={[
          { key:'risk',   label:'Risk Level', options:['all','critical','high','medium','low'] },
          { key:'branch', label:'Branch',     options:['all', ...availableBranches] },
        ]}
        values={filters}
        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]:val }))}
        onReset={() => {
          const newF = { risk:'all', branch:'all' };
          setFilters(newF);
          setFilterOpen(false);
          fetchAll(false, newF);
        }}
        onApply={() => {
          setFilterOpen(false);
          fetchAll(false, filters);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  section:       { padding:16 },
  kpiGrid:       { flexDirection:'row', flexWrap:'wrap', gap:10 },
  kpiCard:       { width:CARD_W, backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:14, borderWidth:1, borderColor:Colors.border, overflow:'hidden' },
  kpiAccent:     { position:'absolute', top:0, left:0, right:0, height:3 },
  kpiIcon:       { width:32, height:32, borderRadius:BorderRadius.lg, alignItems:'center', justifyContent:'center', marginBottom:10 },
  kpiLabel:      { fontSize:10.5, fontWeight:'600', color:Colors.text3, letterSpacing:0.2, marginBottom:3 },
  kpiValue:      { fontSize:20, fontWeight:'700', color:Colors.text, letterSpacing:-0.5, lineHeight:24 },
  chartCard:     { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:16, borderWidth:1, borderColor:Colors.border, ...Shadow.sm },
  card:          { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:16, borderWidth:1, borderColor:Colors.border },
  riskRow:       { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:14, marginBottom:10, borderWidth:1, borderColor:Colors.border },
  riskName:      { fontSize:13, fontWeight:'700', color:Colors.text },
  errorBanner:   { flexDirection:'row', alignItems:'center', gap:8, margin:16, padding:12, borderRadius:BorderRadius.lg, backgroundColor:Colors.redBg, borderWidth:1, borderColor:'#fecaca' },
  skeleton:      { backgroundColor:Colors.bg, borderRadius:4 },
  filterBtn:     { width:38, height:38, borderRadius:BorderRadius.lg, backgroundColor:Colors.surface, borderWidth:1, borderColor:Colors.border, alignItems:'center', justifyContent:'center', position:'relative' },
  filterBtnActive:{ backgroundColor:Colors.blue, borderColor:Colors.blue },
  filterDot:     { position:'absolute', top:6, right:6, width:7, height:7, borderRadius:4, backgroundColor:Colors.orange, borderWidth:1.5, borderColor:Colors.blue },
});