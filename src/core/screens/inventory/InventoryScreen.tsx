import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { products, branches } from '../../lib/mockData';

const getStockStatus = (current: number, min: number, max: number) => {
  const pct = (current / max) * 100;
  if (pct >= 30) return 'normal';
  if (current > min) return 'low';
  return 'critical';
};

const statusConfig = {
  normal: { color: Colors.success, bg: Colors.green100, label: 'In Stock' },
  low: { color: Colors.warning, bg: Colors.yellow100, label: 'Low Stock' },
  critical: { color: Colors.danger, bg: Colors.red100, label: 'Critical' },
};

export function InventoryScreen() {
  const [selectedBranch, setSelectedBranch] = useState('all');

  const branchMetrics = branches.map(b => ({
    ...b,
    totalItems: products.length,
    lowStock: products.filter(p => getStockStatus(p.currentStock, p.minStock, p.maxStock) !== 'normal').length,
    health: Math.round(products.filter(p => getStockStatus(p.currentStock, p.minStock, p.maxStock) === 'normal').length / products.length * 100),
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Multi-Branch Inventory</Text>
          <Text style={styles.pageSubtitle}>Monitor stock levels across all branches</Text>
        </View>

        {/* Branch Cards */}
        <Text style={styles.sectionLabel}>Branch Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {branchMetrics.map(b => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setSelectedBranch(selectedBranch === b.id ? 'all' : b.id)}
              style={[styles.branchCard, selectedBranch === b.id && styles.branchCardSelected, Shadow.md]}
            >
              {selectedBranch === b.id ? (
                <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.branchCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={[styles.branchName, { color: 'white' }]}>{b.name}</Text>
                  <Text style={[styles.branchLoc, { color: 'rgba(255,255,255,0.8)' }]}>{b.location}</Text>
                  <View style={styles.branchStats}>
                    <Text style={[styles.branchStat, { color: 'white' }]}>{b.totalItems} items</Text>
                    {b.lowStock > 0 && <Text style={[styles.branchStat, { color: 'rgba(255,165,0,1)' }]}>⚠️ {b.lowStock} low</Text>}
                  </View>
                  <View style={styles.healthBar}>
                    <View style={[styles.healthFill, { width: `${b.health}%` as any, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                  </View>
                  <Text style={[styles.healthLabel, { color: 'rgba(255,255,255,0.8)' }]}>{b.health}% healthy</Text>
                </LinearGradient>
              ) : (
                <View style={styles.branchCardInner}>
                  <Text style={styles.branchName}>{b.name}</Text>
                  <Text style={styles.branchLoc}>{b.location}</Text>
                  <View style={styles.branchStats}>
                    <Text style={styles.branchStat}>{b.totalItems} items</Text>
                    {b.lowStock > 0 && <Text style={[styles.branchStat, { color: Colors.warning }]}>⚠️ {b.lowStock} low</Text>}
                  </View>
                  <View style={styles.healthBar}>
                    <LinearGradient colors={[Colors.success, '#16a34a']} style={[styles.healthFill, { width: `${b.health}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  </View>
                  <Text style={styles.healthLabel}>{b.health}% healthy</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products List */}
        <Text style={styles.sectionLabel}>Product Inventory</Text>
        {products.map(p => {
          const status = getStockStatus(p.currentStock, p.minStock, p.maxStock);
          const config = statusConfig[status];
          const pct = Math.round((p.currentStock / p.maxStock) * 100);
          return (
            <View key={p.id} style={[styles.productCard, Shadow.sm]}>
              <View style={styles.productHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.sku} · {p.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              <View style={styles.stockRow}>
                <View style={styles.stockBar}>
                  <LinearGradient
                    colors={status === 'normal' ? [Colors.success, '#16a34a'] : status === 'low' ? [Colors.warning, Colors.orange500] : [Colors.danger, '#b91c1c']}
                    style={[styles.stockFill, { width: `${Math.min(pct, 100)}%` as any }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.stockPct}>{pct}%</Text>
              </View>

              <View style={styles.stockDetails}>
                <View style={styles.stockDetail}>
                  <Text style={styles.stockDetailLabel}>Current</Text>
                  <Text style={[styles.stockDetailValue, { color: config.color }]}>{p.currentStock}</Text>
                </View>
                <View style={styles.stockDetail}>
                  <Text style={styles.stockDetailLabel}>Min</Text>
                  <Text style={styles.stockDetailValue}>{p.minStock}</Text>
                </View>
                <View style={styles.stockDetail}>
                  <Text style={styles.stockDetailLabel}>Max</Text>
                  <Text style={styles.stockDetailValue}>{p.maxStock}</Text>
                </View>
                <View style={styles.stockDetail}>
                  <Text style={styles.stockDetailLabel}>Price</Text>
                  <Text style={styles.stockDetailValue}>${p.salePrice}</Text>
                </View>
              </View>
            </View>
          );
        })}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  content: { padding: Spacing.base, paddingBottom: 32 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.foreground },
  pageSubtitle: { fontSize: 13, color: Colors.gray500, marginTop: 2 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 14 },

  branchCard: { width: 160, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100 },
  branchCardSelected: { borderColor: 'transparent' },
  branchCardInner: { padding: 16 },
  branchName: { fontSize: 14, fontWeight: '700', color: Colors.foreground, marginBottom: 2 },
  branchLoc: { fontSize: 11, color: Colors.gray500, marginBottom: 10 },
  branchStats: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  branchStat: { fontSize: 11, fontWeight: '500', color: Colors.gray600 },
  healthBar: { height: 6, borderRadius: 3, backgroundColor: Colors.gray100, overflow: 'hidden', marginBottom: 6 },
  healthFill: { height: 6, borderRadius: 3 },
  healthLabel: { fontSize: 10, color: Colors.gray500 },

  productCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.gray100 },
  productHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  productMeta: { fontSize: 11, color: Colors.gray500, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stockBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.gray100, overflow: 'hidden' },
  stockFill: { height: 8, borderRadius: 4 },
  stockPct: { fontSize: 12, fontWeight: '700', color: Colors.gray600, width: 36, textAlign: 'right' },
  stockDetails: { flexDirection: 'row', gap: 8 },
  stockDetail: { flex: 1, alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, padding: 8 },
  stockDetailLabel: { fontSize: 10, color: Colors.gray500, marginBottom: 2 },
  stockDetailValue: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
});
