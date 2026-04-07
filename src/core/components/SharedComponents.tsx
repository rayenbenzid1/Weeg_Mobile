/**
 * SharedComponents.tsx — Reusable UI primitives for WEEG v2
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadow, getRiskColor, getRiskBg } from '../constants/theme';

// ─── Risk / Status Pills ───────────────────────────────────────────────────────

export function RiskPill({ risk }: { risk: string }) {
  const color = getRiskColor(risk);
  const bg    = getRiskBg(risk);
  return (
    <View style={[pill.wrap, { backgroundColor: bg }]}>
      <View style={[pill.dot, { backgroundColor: color }]} />
      <Text style={[pill.label, { color }]}>{risk.toUpperCase()}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:  { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:BorderRadius.full },
  dot:   { width:5, height:5, borderRadius:3 },
  label: { fontSize:9.5, fontWeight:'700', letterSpacing:0.3 },
});

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string,string> = { active:'#10b981', approved:'#10b981', pending:'#f59e0b', suspended:'#e83535', rejected:'#e83535' };
  const c = colors[status] || '#8492a6';
  return <View style={{ width:7, height:7, borderRadius:4, backgroundColor:c }} />;
}

// ─── Branch Tag ────────────────────────────────────────────────────────────────

export function BranchTag({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor:'rgba(26,92,240,0.08)', paddingHorizontal:6, paddingVertical:2, borderRadius:5 }}>
      <Text style={{ fontSize:9.5, fontWeight:'600', color:Colors.blue }}>{label}</Text>
    </View>
  );
}

// ─── Search Bar ────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  style?: object;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…', style }: SearchBarProps) {
  return (
    <View style={[sb.wrap, style]}>
      <Ionicons name="search-outline" size={15} color={Colors.text3} />
      <TextInput
        style={sb.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text3}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={sb.clearBtn}>
          <Ionicons name="close-circle" size={16} color={Colors.text3} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:Colors.surface, borderRadius:BorderRadius.lg, borderWidth:1, borderColor:Colors.border, paddingHorizontal:14, height:44 },
  input:    { flex:1, fontSize:13, color:Colors.text },
  clearBtn: { padding:2 },
});

// ─── Filter Chip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function FilterChip({ label, active, onPress, icon }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[fc.chip, active && fc.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons name={icon} size={11} color={active ? '#fff' : Colors.text3} />
      )}
      <Text style={[fc.label, active && fc.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  chip:        { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:BorderRadius.full, borderWidth:1, borderColor:Colors.border2, backgroundColor:Colors.surface2 },
  chipActive:  { backgroundColor:Colors.blue, borderColor:Colors.blue },
  label:       { fontSize:11.5, fontWeight:'500', color:Colors.text2 },
  labelActive: { color:'#fff', fontWeight:'600' },
});

// ─── Section Header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <Text style={{ fontSize:13, fontWeight:'700', color:Colors.text2, letterSpacing:0.5, textTransform:'uppercase' }}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize:11, fontWeight:'600', color:Colors.blue }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Page Header (dark gradient) ──────────────────────────────────────────────

export function PageHeader({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <LinearGradient
      colors={[Colors.navy2, Colors.navy3]}
      style={ph.wrap}
      start={{ x:0, y:0 }}
      end={{ x:1, y:1 }}
    >
      {label && <Text style={ph.label}>{label}</Text>}
      <Text style={ph.title}>{title}</Text>
      {subtitle && <Text style={ph.sub}>{subtitle}</Text>}
    </LinearGradient>
  );
}

const ph = StyleSheet.create({
  wrap:  { padding:20, paddingTop:18, paddingBottom:16 },
  label: { fontSize:9.5, fontWeight:'700', color:'rgba(255,255,255,0.4)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  title: { fontSize:22, fontWeight:'700', color:'#fff', letterSpacing:-0.5 },
  sub:   { fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 },
});

// ─── Summary Strip ─────────────────────────────────────────────────────────────

export function SummaryStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={ss.wrap}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={ss.divider} />}
          <View style={ss.item}>
            <Text style={ss.val}>{item.value}</Text>
            <Text style={ss.lbl}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const ss = StyleSheet.create({
  wrap:    { flexDirection:'row', backgroundColor:Colors.navy2, marginHorizontal:16, marginBottom:12, borderRadius:BorderRadius.xl, padding:12, ...Shadow.md },
  item:    { flex:1, alignItems:'center' },
  val:     { fontSize:15, fontWeight:'700', color:'#fff' },
  lbl:     { fontSize:9.5, color:'rgba(255,255,255,0.5)', fontWeight:'600', marginTop:2, letterSpacing:0.3 },
  divider: { width:1, backgroundColor:'rgba(255,255,255,0.1)' },
});

// ─── Mini KPI Card ─────────────────────────────────────────────────────────────

export function MiniKpi({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[mk.wrap, { borderTopColor: color }]}>
      <Text style={mk.val}>{value}</Text>
      <Text style={mk.lbl}>{label}</Text>
    </View>
  );
}

const mk = StyleSheet.create({
  wrap: { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:12, paddingBottom:15,marginBottom:15, borderWidth:1, borderColor:Colors.border, minWidth:100, borderTopWidth:3 ,minHeight:56 },
  val:  { fontSize:16, fontWeight:'700', color:Colors.text, marginBottom:3 },
  lbl:  { fontSize:9.5, color:Colors.text3, fontWeight:'600' },
});

// ─── Primary Button ────────────────────────────────────────────────────────────

export function PrimaryButton({
  label, onPress, loading, icon, style,
}: {
  label: string; onPress: () => void; loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; style?: object;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} style={style}>
      <LinearGradient
        colors={loading ? [Colors.text3, Colors.text3] : [Colors.blue, Colors.blue2]}
        style={pb.btn}
        start={{ x:0, y:0 }}
        end={{ x:1, y:0 }}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : (
            <>
              {icon && <Ionicons name={icon} size={16} color="#fff" />}
              <Text style={pb.label}>{label}</Text>
            </>
          )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const pb = StyleSheet.create({
  btn:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, borderRadius:BorderRadius.xl },
  label: { fontSize:14, fontWeight:'700', color:'#fff' },
});

// ─── Form Field ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  editable?: boolean;
  keyboardType?: any;
  error?: string;
  autoCapitalize?: any;
}

export function FormField({
  label, value, onChangeText, placeholder, icon,
  secure, showSecure, onToggleSecure, editable = true,
  keyboardType, error, autoCapitalize,
}: FormFieldProps) {
  return (
    <View style={ff.group}>
      <Text style={ff.label}>{label}</Text>
      <View style={[ff.wrap, !editable && ff.disabled, !!error && ff.errWrap]}>
        {icon && <Ionicons name={icon} size={15} color={Colors.text3} style={{ marginRight:4 }} />}
        <TextInput
          style={ff.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text3}
          secureTextEntry={secure && !showSecure}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
        />
        {secure && onToggleSecure && (
          <TouchableOpacity onPress={onToggleSecure} style={{ padding:4 }}>
            <Ionicons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.text3} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={ff.err}>{error}</Text>}
    </View>
  );
}

const ff = StyleSheet.create({
  group:   { marginBottom:14 },
  label:   { fontSize:11, fontWeight:'700', color:Colors.text3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:6 },
  wrap:    { flexDirection:'row', alignItems:'center', gap:10, borderWidth:1.5, borderColor:Colors.border, borderRadius:BorderRadius.lg, paddingHorizontal:14, height:48, backgroundColor:Colors.surface2 },
  disabled:{ opacity:0.6 },
  errWrap: { borderColor:Colors.red },
  input:   { flex:1, fontSize:14, color:Colors.text },
  err:     { fontSize:10.5, color:Colors.red, marginTop:4 },
});

// ─── Success / Error Banner ────────────────────────────────────────────────────

export function AlertBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isSuccess = type === 'success';
  return (
    <View style={[ab.wrap, isSuccess ? ab.success : ab.error]}>
      <Ionicons
        name={isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={16}
        color={isSuccess ? Colors.green : Colors.red}
      />
      <Text style={[ab.text, { color: isSuccess ? Colors.greenText : Colors.redText }]}>{message}</Text>
    </View>
  );
}

const ab = StyleSheet.create({
  wrap:    { flexDirection:'row', alignItems:'center', gap:8, borderRadius:BorderRadius.lg, padding:12, marginBottom:14 },
  success: { backgroundColor:Colors.greenBg, borderWidth:1, borderColor:'rgba(16,185,129,0.3)' },
  error:   { backgroundColor:Colors.redBg,   borderWidth:1, borderColor:'rgba(232,53,53,0.2)' },
  text:    { flex:1, fontSize:12, fontWeight:'600' },
});

// ─── Empty State ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems:'center', paddingVertical:40, paddingHorizontal:20 }}>
      <View style={{ width:64, height:64, borderRadius:20, backgroundColor:Colors.surface2, alignItems:'center', justifyContent:'center', marginBottom:14, borderWidth:1, borderColor:Colors.border }}>
        <Ionicons name={icon} size={28} color={Colors.text3} />
      </View>
      <Text style={{ fontSize:14, fontWeight:'700', color:Colors.text2, marginBottom:5 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize:12, color:Colors.text3, textAlign:'center', lineHeight:18 }}>{subtitle}</Text>}
    </View>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({
  name, size = 42, colors: gradColors,
}: {
  name: string; size?: number; colors?: [string, string];
}) {
  const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  const gc: [string, string] = gradColors || [Colors.blue, Colors.purple];
  const radius = Math.round(size * 0.3);
  return (
    <LinearGradient
      colors={gc}
      style={{ width:size, height:size, borderRadius:radius, alignItems:'center', justifyContent:'center' }}
      start={{ x:0, y:0 }}
      end={{ x:1, y:1 }}
    >
      <Text style={{ fontSize: Math.round(size * 0.33), fontWeight:'700', color:'#fff' }}>{initials}</Text>
    </LinearGradient>
  );
}