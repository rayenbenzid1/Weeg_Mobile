// AgingScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { agingReceivables } from '../../lib/mockData';

const getAgingStatus = (days: number) => {
  if (days === 0) return { label: 'Current', color: Colors.success, bg: Colors.green100 };
  if (days <= 30) return { label: '0-30 days', color: Colors.success, bg: Colors.green100 };
  if (days <= 60) return { label: '31-60 days', color: Colors.warning, bg: Colors.yellow100 };
  if (days <= 90) return { label: '61-90 days', color: Colors.orange500, bg: '#fff7ed' };
  return { label: '90+ days', color: Colors.danger, bg: Colors.red100 };
};

export function AgingScreen() {
  const [selectedRange, setSelectedRange] = useState('all');

  const totalOutstanding = agingReceivables.reduce((s, a) => s + a.remainingBalance, 0);
  const overdue = agingReceivables.filter(a => a.daysOverdue > 0);

  const ranges = [
    { key: 'all', label: 'All' },
    { key: '0-30', label: '0-30 days' },
    { key: '31-60', label: '31-60 days' },
    { key: '61-90', label: '61-90 days' },
    { key: '90+', label: '90+ days' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Aging Receivables</Text>
          <Text style={styles.pageSubtitle}>Track overdue payments and customer balances</Text>
        </View>

        {/* Summary */}
        <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryValue}>${totalOutstanding.toLocaleString()}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{overdue.length}</Text>
              <Text style={styles.summaryItemLabel}>Overdue</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{agingReceivables.length}</Text>
              <Text style={styles.summaryItemLabel}>Total Accounts</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>32</Text>
              <Text style={styles.summaryItemLabel}>Avg Days</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Range Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {ranges.map(r => (
            <TouchableOpacity key={r.key} onPress={() => setSelectedRange(r.key)} style={{ marginRight: 8 }}>
              {selectedRange === r.key ? (
                <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.rangeActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.rangeActiveText}>{r.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.rangeInactive}>
                  <Text style={styles.rangeInactiveText}>{r.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Receivables List */}
        {agingReceivables.map(ar => {
          const status = getAgingStatus(ar.daysOverdue);
          const paidPct = ar.totalAmount > 0 ? (ar.paidAmount / ar.totalAmount * 100) : 100;
          return (
            <View key={ar.id} style={[styles.arCard, Shadow.sm]}>
              <View style={styles.arHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.arCustomer}>{ar.customer}</Text>
                  <Text style={styles.arInvoice}>{ar.invoiceNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={ar.daysOverdue > 60 ? [Colors.danger, '#b91c1c'] : ar.daysOverdue > 30 ? [Colors.warning, Colors.orange500] : [Colors.success, '#16a34a']}
                    style={[styles.progressFill, { width: `${paidPct}%` as any }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressLabel}>{paidPct.toFixed(0)}% paid</Text>
              </View>

              <View style={styles.arDetails}>
                <View style={styles.arDetail}>
                  <Text style={styles.arDetailLabel}>Total</Text>
                  <Text style={styles.arDetailValue}>${ar.totalAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.arDetail}>
                  <Text style={styles.arDetailLabel}>Paid</Text>
                  <Text style={[styles.arDetailValue, { color: Colors.success }]}>${ar.paidAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.arDetail}>
                  <Text style={styles.arDetailLabel}>Balance</Text>
                  <Text style={[styles.arDetailValue, { color: ar.remainingBalance > 0 ? Colors.danger : Colors.success }]}>${ar.remainingBalance.toLocaleString()}</Text>
                </View>
                <View style={styles.arDetail}>
                  <Text style={styles.arDetailLabel}>Days</Text>
                  <Text style={[styles.arDetailValue, { color: status.color }]}>{ar.daysOverdue > 0 ? `+${ar.daysOverdue}` : 'Current'}</Text>
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
  summaryCard: { borderRadius: BorderRadius['2xl'], padding: 20, marginBottom: 20 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 36, fontWeight: '900', color: Colors.white, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemValue: { fontSize: 20, fontWeight: '800', color: Colors.white },
  summaryItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  rangeActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  rangeActiveText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  rangeInactive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200 },
  rangeInactiveText: { fontSize: 12, fontWeight: '500', color: Colors.gray600 },
  arCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.gray100 },
  arHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  arCustomer: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  arInvoice: { fontSize: 11, color: Colors.gray500, marginTop: 3, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.gray100, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.gray500, width: 60, textAlign: 'right' },
  arDetails: { flexDirection: 'row', gap: 8 },
  arDetail: { flex: 1, alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, padding: 8 },
  arDetailLabel: { fontSize: 10, color: Colors.gray400, marginBottom: 2 },
  arDetailValue: { fontSize: 13, fontWeight: '700', color: Colors.foreground },
});
