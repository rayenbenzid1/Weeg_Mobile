/**
 * FilterSheet.tsx — Slide-up filter modal for WEEG v2
 * Supports: risk, branch, movement type, inventory status/category
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { Colors, BorderRadius, Shadow } from '../constants/theme';

export interface FilterGroup {
  key: string;
  label: string;
  options: string[];
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply: () => void;
}

export function FilterSheet({
  visible, onClose, groups, values, onChange, onReset, onApply,
}: FilterSheetProps) {
  const hasActive = Object.values(values).some(v => v !== 'All');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={S.overlay} />
      </TouchableWithoutFeedback>

      <View style={S.sheet}>
        {/* Handle */}
        <View style={S.handle} />

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={S.closeBtn}>
            <Text style={S.closeTxt}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* Active filter count */}
        {hasActive && (
          <View style={S.activeBadge}>
            <View style={S.activeDot} />
            <Text style={S.activeTxt}>
              {Object.values(values).filter(v => v !== 'All').length} active filter(s)
            </Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {groups.map(group => (
            <View key={group.key} style={S.group}>
              <Text style={S.groupLabel}>{group.label}</Text>
              <View style={S.options}>
                {group.options.map(opt => {
                  const selected = values[group.key] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[S.option, selected && S.optionSelected]}
                      onPress={() => onChange(group.key, opt)}
                      activeOpacity={0.7}
                    >
                      {selected && <View style={S.checkDot} />}
                      <Text style={[S.optionTxt, selected && S.optionTxtSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={S.actions}>
          <TouchableOpacity style={S.btnReset} onPress={onReset}>
            <Text style={S.btnResetTxt}>Reset All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.btnApply} onPress={onApply}>
            <Text style={S.btnApplyTxt}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Active Filter Chips Row ───────────────────────────────────────────────────

interface ActiveChipsProps {
  values: Record<string, string>;
  labelMap?: Record<string, string>; // key → display label
  onClear: (key: string) => void;
}

export function ActiveFilterChips({ values, labelMap = {}, onClear }: ActiveChipsProps) {
  const active = Object.entries(values).filter(([, v]) => v !== 'All');
  if (active.length === 0) return null;
  return (
    <View style={AC.row}>
      {active.map(([key, val]) => (
        <TouchableOpacity
          key={key}
          style={AC.chip}
          onPress={() => onClear(key)}
          activeOpacity={0.7}
        >
          <Text style={AC.txt}>{labelMap[key] || key}: {val}</Text>
          <Text style={AC.x}>×</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const AC = StyleSheet.create({
  row:  { flexDirection:'row', flexWrap:'wrap', gap:6, paddingHorizontal:16, paddingTop:8 },
  chip: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:4, borderRadius:BorderRadius.full, backgroundColor:Colors.blue, },
  txt:  { fontSize:10.5, fontWeight:'600', color:'#fff' },
  x:    { fontSize:12, fontWeight:'700', color:'rgba(255,255,255,0.8)' },
});

// ─── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  overlay: {
    flex:1,
    backgroundColor:'rgba(5,13,26,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: 20,
    paddingBottom: 32,
    ...Shadow.lg,
  },
  handle: {
    width:36, height:4,
    borderRadius:2,
    backgroundColor: Colors.border2,
    alignSelf:'center',
    marginTop:12,
    marginBottom:16,
  },
  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    marginBottom:12,
  },
  title:    { fontSize:16, fontWeight:'700', color:Colors.text },
  closeBtn: { paddingHorizontal:12, paddingVertical:6, borderRadius:BorderRadius.md, backgroundColor:Colors.surface2, borderWidth:1, borderColor:Colors.border },
  closeTxt: { fontSize:12, fontWeight:'600', color:Colors.text2 },
  activeBadge: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:12, paddingHorizontal:10, paddingVertical:5, borderRadius:BorderRadius.lg, backgroundColor:'rgba(26,92,240,0.06)', alignSelf:'flex-start' },
  activeDot:   { width:6, height:6, borderRadius:3, backgroundColor:Colors.blue },
  activeTxt:   { fontSize:11, fontWeight:'600', color:Colors.blue },
  group:       { marginBottom:18 },
  groupLabel:  { fontSize:11, fontWeight:'700', color:Colors.text3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:8 },
  options:     { flexDirection:'row', flexWrap:'wrap', gap:7 },
  option:      { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:13, paddingVertical:7, borderRadius:BorderRadius.full, borderWidth:1, borderColor:Colors.border2, backgroundColor:Colors.surface2 },
  optionSelected: { backgroundColor:Colors.blue, borderColor:Colors.blue },
  checkDot:    { width:5, height:5, borderRadius:3, backgroundColor:'rgba(255,255,255,0.8)' },
  optionTxt:   { fontSize:11.5, fontWeight:'500', color:Colors.text2 },
  optionTxtSelected: { color:'#fff', fontWeight:'600' },
  actions:     { flexDirection:'row', gap:10, marginTop:16 },
  btnReset:    { flex:1, paddingVertical:12, borderRadius:BorderRadius.lg, borderWidth:1, borderColor:Colors.border2, backgroundColor:Colors.surface2, alignItems:'center' },
  btnResetTxt: { fontSize:13, fontWeight:'600', color:Colors.text2 },
  btnApply:    { flex:2, paddingVertical:12, borderRadius:BorderRadius.lg, backgroundColor:Colors.blue, alignItems:'center' },
  btnApplyTxt: { fontSize:13, fontWeight:'700', color:'#fff' },
});