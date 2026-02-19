import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { recentTransactions, salesByMonth } from '../../lib/mockData';

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function SalesScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'purchases'>('all');

  const filtered = activeTab === 'all'
    ? recentTransactions
    : recentTransactions.filter(t => t.type === activeTab.slice(0, -1) || t.type === activeTab.replace('s', '').trim() || (activeTab === 'sales' && t.type === 'sale') || (activeTab === 'purchases' && t.type === 'purchase'));

  const totalSales = recentTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total, 0);
  const totalPurchases = recentTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.total, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Sales & Purchases</Text>
          <Text style={styles.pageSubtitle}>Track all your transactions</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, Shadow.md, { borderLeftColor: Colors.success, borderLeftWidth: 4 }]}>
            <Ionicons name="trending-up-outline" size={22} color={Colors.success} style={{ marginBottom: 8 }} />
            <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
            <Text style={styles.summaryLabel}>Total Sales</Text>
          </View>
          <View style={[styles.summaryCard, Shadow.md, { borderLeftColor: Colors.indigo600, borderLeftWidth: 4 }]}>
            <Ionicons name="trending-down-outline" size={22} color={Colors.indigo600} style={{ marginBottom: 8 }} />
            <Text style={styles.summaryValue}>{formatCurrency(totalPurchases)}</Text>
            <Text style={styles.summaryLabel}>Total Purchases</Text>
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Monthly Performance</Text>
          {salesByMonth.slice(-4).map((m, i) => (
            <View key={i} style={styles.monthRow}>
              <Text style={styles.monthName}>{m.month}</Text>
              <View style={styles.monthBars}>
                <View style={styles.monthBarContainer}>
                  <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={[styles.monthBar, { width: `${(m.sales / 500000) * 100}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                </View>
              </View>
              <Text style={styles.monthValue}>${(m.sales / 1000).toFixed(0)}K</Text>
            </View>
          ))}
        </View>

        {/* Transactions Table */}
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['all', 'sales', 'purchases'] as const).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {recentTransactions.map(tx => (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txBadge, { backgroundColor: tx.type === 'sale' ? Colors.indigo100 : Colors.gray100 }]}>
                <Text style={[styles.txBadgeText, { color: tx.type === 'sale' ? Colors.indigo600 : Colors.gray600 }]}>
                  {tx.type === 'sale' ? 'Sale' : 'Purchase'}
                </Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.txProduct}>{tx.product}</Text>
                <Text style={styles.txMeta}>{tx.invoiceNumber} · {formatDate(tx.date)}</Text>
                <Text style={styles.txBranch}>{tx.branch}{tx.customer ? ` · ${tx.customer}` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txTotal, { color: tx.type === 'sale' ? Colors.success : Colors.foreground }]}>
                  {formatCurrency(tx.total)}
                </Text>
                <Text style={styles.txQty}>×{tx.quantity} @ ${tx.unitPrice}</Text>
              </View>
            </View>
          ))}
        </View>

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

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.gray100 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: Colors.gray500 },

  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 16 },

  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  monthName: { fontSize: 13, fontWeight: '600', color: Colors.gray600, width: 30 },
  monthBars: { flex: 1 },
  monthBarContainer: { height: 8, borderRadius: 4, backgroundColor: Colors.gray100, overflow: 'hidden' },
  monthBar: { height: 8, borderRadius: 4 },
  monthValue: { fontSize: 13, fontWeight: '700', color: Colors.foreground, width: 45, textAlign: 'right' },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.gray200 },
  tabActive: { backgroundColor: Colors.indigo600, borderColor: Colors.indigo600 },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.gray600 },
  tabTextActive: { color: Colors.white, fontWeight: '700' },

  txItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  txBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  txBadgeText: { fontSize: 11, fontWeight: '700' },
  txProduct: { fontSize: 13, fontWeight: '600', color: Colors.foreground },
  txMeta: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
  txBranch: { fontSize: 11, color: Colors.gray400, marginTop: 1 },
  txTotal: { fontSize: 14, fontWeight: '700' },
  txQty: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
});
