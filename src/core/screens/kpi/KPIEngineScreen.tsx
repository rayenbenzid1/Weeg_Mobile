import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { branches, products } from '../../lib/mockData';

const { width } = Dimensions.get('window');

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ label, value, options, onChange }: any) {
  const [open, setOpen] = useState(false);
  const sel = options.find((o: any) => o.value === value);
  return (
    <View style={{ flex: 1 }}>
      <Text style={sel2.label}>{label}</Text>
      <TouchableOpacity style={sel2.box} onPress={() => setOpen(true)}>
        <Text style={sel2.val} numberOfLines={1}>{sel?.label}</Text>
        <Ionicons name="chevron-down" size={13} color={Colors.gray500} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={sel2.backdrop} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={sel2.sheet}>
            <Text style={sel2.sheetTitle}>{label}</Text>
            {options.map((o: any) => (
              <TouchableOpacity key={o.value} style={sel2.opt} onPress={() => { onChange(o.value); setOpen(false); }}>
                <Text style={[sel2.optTxt, o.value === value && { color: Colors.indigo600, fontWeight: '700' }]}>{o.label}</Text>
                {o.value === value && <Ionicons name="checkmark" size={16} color={Colors.indigo600} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const sel2 = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: Colors.gray600, marginBottom: 4 },
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.gray200, borderRadius: BorderRadius.lg, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: Colors.white },
  val: { fontSize: 12, color: Colors.foreground, flex: 1, marginRight: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: Colors.white, borderRadius: 20, padding: 16 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground, marginBottom: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  optTxt: { fontSize: 14, color: Colors.foreground },
});

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ color = Colors.indigo600 }: { color?: string }) {
  const pts = [30, 45, 35, 50, 38, 55, 45, 60, 50, 65, 55, 70];
  const W2 = (width - Spacing.base * 2 - 32) / 3 - 20;
  const H = 40;
  const max = Math.max(...pts); const min = Math.min(...pts);
  const px = (i: number) => (i / (pts.length - 1)) * W2;
  const py = (v: number) => H - ((v - min) / (max - min + 1)) * H;
  return (
    <View style={{ height: H, width: W2, position: 'relative', marginTop: 8 }}>
      {pts.map((v, i) => {
        if (i === 0) return null;
        const x1 = px(i - 1); const y1 = py(pts[i - 1]);
        const x2 = px(i); const y2 = py(v);
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return <View key={i} style={{ position: 'absolute', left: x1, top: y1, width: len, height: 1.5, backgroundColor: color, transform: [{ rotate: `${angle}deg` }], transformOrigin: '0 50%' }} />;
      })}
    </View>
  );
}

// ── KPI Tile (3-column) ───────────────────────────────────────────────────────
function KpiTile({ icon, label, value, trend, hasSparkline }: any) {
  const trendColor = trend?.startsWith('+') ? '#16a34a' : trend?.startsWith('-') ? '#dc2626' : Colors.gray500;
  return (
    <View style={[tile.card, Shadow.sm]}>
      <View style={tile.top}>
        <View style={tile.iconBox}><Ionicons name={icon} size={18} color={Colors.indigo600} /></View>
        {trend && <Text style={[tile.trend, { color: trendColor }]}>{trend.startsWith('+') ? '↑' : '↓'} {trend.replace(/[+-]/, '')}</Text>}
      </View>
      <Text style={tile.label}>{label}</Text>
      <Text style={tile.value}>{value}</Text>
      {hasSparkline && <Sparkline />}
    </View>
  );
}
const TILE_W = (width - Spacing.base * 2 - 16) / 3;
const tile = StyleSheet.create({
  card: { width: TILE_W, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 12, borderWidth: 1, borderColor: Colors.gray100 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 32, height: 32, borderRadius: BorderRadius.lg, backgroundColor: Colors.indigo50, alignItems: 'center', justifyContent: 'center' },
  trend: { fontSize: 10, fontWeight: '700' },
  label: { fontSize: 10, color: Colors.gray500, marginBottom: 4 },
  value: { fontSize: 13, fontWeight: '800', color: Colors.foreground },
});

// ── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({ rank, name, sku, revenue, units, margin, rotation, avgPrice }: any) {
  return (
    <View style={[pr.row, Shadow.sm]}>
      <View style={pr.rankBadge}><Text style={pr.rankTxt}>{rank}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={pr.name}>{name}</Text>
            <Text style={pr.sku}>{sku}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={pr.revenue}>${revenue.toLocaleString()}</Text>
            <Text style={pr.units}>{units} units</Text>
          </View>
        </View>
        <View style={pr.tags}>
          <View style={pr.tag}><Text style={pr.tagTxt}>Margin: {margin}%</Text></View>
          <View style={pr.tag}><Text style={pr.tagTxt}>Rotation: {rotation}x</Text></View>
          <View style={pr.tag}><Text style={pr.tagTxt}>Avg Price: ${avgPrice}</Text></View>
        </View>
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: 10, borderWidth: 1, borderColor: Colors.gray100 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.indigo50, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rankTxt: { fontSize: 13, fontWeight: '800', color: Colors.indigo600 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  sku: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
  revenue: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  units: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: Colors.gray100, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontSize: 10, color: Colors.gray600 },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export function KPIEngineScreen() {
  const [period, setPeriod] = useState('12m');
  const [branch, setBranch] = useState('all');
  const [product, setProduct] = useState('all');

  const periodOpts = [
    { label: 'Last Month', value: '1m' },
    { label: 'Last 3 Months', value: '3m' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last 12 Months', value: '12m' },
    { label: 'Year to Date', value: 'ytd' },
  ];
  const branchOpts = [{ label: 'All Branches', value: 'all' }, ...branches.map(b => ({ label: b.name, value: b.id }))];
  const productOpts = [{ label: 'All Products', value: 'all' }, ...products.map(p => ({ label: p.name, value: p.id }))];

  const topProducts = [
    { rank: 1, name: 'MacBook Pro 16"', sku: 'LAP-002', revenue: 739874, units: 258, margin: 21.4, rotation: 21.50, avgPrice: 2868 },
    { rank: 2, name: 'Laptop Dell XPS 15', sku: 'LAP-001', revenue: 382748, units: 241, margin: 25.0, rotation: 5.36, avgPrice: 1588 },
    { rank: 3, name: 'LG OLED TV 55"', sku: 'TV-001', revenue: 302825, units: 205, margin: 26.6, rotation: 25.63, avgPrice: 1477 },
    { rank: 4, name: 'Samsung Galaxy S24', sku: 'PHN-002', revenue: 275453, units: 276, margin: 24.9, rotation: 4.12, avgPrice: 998 },
    { rank: 5, name: 'iPhone 15 Pro', sku: 'PHN-001', revenue: 200247, units: 170, margin: 24.9, rotation: 7.39, avgPrice: 1178 },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        <Text style={s.title}>KPI Engine</Text>
        <Text style={s.subtitle}>Automated calculation and monitoring of key performance indicators</Text>

        {/* Filters */}
        <View style={[s.card, { marginBottom: 20 }]}>
          <Text style={s.cardTitle}>Filters</Text>
          <Text style={s.cardSub}>Customize your KPI view</Text>
          <View style={s.selectRow}>
            <Select label="Period" value={period} options={periodOpts} onChange={setPeriod} />
            <Select label="Branch" value={branch} options={branchOpts} onChange={setBranch} />
            <Select label="Product" value={product} options={productOpts} onChange={setProduct} />
          </View>
        </View>

        {/* Product & Inventory KPIs */}
        <Text style={s.sectionTitle}>Product & Inventory KPIs</Text>
        <View style={s.tilesRow}>
          <KpiTile icon="trending-up-outline" label="Total Product Sales" value="$2,460,039" trend="+12.5%" hasSparkline />
          <KpiTile icon="information-circle-outline" label="Average Product Sales" value="$205,003" />
          <KpiTile icon="cube-outline" label="Stock Rotation Rate" value="21.50x" />
        </View>
        <View style={[s.tilesRow, { marginBottom: 20 }]}>
          <KpiTile icon="cash-outline" label="Total Revenue" value="$2,460,039" trend="+8.7%" hasSparkline />
          <KpiTile icon="bar-chart-outline" label="Profit Margin" value="-35.4%" trend="+3.2%" />
          <KpiTile icon="cube-outline" label="Stock Coverage" value="45 days" />
        </View>

        {/* Top Products Performance */}
        <View style={[s.card, { marginBottom: 20 }]}>
          <Text style={s.cardTitle}>Top Products Performance</Text>
          <Text style={s.cardSub}>Best performing products with detailed KPIs</Text>
          {topProducts.map((p, i) => <ProductRow key={i} {...p} />)}
        </View>

        {/* Customer KPIs */}
        <View style={[s.card, { marginBottom: 20 }]}>
          <Text style={s.cardTitle}>Customer KPIs</Text>
          <Text style={s.cardSub}>Key customer metrics and insights</Text>
          <View style={s.custGrid}>
            {[
              { label: 'Total Customers', value: '245', badge: '+12 this month', badgeColor: Colors.indigo600 },
              { label: 'Active Customers', value: '187', badge: '76%', badgeColor: Colors.indigo600 },
              { label: 'Customer Credit', value: '$134,886', badge: 'Outstanding', badgeColor: Colors.gray400 },
              { label: 'Avg Payment Delay', value: '28 days', badge: 'Within target', badgeColor: Colors.gray400 },
            ].map((item, i) => (
              <View key={i} style={s.custItem}>
                <Text style={s.custLabel}>{item.label}</Text>
                <Text style={s.custValue}>{item.value}</Text>
                <View style={[s.custBadge, { backgroundColor: item.badgeColor === Colors.gray400 ? Colors.gray100 : item.badgeColor }]}>
                  <Text style={[s.custBadgeTxt, { color: item.badgeColor === Colors.gray400 ? Colors.gray600 : Colors.white }]}>{item.badge}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  content: { padding: Spacing.base, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.gray500, marginBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground, marginBottom: 2 },
  cardSub: { fontSize: 12, color: Colors.gray500, marginBottom: 14 },
  selectRow: { flexDirection: 'row', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.foreground, marginBottom: 12 },
  tilesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  custGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  custItem: { width: '46%' },
  custLabel: { fontSize: 12, color: Colors.gray500, marginBottom: 4 },
  custValue: { fontSize: 22, fontWeight: '800', color: Colors.foreground, marginBottom: 6 },
  custBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  custBadgeTxt: { fontSize: 11, fontWeight: '600' },
});
