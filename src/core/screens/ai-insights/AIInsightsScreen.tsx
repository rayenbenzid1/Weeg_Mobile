/**
 * src/core/screens/ai-insights/AIInsightsScreen.tsx
 *
 * FIXES vs previous version:
 *  FIX 1 — ForecastTab: SVG area chart (best/expected/worst) added above bar cards (mirrors Image 6)
 *  FIX 2 — StockCard & AnomalyCard: explicit chevron added to header row (like Churn in Image 5)
 *  FIX 3 — StockTab: branch filter chips derived from loaded items (missing in Image 2)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import Svg, {
  Path, Line, Circle,
  Text as SvgText,
  Defs, LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, BorderRadius } from '../../constants/theme';
import {
  aiInsightsMobileApi,
  type CriticalSituation,
  type KPIValue,
  type Anomaly,
  type ChurnPrediction,
  type StockItem,
} from '../../lib/aiInsightsMobileApi';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtLyd = (n?: number | null): string => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M LYD`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K LYD`;
  return `${Math.round(n).toLocaleString()} LYD`;
};
const safe = (n?: number | null, fb = 0) =>
  n == null || isNaN(Number(n)) ? fb : Number(n);

const SEV: Record<string, string> = {
  critical: Colors.red, high: Colors.orange, medium: Colors.amber, low: Colors.green,
};
const TRF: Record<string, string> = {
  red: Colors.red, amber: Colors.amber, green: Colors.green,
};

// ─── Micro-components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const c = SEV[severity] ?? Colors.text3;
  return (
    <View style={[S.badge, { backgroundColor: c + '20', borderColor: c + '40' }]}>
      <Text style={[S.badgeText, { color: c }]}>{severity.toUpperCase()}</Text>
    </View>
  );
}

function ConfidenceTag({ confidence }: { confidence: string }) {
  const c = confidence === 'high' ? Colors.green : confidence === 'medium' ? Colors.amber : Colors.red;
  return (
    <Text style={[S.confTag, { color: c, borderColor: c + '40', backgroundColor: c + '12' }]}>
      {confidence} conf.
    </Text>
  );
}

function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <View style={[S.skCard, { gap: 8 }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[S.skLine, { width: i === 0 ? '70%' : '40%' }]} />
      ))}
    </View>
  );
}

function ErrorRetry({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <View style={S.errBox}>
      <Ionicons name="alert-circle-outline" size={32} color={Colors.red} />
      <Text style={S.errText}>{msg}</Text>
      <TouchableOpacity style={S.retryBtn} onPress={onRetry}>
        <Text style={S.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyOK({ text }: { text: string }) {
  return (
    <View style={S.emptyBox}>
      <Ionicons name="checkmark-circle-outline" size={36} color={Colors.green} style={{ opacity: 0.6 }} />
      <Text style={S.emptyText}>{text}</Text>
    </View>
  );
}

function useAnalyzer<T>(fetchFn: () => Promise<T>) {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const mounted             = useRef(true);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await fetchFn(); if (mounted.current) setData(res); }
    catch (e: any) { if (mounted.current) setError(e.message ?? 'Failed'); }
    finally { if (mounted.current) setLoading(false); }
  }, []);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; }; }, [load]);
  return { data, loading, error, reload: load };
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — Forecast area chart using react-native-svg
// Mirrors the web area chart in Image 6 (best/expected/worst lines + filled area)
// ─────────────────────────────────────────────────────────────────────────────

interface FPt { period: string; base: number; opt: number; pes: number }

function ForecastAreaChart({ points }: { points: FPt[] }) {
  const CW  = width - 32 - 28;
  const CH  = 190;
  const PL  = 54; const PR = 12; const PT = 16; const PB = 32;
  const pw  = CW - PL - PR;
  const ph  = CH - PT - PB;
  const n   = points.length;

  const allV = points.flatMap(p => [p.base, p.opt, p.pes]);
  const maxV = Math.max(...allV) * 1.08;
  const minV = Math.min(...allV) * 0.92;
  const rng  = maxV - minV || 1;
  const xStep = n > 1 ? pw / (n - 1) : pw;

  const px = (i: number) => PL + i * xStep;
  const py = (v: number) => PT + ph - ((v - minV) / rng) * ph;

  const mkPath = (get: (p: FPt) => number) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)} ${py(get(p)).toFixed(1)}`).join(' ');

  const mkArea = (get: (p: FPt) => number) => {
    const last = n - 1;
    return `${mkPath(get)} L${px(last).toFixed(1)} ${(PT + ph).toFixed(1)} L${px(0).toFixed(1)} ${(PT + ph).toFixed(1)} Z`;
  };

  const yTicks = [0, 0.5, 1].map(t => ({ val: minV + t * rng, y: PT + ph * (1 - t) }));

  return (
    <View style={[S.chartCard, { marginBottom: 16 }]}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
        {[{ c: Colors.green, l: 'Best case' }, { c: Colors.blue, l: 'Expected' }, { c: Colors.red, l: 'Worst case' }].map(({ c, l }) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 20, height: 2.5, borderRadius: 2, backgroundColor: c }} />
            <Text style={{ fontSize: 10, color: Colors.text3, fontWeight: '600' }}>{l}</Text>
          </View>
        ))}
      </View>

      <Svg width={CW} height={CH}>
        <Defs>
          <SvgGrad id="fg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={Colors.blue} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={Colors.blue} stopOpacity="0.03" />
          </SvgGrad>
        </Defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <Line key={i} x1={PL} y1={t.y} x2={CW - PR} y2={t.y}
            stroke={Colors.border} strokeWidth="0.8" strokeDasharray="4 3" />
        ))}

        {/* Y labels */}
        {yTicks.map((t, i) => (
          <SvgText key={i} x={PL - 4} y={t.y + 4} fontSize="9" fill={Colors.text3} textAnchor="end">
            {t.val >= 1_000_000 ? `${(t.val / 1_000_000).toFixed(1)}M` : `${(t.val / 1_000).toFixed(0)}K`}
          </SvgText>
        ))}

        {/* X labels */}
        {points.map((p, i) => (
          <SvgText key={i} x={px(i)} y={CH - 8} fontSize="9" fill={Colors.text3} textAnchor="middle">
            {p.period.replace(/\s\d{4}/, '')}
          </SvgText>
        ))}

        {/* Filled area under expected */}
        <Path d={mkArea(p => p.base)} fill="url(#fg)" />

        {/* Worst dashed */}
        <Path d={mkPath(p => p.pes)} fill="none" stroke={Colors.red} strokeWidth="1.5" strokeDasharray="5 3" />

        {/* Best dashed */}
        <Path d={mkPath(p => p.opt)} fill="none" stroke={Colors.green} strokeWidth="1.5" strokeDasharray="5 3" />

        {/* Expected solid */}
        <Path d={mkPath(p => p.base)} fill="none" stroke={Colors.blue} strokeWidth="2.5" />

        {/* Dots on expected */}
        {points.map((p, i) => (
          <Circle key={i} cx={px(i)} cy={py(p.base)} r="3.5" fill="#fff" stroke={Colors.blue} strokeWidth="2" />
        ))}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Risk Briefing
// ─────────────────────────────────────────────────────────────────────────────

function SituationRow({ sit, rank }: { sit: CriticalSituation; rank: number }) {
  const [open, setOpen] = useState(false);
  const accent = SEV[sit.severity] ?? Colors.amber;
  const entity = sit.customer_name || sit.account_name || sit.product_name;
  return (
    <View style={[S.listCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <TouchableOpacity style={S.rowHeader} onPress={() => setOpen(o => !o)}>
        <Text style={S.rankNum}>#{rank}</Text>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={S.rowTitle} numberOfLines={2}>{sit.title}</Text>
          {entity ? <Text style={[S.rowSub, { color: Colors.blue }]}>{entity}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <SeverityBadge severity={sit.severity} />
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.text3} />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={S.expandBody}>
          <Text style={S.expandText}>{sit.summary}</Text>
          <View style={S.metaRow}>
            <View style={S.metaChip}>
              <Ionicons name="cash-outline" size={12} color={Colors.red} />
              <Text style={[S.metaChipText, { color: Colors.red }]}>{fmtLyd(sit.financial_exposure_lyd)}</Text>
            </View>
            <View style={S.metaChip}>
              <Ionicons name="time-outline" size={12} color={Colors.orange} />
              <Text style={[S.metaChipText, { color: Colors.orange }]}>Act in {sit.urgency_hours}h</Text>
            </View>
          </View>
          <View style={[S.actionBox, { borderColor: Colors.blue + '30', backgroundColor: Colors.blue + '08' }]}>
            <Text style={[S.actionLabel, { color: Colors.blue }]}>Recommended action</Text>
            <Text style={[S.actionText, { color: Colors.blue }]}>{sit.recommended_action}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function CriticalTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.critical());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };
  const riskAccent = SEV[data?.risk_level ?? 'low'];

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data)   return null;

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      <LinearGradient colors={[riskAccent + '22', riskAccent + '08']} style={[S.riskBanner, { borderColor: riskAccent + '40' }]}>
        <View style={S.riskBannerTop}>
          <View style={[S.riskIcon, { backgroundColor: riskAccent }]}>
            <Ionicons name="flame" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <SeverityBadge severity={data.risk_level} />
              <Text style={S.riskExposure}>{fmtLyd(data.total_exposure_lyd)} at risk</Text>
            </View>
            <Text style={S.riskBriefing} numberOfLines={4}>{data.executive_briefing}</Text>
          </View>
        </View>
        <View style={S.riskStats}>
          {[{ label: 'Critical', n: data.critical_count, color: Colors.red }, { label: 'Total', n: data.total_situations, color: Colors.text2 }].map(({ label, n, color }) => (
            <View key={label} style={S.riskStat}>
              <Text style={[S.riskStatN, { color }]}>{n}</Text>
              <Text style={S.riskStatL}>{label}</Text>
            </View>
          ))}
          <ConfidenceTag confidence={data.confidence} />
        </View>
      </LinearGradient>

      {data.situations.length > 0 && (
        <><Text style={S.sectionLabel}>Situations — ranked by risk × exposure</Text>
          {data.situations.map((s, i) => <SituationRow key={i} sit={s} rank={i + 1} />)}</>
      )}

      {data.causal_clusters?.length > 0 && (
        <><Text style={S.sectionLabel}>Root cause clusters</Text>
          {data.causal_clusters.map((c, i) => (
            <View key={i} style={[S.listCard, { borderLeftColor: Colors.violet, borderLeftWidth: 3 }]}>
              <Text style={[S.rowTitle, { color: Colors.violet }]}>{c.cluster_name}</Text>
              <Text style={S.expandText}>{c.common_cause}</Text>
              <View style={[S.actionBox, { borderColor: Colors.violet + '30', backgroundColor: Colors.violet + '08', marginTop: 8 }]}>
                <Text style={[S.actionText, { color: Colors.violet }]}>{c.unified_action}</Text>
              </View>
            </View>
          ))}</>
      )}

      {([
        { key: 'act_within_24h' as const, label: '⚡ Act within 24h', color: Colors.red },
        { key: 'act_this_week'  as const, label: 'This week',         color: Colors.orange },
        { key: 'monitor'        as const, label: 'Monitor',            color: Colors.blue },
      ]).map(({ key, label, color }) => {
        const items = data.grouped_actions?.[key] ?? [];
        if (!items.length) return null;
        return (
          <View key={key}>
            <Text style={[S.sectionLabel, { color }]}>{label}</Text>
            {items.map((a, i) => (
              <View key={i} style={S.actionRow}>
                <View style={[S.actionDot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={S.rowTitle}>{a.situation}</Text>
                  <Text style={S.expandText}>{a.action}</Text>
                  <Text style={[S.rowSub, { color }]}>→ {a.owner}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      })}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — KPIs
// ─────────────────────────────────────────────────────────────────────────────

function KPICard({ label, kpi }: { label: string; kpi: KPIValue }) {
  const [open, setOpen] = useState(false);
  const c     = TRF[kpi.status] ?? Colors.text3;
  const delta = kpi.delta_pct;
  const fmt = (v: number) => {
    if (label.toLowerCase().includes('dso') || label.toLowerCase().includes('days')) return `${v.toFixed(0)}d`;
    if (v > 1 && v <= 100 && label.toLowerCase().includes('%')) return `${v.toFixed(1)}%`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(1);
  };
  return (
    <TouchableOpacity style={[S.kpiCard, { borderTopColor: c, borderTopWidth: 3 }]} onPress={() => setOpen(o => !o)}>
      <View style={S.kpiTop}>
        <View style={[S.kpiDot, { backgroundColor: c }]} />
        <Text style={S.kpiLabel} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={S.kpiValue}>{fmt(kpi.current)}</Text>
      <View style={S.kpiDelta}>
        <Ionicons name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={10} color={delta >= 0 ? Colors.green : Colors.red} />
        <Text style={[S.kpiDeltaText, { color: delta >= 0 ? Colors.green : Colors.red }]}>{Math.abs(delta).toFixed(1)}%</Text>
      </View>
      {open && kpi.source && <Text style={S.kpiSource}>Source: {kpi.source}</Text>}
    </TouchableOpacity>
  );
}

function KPIsTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.kpis());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data)   return null;

  const hColor = data.health_score >= 80 ? Colors.green : data.health_score >= 60 ? Colors.amber : Colors.red;

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      <View style={S.healthCard}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
          <View style={[S.healthRing, { borderColor: hColor }]}>
            <Text style={[S.healthScore, { color: hColor }]}>{data.health_score}</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[S.healthLabel, { textTransform: 'capitalize' }]}>{data.health_label} health</Text>
          <Text style={S.expandText} numberOfLines={3}>{data.executive_summary}</Text>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            {[{ n: data.summary.green, l: 'Good', c: Colors.green }, { n: data.summary.amber, l: 'Watch', c: Colors.amber }, { n: data.summary.red, l: 'Alert', c: Colors.red }].map(({ n, l, c }) => (
              <View key={l} style={{ alignItems: 'center' }}>
                <Text style={[S.kpiValue, { color: c, fontSize: 20 }]}>{n}</Text>
                <Text style={S.kpiLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {data.top_insight ? (
        <View style={[S.actionBox, { borderColor: Colors.blue + '30', backgroundColor: Colors.blue + '08' }]}>
          <Text style={[S.actionLabel, { color: Colors.blue }]}>Top insight</Text>
          <Text style={S.expandText}>{data.top_insight}</Text>
        </View>
      ) : null}

      <Text style={S.sectionLabel}>KPI breakdown</Text>
      <View style={S.kpiGrid}>
        {Object.entries(data.kpis).map(([k, v]) => <KPICard key={k} label={v.label || k.replace(/_/g, ' ')} kpi={v} />)}
      </View>

      {data.recommended_actions?.length > 0 && (
        <><Text style={S.sectionLabel}>Recommended actions</Text>
          {data.recommended_actions.map((a, i) => (
            <View key={i} style={S.listCard}>
              <View style={S.metaRow}>
                <View style={[S.prioCircle, { backgroundColor: Colors.blue + '18' }]}>
                  <Text style={[S.prioText, { color: Colors.blue }]}>{a.priority}</Text>
                </View>
                <Text style={[S.rowTitle, { flex: 1 }]}>{a.action}</Text>
              </View>
              <Text style={[S.rowSub, { color: Colors.blue }]}>{a.owner} · {a.impact}</Text>
            </View>
          ))}</>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — Anomalies   FIX 2: chevron arrow added
// ─────────────────────────────────────────────────────────────────────────────

function AnomalyCard({ anomaly: a }: { anomaly: Anomaly }) {
  const [open, setOpen] = useState(false);
  const accent  = SEV[a.severity];
  const isSpike = a.direction === 'spike';

  return (
    <View style={[S.listCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <TouchableOpacity style={S.rowHeader} onPress={() => setOpen(o => !o)}>
        <Ionicons name={isSpike ? 'trending-up-outline' : 'trending-down-outline'} size={18} color={isSpike ? Colors.green : Colors.red} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={S.rowTitle} numberOfLines={1}>
            {a.stream.replace(/_/g, ' ').replace('product revenue:', '')}
          </Text>
          <Text style={S.rowSub}>{a.date}</Text>
        </View>
        {/* FIX 2: right column mirrors Churn layout — badge + deviation + chevron */}
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <SeverityBadge severity={a.severity} />
          <Text style={[S.rowSub, { color: isSpike ? Colors.green : Colors.red, fontWeight: '700' }]}>
            {a.deviation_pct > 0 ? '+' : ''}{a.deviation_pct.toFixed(0)}%
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.text3} />
        </View>
      </TouchableOpacity>

      <View style={S.anomalyMetaRow}>
        <Text style={S.anomalyMeta}>Obs: <Text style={{ fontWeight: '700', color: Colors.text }}>{a.observed_value.toLocaleString()}</Text></Text>
        <Text style={S.anomalyMeta}>Exp: {a.expected_value.toLocaleString()}</Text>
        <Text style={S.anomalyMeta}>z={a.z_score.toFixed(1)}</Text>
      </View>

      <Text style={S.expandText} numberOfLines={open ? undefined : 2}>{a.ai_explanation}</Text>

      {open && (
        <View style={{ marginTop: 10, gap: 10 }}>
          {a.likely_causes?.length > 0 && (
            <View>
              <Text style={[S.actionLabel, { color: Colors.text }]}>Likely causes</Text>
              {a.likely_causes.map((c, i) => <Text key={i} style={S.bulletItem}>• {c}</Text>)}
            </View>
          )}
          {a.business_impact ? (
            <View style={[S.actionBox, { borderColor: Colors.amber + '30', backgroundColor: Colors.amber + '08' }]}>
              <Text style={[S.actionLabel, { color: Colors.amber }]}>Business impact</Text>
              <Text style={S.expandText}>{a.business_impact}</Text>
            </View>
          ) : null}
          {a.recommended_actions?.length > 0 && (
            <View>
              <Text style={[S.actionLabel, { color: Colors.text }]}>Actions</Text>
              {a.recommended_actions.map((act, i) => <Text key={i} style={S.bulletItem}>→ {act}</Text>)}
            </View>
          )}
          <ConfidenceTag confidence={a.confidence} />
        </View>
      )}
    </View>
  );
}

function AnomaliesTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.anomalies());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data || data.anomalies.length === 0) return <EmptyOK text="No anomalies detected in the last 12 months." />;

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {[{ label: 'Critical', n: data.summary.critical, c: Colors.red }, { label: 'High', n: data.summary.high, c: Colors.orange }, { label: 'Medium', n: data.summary.medium, c: Colors.amber }, { label: 'Total', n: data.summary.total, c: Colors.text3 }]
          .filter(d => d.n > 0)
          .map(({ label, n, c }) => (
            <View key={label} style={[S.summaryPill, { backgroundColor: c + '15', borderColor: c + '30' }]}>
              <Text style={[S.summaryPillText, { color: c }]}>{n} {label}</Text>
            </View>
          ))}
      </ScrollView>
      {data.anomalies.map((a, i) => <AnomalyCard key={i} anomaly={a} />)}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4 — Seasonal
// ─────────────────────────────────────────────────────────────────────────────

function SeasonalTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.seasonal());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data || data.error) return <EmptyOK text={data?.error ?? 'Insufficient data.'} />;

  const indices = Object.values(data.seasonality_indices ?? {}).filter(v => v.seasonality_index !== null);
  const maxSI   = Math.max(...indices.map(v => v.seasonality_index ?? 1), 1);

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <View style={[S.seasonPill, { backgroundColor: Colors.teal + '15', borderColor: Colors.teal + '30' }]}>
          <Text style={[S.seasonPillText, { color: Colors.teal }]}>{data.current_season}</Text>
        </View>
        {data.upcoming_peak_alert && (
          <View style={[S.seasonPill, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '30' }]}>
            <Ionicons name="alert-circle-outline" size={12} color={Colors.amber} />
            <Text style={[S.seasonPillText, { color: Colors.amber }]}>Peak approaching</Text>
          </View>
        )}
      </View>

      {data.trend && (
        <View style={S.trendRow}>
          <Ionicons
            name={data.trend.direction === 'growing' ? 'trending-up-outline' : data.trend.direction === 'declining' ? 'trending-down-outline' : 'remove-outline'}
            size={16}
            color={data.trend.direction === 'growing' ? Colors.green : data.trend.direction === 'declining' ? Colors.red : Colors.text3}
          />
          <Text style={S.trendText}>
            Overall trend: <Text style={{ fontWeight: '700', color: Colors.text }}>{data.trend.direction}</Text>
            {' '}({data.trend.slope_pct_per_month > 0 ? '+' : ''}{data.trend.slope_pct_per_month.toFixed(2)}%/mo)
          </Text>
        </View>
      )}

      <Text style={S.sectionLabel}>Monthly seasonality index</Text>
      <View style={S.siGrid}>
        {indices.map(v => {
          const pct      = ((v.seasonality_index ?? 1) / maxSI) * 100;
          const barColor = v.label === 'peak' ? Colors.teal : v.label === 'trough' ? Colors.orange : Colors.blue;
          return (
            <View key={v.month_num} style={S.siBar}>
              <View style={S.siBarTrack}>
                <View style={[S.siBarFill, { height: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={[S.siBarLabel, { color: v.label === 'peak' ? Colors.teal : v.label === 'trough' ? Colors.orange : Colors.text3 }]}>
                {v.month_name.slice(0, 3)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={S.peakRow}>
        <View style={[S.peakBox, { backgroundColor: Colors.teal + '10', borderColor: Colors.teal + '25' }]}>
          <Ionicons name="trending-up-outline" size={13} color={Colors.teal} />
          <Text style={[S.peakLabel, { color: Colors.teal }]}>Peak months</Text>
          <Text style={S.peakValue}>{data.peak_month_names?.join(', ') || '—'}</Text>
        </View>
        <View style={[S.peakBox, { backgroundColor: Colors.orange + '10', borderColor: Colors.orange + '25' }]}>
          <Ionicons name="trending-down-outline" size={13} color={Colors.orange} />
          <Text style={[S.peakLabel, { color: Colors.orange }]}>Trough months</Text>
          <Text style={S.peakValue}>{data.trough_month_names?.join(', ') || '—'}</Text>
        </View>
      </View>

      {data.seasonal_narrative ? (
        <View style={S.narrativeCard}>
          <Text style={S.narrativeLabel}>AI Narrative</Text>
          <Text style={S.expandText}>{data.seasonal_narrative}</Text>
        </View>
      ) : null}

      {data.ai_recommendations?.length > 0 && (
        <><Text style={S.sectionLabel}>Recommendations</Text>
          {data.ai_recommendations.map((r, i) => (
            <View key={i} style={S.actionRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.green} style={{ marginTop: 1 }} />
              <Text style={[S.expandText, { flex: 1 }]}>{r}</Text>
            </View>
          ))}</>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5 — Churn (reference layout — chevrons correct per Image 5)
// ─────────────────────────────────────────────────────────────────────────────

function ChurnCard({ p }: { p: ChurnPrediction }) {
  const [open, setOpen] = useState(false);
  const accent = SEV[p.churn_label];
  return (
    <View style={[S.listCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <TouchableOpacity style={S.rowHeader} onPress={() => setOpen(o => !o)}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={S.rowTitle} numberOfLines={1}>{p.customer_name || p.account_code}</Text>
            <SeverityBadge severity={p.churn_label} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <View style={[S.scoreBar, { width: `${Math.min(80, safe(p.churn_score) * 80)}%`, backgroundColor: accent }]} />
            <Text style={[S.rowSub, { color: accent }]}>{(safe(p.churn_score) * 100).toFixed(0)}%</Text>
            <Text style={S.rowSub}>{p.days_since_last_purchase}d inactive</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[S.kpiValue, { fontSize: 14 }]}>{fmtLyd(p.avg_monthly_revenue_lyd)}</Text>
          <Text style={S.rowSub}>/mo</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.text3} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={S.expandBody}>
          <Text style={S.expandText}>{p.ai_explanation}</Text>
          <View style={S.miniStatGrid}>
            {[
              { l: 'Avg Rev', v: fmtLyd(p.avg_monthly_revenue_lyd) },
              { l: 'Trend', v: `${((p.revenue_trend - 1) * 100).toFixed(0)}%` },
              { l: 'Overdue', v: `${(p.overdue_ratio * 100).toFixed(0)}%` },
              { l: 'Orders 12m', v: String(p.purchase_count_12m) },
            ].map(({ l, v }) => (
              <View key={l} style={S.miniStat}>
                <Text style={S.miniStatL}>{l}</Text>
                <Text style={S.miniStatV}>{v}</Text>
              </View>
            ))}
          </View>
          {p.recommended_actions?.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[S.actionLabel, { color: Colors.text }]}>Actions</Text>
              {p.recommended_actions.map((a, i) => <Text key={i} style={S.bulletItem}>→ {a}</Text>)}
            </View>
          )}
          <View style={{ marginTop: 8 }}><ConfidenceTag confidence={p.confidence} /></View>
        </View>
      )}
    </View>
  );
}

function ChurnTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.churn({ top_n: 20 }));
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data || !data.predictions?.length) return <EmptyOK text="No churn risk detected." />;

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      <View style={S.statGrid}>
        {[
          { l: 'Critical', n: data.summary.critical, c: Colors.red },
          { l: 'High',     n: data.summary.high,     c: Colors.orange },
          { l: 'Medium',   n: data.summary.medium,   c: Colors.amber },
          { l: 'Avg score',n: `${(data.summary.avg_churn_score * 100).toFixed(0)}%`, c: Colors.violet },
        ].map(({ l, n, c }) => (
          <View key={l} style={[S.statCell, { backgroundColor: c + '12' }]}>
            <Text style={[S.statN, { color: c }]}>{n}</Text>
            <Text style={S.statL}>{l}</Text>
          </View>
        ))}
      </View>
      <Text style={S.sectionLabel}>Top at-risk customers</Text>
      {data.predictions.slice(0, 12).map((p, i) => <ChurnCard key={i} p={p} />)}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 6 — Stock   FIX 2 (chevron) + FIX 3 (branch filter)
// ─────────────────────────────────────────────────────────────────────────────

function StockCard({ item }: { item: StockItem }) {
  const [open, setOpen]   = useState(false);
  const urgencyColor      = ({ immediate: Colors.red, soon: Colors.amber, watch: Colors.blue, ok: Colors.green } as any)[item.urgency] ?? Colors.text3;
  const classColor        = ({ A: Colors.blue, B: Colors.amber, C: Colors.text3 } as any)[item.abc_class] ?? Colors.text3;

  return (
    <View style={[S.listCard, { borderLeftColor: urgencyColor, borderLeftWidth: 3 }]}>
      <TouchableOpacity style={S.rowHeader} onPress={() => setOpen(o => !o)}>
        <View style={[S.classTag, { backgroundColor: classColor + '20' }]}>
          <Text style={[S.classTagText, { color: classColor }]}>{item.abc_class}</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={S.rowTitle} numberOfLines={2}>{item.product_name}</Text>
          <Text style={S.rowSub}>{item.branch_name}</Text>
        </View>
        {/* FIX 2: urgency badge + days left + chevron (matches Churn pattern) */}
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <View style={[S.badge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
            <Text style={[S.badgeText, { color: urgencyColor }]}>{item.urgency.toUpperCase()}</Text>
          </View>
          {item.estimated_days_to_stockout != null && (
            <Text style={[S.rowSub, {
              color: item.estimated_days_to_stockout < 7 ? Colors.red : Colors.text3,
              fontWeight: item.estimated_days_to_stockout < 7 ? '700' : '400',
            }]}>
              {item.estimated_days_to_stockout.toFixed(0)}d left
            </Text>
          )}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.text3} />
        </View>
      </TouchableOpacity>

      <View style={S.anomalyMetaRow}>
        <Text style={S.anomalyMeta}>Stock: <Text style={{ fontWeight: '700', color: Colors.text }}>{item.current_stock.toFixed(0)}</Text></Text>
        <Text style={S.anomalyMeta}>ROP: {item.reorder_point.toFixed(0)}</Text>
        <Text style={S.anomalyMeta}>EOQ: {item.eoq}</Text>
      </View>

      {open && (
        <View style={S.expandBody}>
          <View style={S.miniStatGrid}>
            {[
              { l: 'Daily demand', v: `${item.avg_daily_demand.toFixed(2)} u/d` },
              { l: 'Safety stock', v: `${item.safety_stock.toFixed(0)} u` },
              { l: 'Revenue',      v: fmtLyd(item.total_revenue_lyd) },
              { l: 'Rev at risk',  v: item.revenue_at_risk_lyd > 0 ? fmtLyd(item.revenue_at_risk_lyd) : '—' },
            ].map(({ l, v }) => (
              <View key={l} style={S.miniStat}>
                <Text style={S.miniStatL}>{l}</Text>
                <Text style={S.miniStatV}>{v}</Text>
              </View>
            ))}
          </View>
          {item.ai_recommendation ? (
            <View style={[S.actionBox, { borderColor: Colors.blue + '30', backgroundColor: Colors.blue + '08', marginTop: 8 }]}>
              <Text style={[S.actionLabel, { color: Colors.blue }]}>AI recommendation</Text>
              <Text style={S.expandText}>{item.ai_recommendation}</Text>
            </View>
          ) : null}
          {item.order_suggestion?.quantity > 0 && (
            <View style={[S.actionBox, { borderColor: Colors.teal + '30', backgroundColor: Colors.teal + '08', marginTop: 8 }]}>
              <Text style={[S.actionLabel, { color: Colors.teal }]}>Order {item.order_suggestion.quantity} units · {item.order_suggestion.timing}</Text>
              <Text style={S.expandText}>{item.order_suggestion.rationale}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function StockTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.stock());
  const [urgencyFilter, setUrgencyFilter] = useState<'immediate' | 'soon' | 'all'>('immediate');
  // FIX 3: branch filter — derived from items, no extra API call needed
  const [branchFilter, setBranchFilter]   = useState<string>('all');
  const [refreshing, setRefreshing]       = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  // Unique branch names from loaded data
  const branches = useMemo(() => {
    if (!data?.items?.length) return [];
    return Array.from(new Set(data.items.map(i => i.branch_name).filter(Boolean))).sort();
  }, [data?.items]);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;
    if (urgencyFilter !== 'all') list = list.filter(i => i.urgency === urgencyFilter);
    if (branchFilter  !== 'all') list = list.filter(i => i.branch_name === branchFilter);
    return list;
  }, [data?.items, urgencyFilter, branchFilter]);

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data || !data.items?.length) return <EmptyOK text="No stock data available." />;

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      {/* Summary KPIs */}
      <View style={S.statGrid}>
        {[
          { l: 'Class A', n: data.summary.class_a_count,      c: Colors.blue },
          { l: 'Class B', n: data.summary.class_b_count,      c: Colors.amber },
          { l: 'Reorder', n: data.summary.immediate_reorders,  c: Colors.red },
          { l: 'Soon',    n: data.summary.soon_reorders,       c: Colors.orange },
        ].map(({ l, n, c }) => (
          <View key={l} style={[S.statCell, { backgroundColor: c + '12' }]}>
            <Text style={[S.statN, { color: c }]}>{n}</Text>
            <Text style={S.statL}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Urgency filter */}
      <View style={S.filterRow}>
        {(['immediate', 'soon', 'all'] as const).map(u => (
          <TouchableOpacity key={u} style={[S.filterChip, urgencyFilter === u && S.filterChipActive]} onPress={() => setUrgencyFilter(u)}>
            <Text style={[S.filterChipText, urgencyFilter === u && S.filterChipTextActive]}>
              {u === 'immediate' ? `Immediate (${data.summary.immediate_reorders})` : u === 'soon' ? `Soon (${data.summary.soon_reorders})` : `All (${data.summary.total_items})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FIX 3: branch filter — only shown when there is more than one branch */}
      {branches.length > 1 && (
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="storefront-outline" size={12} color={Colors.text3} />
            <Text style={[S.sectionLabel, { marginBottom: 0, marginTop: 0 }]}>Branch</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <TouchableOpacity style={[S.filterChip, branchFilter === 'all' && S.filterChipActive]} onPress={() => setBranchFilter('all')}>
              <Text style={[S.filterChipText, branchFilter === 'all' && S.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {branches.map(b => (
              <TouchableOpacity key={b} style={[S.filterChip, branchFilter === b && S.filterChipActive]} onPress={() => setBranchFilter(b)}>
                <Text style={[S.filterChipText, branchFilter === b && S.filterChipTextActive]} numberOfLines={1}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {filtered.length === 0
        ? <EmptyOK text="No items match this filter." />
        : filtered.slice(0, 25).map((item, i) => <StockCard key={`${item.product_code}-${i}`} item={item} />)
      }
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 7 — Forecast   FIX 1: area chart above bar cards
// ─────────────────────────────────────────────────────────────────────────────

function ForecastTab() {
  const { data, loading, error, reload } = useAnalyzer(() => aiInsightsMobileApi.predict());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  if (loading) return <View style={S.tabBody}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</View>;
  if (error)   return <ErrorRetry msg={error} onRetry={reload} />;
  if (!data || !data.revenue_forecast?.length) return <EmptyOK text={data?.error ?? 'Insufficient data for forecasting.'} />;

  const tm   = data.trend_model;
  const fc   = data.revenue_forecast;
  const trendColor = tm.direction === 'growing' ? Colors.green : tm.direction === 'declining' ? Colors.red : Colors.text3;
  const maxBase    = Math.max(...fc.map(m => m.optimistic_lyd), 1);

  // FIX 1: build chart-ready points
  const chartPoints: FPt[] = fc.map(m => ({
    period: m.period,
    base:   m.base_lyd,
    opt:    m.optimistic_lyd,
    pes:    m.pessimistic_lyd,
  }));

  return (
    <ScrollView style={S.tabBody} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}>
      {/* Trend summary row */}
      <View style={S.trendRow}>
        <Ionicons
          name={tm.direction === 'growing' ? 'trending-up-outline' : tm.direction === 'declining' ? 'trending-down-outline' : 'remove-outline'}
          size={16} color={trendColor}
        />
        <Text style={[S.trendText, { color: trendColor, fontWeight: '700' }]}>{tm.direction}</Text>
        <Text style={S.trendText}>{(tm.slope_pct ?? 0) > 0 ? '+' : ''}{(tm.slope_pct ?? 0).toFixed(1)}%/mo</Text>
        {tm.mape ? <Text style={S.trendText}>MAPE {tm.mape.toFixed(0)}%</Text> : null}
      </View>

      {data.forecast_narrative ? (
        <Text style={[S.expandText, { marginBottom: 16 }]}>{data.forecast_narrative}</Text>
      ) : null}

      {/* ── FIX 1: SVG area chart ── */}
      <Text style={S.sectionLabel}>3-Month revenue forecast (LYD)</Text>
      <ForecastAreaChart points={chartPoints} />

      {/* Per-month bar cards for quick number reference */}
      {fc.map((m, i) => {
        const basePct = Math.min((m.base_lyd / maxBase) * 100, 100);
        const optPct  = Math.min((m.optimistic_lyd / maxBase) * 100, 100);
        const pesPct  = Math.min((m.pessimistic_lyd / maxBase) * 100, 100);
        return (
          <View key={i} style={S.forecastRow}>
            <Text style={S.forecastPeriod}>{m.period}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={S.forecastBarRow}>
                <View style={S.forecastBarTrack}>
                  <View style={[S.forecastBarFill, { width: `${optPct}%`, backgroundColor: Colors.green + '60' }]} />
                </View>
                <Text style={[S.forecastBarLabel, { color: Colors.green }]} numberOfLines={1}>+{m.upside_pct.toFixed(0)}%</Text>
              </View>
              <View style={S.forecastBarRow}>
                <View style={S.forecastBarTrack}>
                  <View style={[S.forecastBarFill, { width: `${basePct}%`, backgroundColor: Colors.blue }]} />
                </View>
                <Text style={S.forecastBarLabel} numberOfLines={1}>{fmtLyd(m.base_lyd)}</Text>
              </View>
              <View style={S.forecastBarRow}>
                <View style={S.forecastBarTrack}>
                  <View style={[S.forecastBarFill, { width: `${pesPct}%`, backgroundColor: Colors.red + '60' }]} />
                </View>
                <Text style={[S.forecastBarLabel, { color: Colors.red }]} numberOfLines={1}>-{m.downside_pct.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Totals summary table */}
      <View style={S.listCard}>
        {[
          { l: '3-Month expected',  v: fmtLyd(data.forecast_total_base_lyd),        c: Colors.text },
          { l: 'Best case (P90)',   v: fmtLyd(data.forecast_total_optimistic_lyd),   c: Colors.green },
          { l: 'Worst case (P10)',  v: fmtLyd(data.forecast_total_pessimistic_lyd),  c: Colors.red },
        ].map(({ l, v, c }) => (
          <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
            <Text style={S.expandText}>{l}</Text>
            <Text style={[S.rowTitle, { color: c }]}>{v}</Text>
          </View>
        ))}
      </View>

      {data.primary_risk ? (
        <View style={[S.actionBox, { borderColor: Colors.amber + '30', backgroundColor: Colors.amber + '08', marginTop: 12 }]}>
          <Text style={[S.actionLabel, { color: Colors.amber }]}>Primary risk</Text>
          <Text style={S.expandText}>{data.primary_risk}</Text>
        </View>
      ) : null}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar + Main screen
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'critical',  label: 'Risk',      icon: 'shield-alert', color: Colors.red },
  { key: 'kpis',      label: 'KPIs',      icon: 'bar-chart',    color: Colors.blue },
  { key: 'anomalies', label: 'Anomalies', icon: 'flash',        color: Colors.amber },
  { key: 'seasonal',  label: 'Seasonal',  icon: 'calendar',     color: Colors.teal },
  { key: 'churn',     label: 'Churn',     icon: 'people',       color: Colors.violet },
  { key: 'stock',     label: 'Stock',     icon: 'cube',         color: Colors.blue },
  { key: 'forecast',  label: 'Forecast',  icon: 'trending-up',  color: Colors.green },
] as const;

export function AIInsightsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('critical');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient colors={[Colors.navy2, Colors.navy3]} style={S.pageHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={S.pageHeaderContent}>
          <View style={S.pageHeaderIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View>
            <Text style={S.pageHeaderSub}>WEEG AI</Text>
            <Text style={S.pageHeaderTitle}>Intelligent Analysis</Text>
          </View>
        </View>
        <View style={S.liveChip}>
          <View style={S.liveDot} />
          <Text style={S.liveText}>Live context</Text>
        </View>
      </LinearGradient>

      <View style={S.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabBar}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[S.tabItem, active && { backgroundColor: tab.color + '15', borderColor: tab.color + '40' }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon as any} size={14} color={active ? tab.color : Colors.text3} />
                <Text style={[S.tabLabel, active && { color: tab.color, fontWeight: '700' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'critical'  && <CriticalTab />}
        {activeTab === 'kpis'      && <KPIsTab />}
        {activeTab === 'anomalies' && <AnomaliesTab />}
        {activeTab === 'seasonal'  && <SeasonalTab />}
        {activeTab === 'churn'     && <ChurnTab />}
        {activeTab === 'stock'     && <StockTab />}
        {activeTab === 'forecast'  && <ForecastTab />}
      </View>

      <TouchableOpacity style={S.chatFab} onPress={() => navigation?.navigate?.('AIChat')}>
        <LinearGradient colors={[Colors.blue, Colors.violet]} style={S.chatFabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          <Text style={S.chatFabText}>Ask AI</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  pageHeader:        { paddingTop: 18, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageHeaderIcon:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  pageHeaderSub:     { fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },
  pageHeaderTitle:   { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  liveChip:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  liveText:          { fontSize: 11, fontWeight: '600', color: Colors.green },

  tabBarWrap: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBar:     { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tabItem:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', backgroundColor: Colors.bg },
  tabLabel:   { fontSize: 12, fontWeight: '600', color: Colors.text3 },
  tabBody:    { flex: 1, padding: 16 },

  listCard:   { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  chartCard:  { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  skCard:     { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, marginBottom: 10 },
  skLine:     { height: 12, borderRadius: 4, backgroundColor: Colors.bg },

  rowHeader:  { flexDirection: 'row', alignItems: 'flex-start' },
  rowTitle:   { fontSize: 13, fontWeight: '700', color: Colors.text },
  rowSub:     { fontSize: 11, color: Colors.text3, marginTop: 2 },
  rankNum:    { fontSize: 11, fontWeight: '700', color: Colors.text3, width: 22, marginTop: 1 },
  expandBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: Colors.border },
  expandText: { fontSize: 12.5, color: Colors.text2, lineHeight: 18 },

  badge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  confTag:   { fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },

  riskBanner:    { borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, marginBottom: 16 },
  riskBannerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  riskIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  riskBriefing:  { fontSize: 12.5, color: Colors.text2, lineHeight: 18, marginTop: 8 },
  riskExposure:  { fontSize: 12, fontWeight: '700', color: Colors.red },
  riskStats:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' },
  riskStat:      { alignItems: 'center' },
  riskStatN:     { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  riskStatL:     { fontSize: 10, color: Colors.text3, marginTop: 1 },

  actionBox:   { borderRadius: 10, padding: 12, borderWidth: 1 },
  actionLabel: { fontSize: 10.5, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase' },
  actionText:  { fontSize: 12.5, lineHeight: 18 },
  actionRow:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  actionDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },

  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metaChipText: { fontSize: 11, fontWeight: '600' },

  healthCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, ...Shadow.sm },
  healthRing:  { width: 72, height: 72, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  healthScore: { fontSize: 18, fontWeight: '800' },
  healthLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },

  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  kpiCard:      { width: (width - 32 - 8) / 2, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, borderWidth: 1, borderColor: Colors.border },
  kpiTop:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  kpiDot:       { width: 7, height: 7, borderRadius: 4 },
  kpiLabel:     { fontSize: 11, color: Colors.text3, flex: 1 },
  kpiValue:     { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  kpiDelta:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kpiDeltaText: { fontSize: 10, fontWeight: '700' },
  kpiSource:    { fontSize: 10, color: Colors.text3, marginTop: 6 },
  prioCircle:   { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  prioText:     { fontSize: 11, fontWeight: '700' },

  anomalyMetaRow: { flexDirection: 'row', gap: 12, marginVertical: 6 },
  anomalyMeta:    { fontSize: 11, color: Colors.text3 },
  bulletItem:     { fontSize: 12.5, color: Colors.text2, marginLeft: 8, marginBottom: 4, lineHeight: 18 },

  seasonPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  seasonPillText: { fontSize: 12, fontWeight: '600' },
  trendRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, padding: 12, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, ...Shadow.sm },
  trendText:      { fontSize: 12.5, color: Colors.text2 },
  siGrid:         { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 2, marginBottom: 4, backgroundColor: Colors.surface, padding: 12, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border },
  siBar:          { flex: 1, alignItems: 'center' },
  siBarTrack:     { flex: 1, width: '100%', backgroundColor: Colors.bg, borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  siBarFill:      { width: '100%', borderRadius: 3 },
  siBarLabel:     { fontSize: 9, marginTop: 4, textAlign: 'center' },
  peakRow:        { flexDirection: 'row', gap: 10, marginTop: 12 },
  peakBox:        { flex: 1, borderRadius: BorderRadius.lg, padding: 12, borderWidth: 1, gap: 4 },
  peakLabel:      { fontSize: 10.5, fontWeight: '700' },
  peakValue:      { fontSize: 12.5, fontWeight: '600', color: Colors.text },
  narrativeCard:  { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 14, borderWidth: 1, borderColor: Colors.border, marginTop: 12 },
  narrativeLabel: { fontSize: 10.5, fontWeight: '700', color: Colors.text3, marginBottom: 6 },

  scoreBar: { height: 4, borderRadius: 2 },

  statGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCell: { flex: 1, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center' },
  statN:    { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  statL:    { fontSize: 10, color: Colors.text3, marginTop: 2, textAlign: 'center' },

  miniStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniStat:     { width: '47%', backgroundColor: Colors.bg, borderRadius: 8, padding: 10 },
  miniStatL:    { fontSize: 10, color: Colors.text3, marginBottom: 2 },
  miniStatV:    { fontSize: 13, fontWeight: '700', color: Colors.text },

  classTag:            { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  classTagText:        { fontSize: 12, fontWeight: '800' },
  filterRow:           { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterChip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  filterChipActive:    { backgroundColor: Colors.blue, borderColor: Colors.blue },
  filterChipText:      { fontSize: 12, fontWeight: '600', color: Colors.text3 },
  filterChipTextActive:{ color: '#fff' },

  forecastRow:      { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  forecastPeriod:   { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  forecastBarRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, width: '100%' },
  forecastBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bg, overflow: 'hidden' },
  forecastBarFill:  { height: 6, borderRadius: 3 },
  forecastBarLabel: { fontSize: 10, color: Colors.text2, width: 72, textAlign: 'right' },

  summaryPill:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  summaryPillText: { fontSize: 12, fontWeight: '700' },

  errBox:    { alignItems: 'center', padding: 40, gap: 12 },
  errText:   { fontSize: 13, color: Colors.text2, textAlign: 'center', maxWidth: 260 },
  retryBtn:  { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  retryText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  emptyBox:  { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.text3 },

  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },

  chatFab:     { position: 'absolute', bottom: 24, right: 20 },
  chatFabGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 28, ...Shadow.xl },
  chatFabText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});