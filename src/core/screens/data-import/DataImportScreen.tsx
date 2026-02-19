import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const templates = [
  { title: 'Sales Template', desc: 'Import sales transactions and invoices' },
  { title: 'Purchases Template', desc: 'Import purchase orders and supplier invoices' },
  { title: 'Stock Movements Template', desc: 'Import inventory movements and transfers' },
  { title: 'Customer Balances Template', desc: 'Import customer account balances' },
  { title: 'Exchange Rates Template', desc: 'Import currency exchange rates' },
];

const pipeline = [
  { label: 'Excel File', icon: 'document-outline', color: '#3b82f6' },
  { label: 'Validation', icon: 'checkmark-circle-outline', color: '#22c55e' },
  { label: 'Database Storage', icon: 'arrow-up-circle-outline', color: '#7c3aed' },
  { label: 'KPI Engine', icon: 'arrow-up-circle-outline', color: '#4f46e5' },
  { label: 'Dashboard Update', icon: 'arrow-up-circle-outline', color: '#ea580c' },
  { label: 'Smart Alerts', icon: 'alert-circle-outline', color: '#dc2626' },
];

const recentImports = [
  { name: 'sales_january_2026.xlsx', type: 'Sales', date: '2026-01-15', rows: 1247, status: 'success' },
  { name: 'purchases_q4_2025.xlsx', type: 'Purchases', date: '2025-12-31', rows: 389, status: 'success' },
  { name: 'stock_movements_dec.xlsx', type: 'Stock', date: '2025-12-28', rows: 756, status: 'error' },
];

export function DataImportScreen() {
  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      <View style={st.content}>
        <Text style={st.title}>Data Import Center</Text>
        <Text style={st.subtitle}>Upload Excel files to import your business data</Text>

        {/* Upload Zone */}
        <View style={[st.card, { marginBottom: 16 }]}>
          <Text style={st.cardTitle}>Upload File</Text>
          <Text style={st.cardSub}>Drag and drop your Excel file or click to browse</Text>
          <TouchableOpacity style={st.dropZone} onPress={() => Alert.alert('Browse', 'File picker would open here')} activeOpacity={0.8}>
            <View style={st.uploadIconCircle}>
              <Ionicons name="arrow-up-outline" size={26} color={Colors.indigo600} />
            </View>
            <Text style={st.dropTitle}>Drop your Excel file here</Text>
            <Text style={st.dropSub}>or click to browse (max 10MB, .xlsx only)</Text>
            <TouchableOpacity onPress={() => Alert.alert('Browse', 'File picker would open here')}>
              <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={st.browseBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={st.browseBtnTxt}>Browse Files</Text>
              </LinearGradient>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Download Templates */}
        <View style={[st.card, { marginBottom: 16 }]}>
          <Text style={st.cardTitle}>Download Templates</Text>
          <Text style={st.cardSub}>Download Excel templates for different data types</Text>
          <View style={st.templatesGrid}>
            {templates.map((t, i) => (
              <View key={i} style={[st.templateCard, Shadow.sm]}>
                <View style={st.templateIcon}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.indigo600} />
                </View>
                <Text style={st.templateTitle}>{t.title}</Text>
                <Text style={st.templateDesc}>{t.desc}</Text>
                <TouchableOpacity style={st.dlBtn} onPress={() => Alert.alert('Download', `${t.title} downloading...`)}>
                  <Ionicons name="download-outline" size={13} color={Colors.indigo600} />
                  <Text style={st.dlTxt}>Download</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Pipeline */}
        <View style={[st.card, { marginBottom: 16 }]}>
          <Text style={st.cardTitle}>Data Processing Pipeline</Text>
          <Text style={st.cardSub}>How your data flows through the system</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={st.pipeline}>
              {pipeline.map((step, i) => (
                <View key={i} style={st.pipeStep}>
                  <View style={[st.pipeCircle, { borderColor: step.color + '40', backgroundColor: step.color + '15' }]}>
                    <Ionicons name={step.icon as any} size={22} color={step.color} />
                  </View>
                  <Text style={st.pipeLabel}>{step.label}</Text>
                  {i < pipeline.length - 1 && <Text style={st.pipeArrow}>→</Text>}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Imports */}
        <View style={[st.card, { marginBottom: 16 }]}>
          <Text style={st.cardTitle}>Recent Imports</Text>
          <Text style={st.cardSub}>Last imported files and their status</Text>
          {recentImports.map((imp, i) => (
            <View key={i} style={st.importRow}>
              <View style={[st.importDot, { backgroundColor: imp.status === 'success' ? '#dcfce7' : '#fee2e2' }]}>
                <Ionicons name={imp.status === 'success' ? 'checkmark-circle' : 'close-circle'} size={16} color={imp.status === 'success' ? '#16a34a' : '#dc2626'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.importName} numberOfLines={1}>{imp.name}</Text>
                <Text style={st.importMeta}>{imp.type} · {imp.date} · {imp.rows.toLocaleString()} rows</Text>
              </View>
              <View style={[st.importBadge, { backgroundColor: imp.status === 'success' ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[st.importBadgeTxt, { color: imp.status === 'success' ? '#16a34a' : '#dc2626' }]}>
                  {imp.status === 'success' ? 'Success' : 'Error'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  content: { padding: Spacing.base, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.gray500, marginBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground, marginBottom: 2 },
  cardSub: { fontSize: 12, color: Colors.gray500, marginBottom: 14 },
  dropZone: { borderWidth: 2, borderColor: Colors.gray200, borderStyle: 'dashed', borderRadius: BorderRadius.xl, padding: 36, alignItems: 'center', backgroundColor: Colors.gray50 },
  uploadIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.indigo50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dropTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground, marginBottom: 4 },
  dropSub: { fontSize: 12, color: Colors.gray500, textAlign: 'center', marginBottom: 16 },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: BorderRadius.lg },
  browseBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  templateCard: { width: '47%', backgroundColor: Colors.gray50, borderRadius: BorderRadius.xl, padding: 14, borderWidth: 1, borderColor: Colors.gray100 },
  templateIcon: { width: 38, height: 38, borderRadius: BorderRadius.lg, backgroundColor: Colors.indigo50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  templateTitle: { fontSize: 12, fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  templateDesc: { fontSize: 10, color: Colors.gray500, lineHeight: 15, marginBottom: 10 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dlTxt: { fontSize: 12, color: Colors.indigo600, fontWeight: '600' },
  pipeline: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 4 },
  pipeStep: { alignItems: 'center', width: 76, position: 'relative' },
  pipeCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 6 },
  pipeLabel: { fontSize: 9, color: Colors.gray600, textAlign: 'center', fontWeight: '500' },
  pipeArrow: { position: 'absolute', right: -10, top: 15, fontSize: 16, color: Colors.gray400 },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  importDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  importName: { fontSize: 13, fontWeight: '600', color: Colors.foreground },
  importMeta: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
  importBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  importBadgeTxt: { fontSize: 11, fontWeight: '700' },
});
