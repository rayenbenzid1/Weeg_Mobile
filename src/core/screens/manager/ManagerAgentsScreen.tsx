/**
 * ManagerAgentsScreen.tsx — WEEG v3 Premium
 * Modern dark-accent design with glassmorphism cards
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerService } from '../../lib/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy:       '#0a1628',
  navy2:      '#111f3a',
  navy3:      '#1a2d4f',
  blue:       '#1a5cf0',
  blueSoft:   'rgba(26,92,240,0.10)',
  green:      '#10b981',
  greenSoft:  'rgba(16,185,129,0.12)',
  red:        '#ef4444',
  redSoft:    'rgba(239,68,68,0.10)',
  purple:     '#8b5cf6',
  amber:      '#f59e0b',
  white:      '#ffffff',
  surface2:   '#f8fafc',
  border:     '#e2e8f0',
  border2:    '#f1f5f9',
  text:       '#0f172a',
  text2:      '#475569',
  text3:      '#94a3b8',
};

// ─── Permissions Config ───────────────────────────────────────────────────────
const PERMISSIONS_GROUPS = [
  { group: 'Data Management', icon: 'server-outline', color: T.blue, items: [
    { id: 'import-data', label: 'Import Data',  desc: 'Import Excel files' },
    { id: 'export-data', label: 'Export Data',  desc: 'Export to Excel/CSV' },
  ]},
  { group: 'Analytics & Reports', icon: 'bar-chart-outline', color: T.purple, items: [
    { id: 'view-dashboard',   label: 'View Dashboard',   desc: 'Access main dashboard with KPIs' },
    { id: 'view-reports',     label: 'View Reports',     desc: 'Access and view all reports' },
    { id: 'generate-reports', label: 'Generate Reports', desc: 'Create custom reports' },
    { id: 'view-kpi',         label: 'View KPIs',        desc: 'Access KPI engine and metrics' },
    { id: 'filter-dashboard', label: 'Filter Dashboard', desc: 'Apply filters to dashboard' },
    { id: 'ai-insights',      label: 'AI Insights',      desc: 'Access AI-powered insights' },
  ]},
  { group: 'Sales & Inventory', icon: 'cube-outline', color: T.green, items: [
    { id: 'view-sales',             label: 'View Sales',         desc: 'Access sales and purchases data' },
    { id: 'view-inventory',         label: 'View Inventory',     desc: 'Check product availability' },
    { id: 'view-customer-payments', label: 'Customer Payments',  desc: 'Access payment history' },
    { id: 'view-aging',             label: 'Aging Receivables',  desc: 'Track overdue payments' },
  ]},
  { group: 'System Access', icon: 'shield-outline', color: T.amber, items: [
    { id: 'receive-notifications', label: 'Notifications',   desc: 'Get notified about events' },
    { id: 'manage-alerts',         label: 'Manage Alerts',   desc: 'Mark alerts as resolved' },
    { id: 'view-profile',          label: 'View Profile',    desc: 'Access personal profile' },
    { id: 'change-password',       label: 'Change Password', desc: 'Update account password' },
  ]},
];

const ALL_PERMS = PERMISSIONS_GROUPS.flatMap(g => g.items.map(i => i.id));
const DEFAULT_PERMS = [
  'view-dashboard','view-reports','generate-reports','view-kpi',
  'filter-dashboard','view-sales','view-inventory','view-customer-payments',
  'receive-notifications','manage-alerts','view-profile','change-password',
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';
  const hue = ((name.charCodeAt(0) || 0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360;
  return (
    <LinearGradient
      colors={[`hsl(${hue},65%,42%)`, `hsl(${(hue + 45) % 360},75%,55%)`]}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), alignItems: 'center', justifyContent: 'center' }}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    >
      <Text style={{ fontSize: Math.round(size * 0.38), fontWeight: '800', color: '#fff', letterSpacing: 0.5 }}>{initials}</Text>
    </LinearGradient>
  );
}

// ─── Permission List ──────────────────────────────────────────────────────────
function PermList({ perms, setPerms }: { perms: string[]; setPerms: (p: string[]) => void }) {
  const toggle = (id: string) =>
    setPerms(perms.includes(id) ? perms.filter(p => p !== id) : [...perms, id]);
  const toggleGroup = (ids: string[]) => {
    const allIn = ids.every(id => perms.includes(id));
    setPerms(allIn ? perms.filter(p => !ids.includes(p)) : [...new Set([...perms, ...ids])]);
  };

  return (
    <View>
      {PERMISSIONS_GROUPS.map((group, gi) => {
        const ids    = group.items.map(i => i.id);
        const allIn  = ids.every(id => perms.includes(id));
        const someIn = ids.some(id => perms.includes(id));
        return (
          <View key={gi} style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
              onPress={() => toggleGroup(ids)} activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: group.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={group.icon as any} size={14} color={group.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.text }}>{group.group}</Text>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: allIn ? T.green : someIn ? T.amber : T.text3 }} />
              </View>
              <Text style={{ fontSize: 11, color: T.blue, fontWeight: '700' }}>{allIn ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
            {group.items.map(item => {
              const checked = perms.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[pm.row, checked && { backgroundColor: group.color + '08', borderColor: group.color + '30', borderWidth: 1 }]}
                  onPress={() => toggle(item.id)} activeOpacity={0.7}
                >
                  <View style={[pm.checkbox, checked && { backgroundColor: group.color, borderColor: group.color }]}>
                    {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: T.text }}>{item.label}</Text>
                    <Text style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const pm = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: T.surface2, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: T.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// ─── Permissions Modal ────────────────────────────────────────────────────────
function PermissionsModal({ agent, onClose, onSave }: { agent: any; onClose: () => void; onSave: (id: string, p: string[]) => Promise<void>; }) {
  const [perms, setPerms] = useState<string[]>(agent?.permissions_list || []);
  const [saving, setSaving] = useState(false);
  const pct = Math.round((perms.length / ALL_PERMS.length) * 100);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: T.surface2 }}>
        <LinearGradient colors={[T.navy, T.navy2]} style={pm2.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>PERMISSIONS</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{agent?.first_name} {agent?.last_name}</Text>
            <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{agent?.email}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ backgroundColor: T.white, padding: 16, borderBottomWidth: 1, borderBottomColor: T.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: T.text }}>{perms.length} of {ALL_PERMS.length} permissions</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: T.blue }}>{pct}%</Text>
          </View>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: T.border2, overflow: 'hidden' }}>
            <LinearGradient colors={[T.blue, T.purple]} style={{ height: 5, borderRadius: 3, width: `${pct}%` as any }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {([['Default', DEFAULT_PERMS], ['All', ALL_PERMS], ['None', []]] as [string, string[]][]).map(([label, p]) => (
              <TouchableOpacity key={label} onPress={() => setPerms(p)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.surface2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: T.text }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <PermList perms={perms} setPerms={setPerms} />
        </ScrollView>

        <View style={pm2.footer}>
          <TouchableOpacity style={pm2.cancelBtn} onPress={onClose}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: T.text2 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={saving}
            onPress={async () => { setSaving(true); await onSave(agent.id, perms); setSaving(false); onClose(); }}
            style={{ flex: 2 }}>
            <LinearGradient colors={[T.navy, T.blue]} style={pm2.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save Permissions</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pm2 = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingTop: 28, paddingBottom: 22 },
  footer:    { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.white },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
});

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, onManage }: { agent: any; onManage: (a: any) => void }) {
  const name      = agent.full_name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || '—';
  const permCount = (agent.permissions_list || []).length;
  const pct       = Math.round((permCount / ALL_PERMS.length) * 100);
  const isActive  = agent.status === 'active' || agent.status === 'approved';

  return (
    <View style={AC.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <Avatar name={name} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: T.text, letterSpacing: -0.2 }}>{name}</Text>
          <Text style={{ fontSize: 11, color: T.text3, marginTop: 2 }} numberOfLines={1}>{agent.email}</Text>
          {agent.branch_name && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={10} color={T.text3} />
              <Text style={{ fontSize: 10.5, color: T.text3 }}>{agent.branch_name}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: isActive ? T.greenSoft : T.redSoft }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isActive ? T.green : T.red }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: isActive ? T.green : T.red, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {isActive ? 'Active' : agent.status || 'active'}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 12, padding: 10, backgroundColor: T.surface2, borderRadius: 10, borderWidth: 1, borderColor: T.border2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="key-outline" size={11} color={T.blue} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: T.text2 }}>{permCount} permissions</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.blue }}>{pct}%</Text>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: T.border, overflow: 'hidden' }}>
          <LinearGradient
            colors={pct >= 80 ? [T.green, '#34d399'] : pct >= 40 ? [T.blue, T.purple] : [T.red, '#f87171']}
            style={{ height: 4, borderRadius: 2, width: `${pct}%` as any }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {agent.created_at ? (
          <Text style={{ fontSize: 10, color: T.text3 }}>
            Joined {new Date(agent.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
          </Text>
        ) : <View />}
        <TouchableOpacity onPress={() => onManage(agent)} style={AC.manageBtn} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={13} color={T.blue} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: T.blue }}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const AC = StyleSheet.create({
  card:      { backgroundColor: T.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(26,92,240,0.20)', backgroundColor: 'rgba(26,92,240,0.06)' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ManagerAgentsScreen() {
  const { updateAgentPermissions } = useAuth();
  const [agents, setAgents]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [search, setSearch]             = useState('');

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const res = await ManagerService.getAgents();
    setAgents(res.ok ? (res.data?.agents || []) : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAgents(); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadAgents(); setRefreshing(false); };

  const handleSavePermissions = async (agentId: string, perms: string[]) => {
    const r = await updateAgentPermissions(agentId, perms);
    if (r.success) {
      Alert.alert('Saved', r.message);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, permissions_list: perms } : a));
    } else {
      Alert.alert('Error', r.message);
    }
  };

  const filteredAgents = agents.filter(a => {
    if (!search) return true;
    const q    = search.toLowerCase();
    const name = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    return name.includes(q) || (a.email || '').toLowerCase().includes(q) || (a.branch_name || '').toLowerCase().includes(q);
  });

  const activeCount    = agents.filter(a => a.status === 'active' || a.status === 'approved').length;
  const suspendedCount = agents.filter(a => a.status === 'suspended').length;

  return (
    <View style={{ flex: 1, backgroundColor: T.surface2 }}>
      {editingAgent && (
        <PermissionsModal agent={editingAgent} onClose={() => setEditingAgent(null)} onSave={handleSavePermissions} />
      )}

      {/* Header */}
      <LinearGradient colors={[T.navy, T.navy2, '#1a3560']} style={TS.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <View style={{ position: 'absolute', right: 50, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(26,92,240,0.15)' }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>MANAGER</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>My Team</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Manage agent permissions</Text>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>{agents.length}</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>agents</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Total',     val: agents.length,    color: '#fff',    bg: 'rgba(255,255,255,0.12)' },
            { label: 'Active',    val: activeCount,      color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
            { label: 'Suspended', val: suspendedCount,   color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
          ].map(({ label, val, color, bg }) => (
            <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color }}>{val}</Text>
              <Text style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={{ backgroundColor: T.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: T.border }}>
          <Ionicons name="search-outline" size={16} color={T.text3} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search by name, email or branch…"
            placeholderTextColor={T.text3}
            style={{ flex: 1, fontSize: 14, color: T.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={T.text3} />
            </TouchableOpacity>
          )}
        </View>
        {search.length > 0 && (
          <Text style={{ fontSize: 11.5, color: T.text3, marginTop: 6 }}>
            {filteredAgents.length} result{filteredAgents.length !== 1 ? 's' : ''} for "{search}"
          </Text>
        )}
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.blue} />}
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: 36 }}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={T.blue} size="large" />
            <Text style={{ marginTop: 12, fontSize: 13, color: T.text3 }}>Loading agents…</Text>
          </View>
        ) : filteredAgents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: T.border2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="people-outline" size={36} color={T.text3} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.text }}>{search ? 'No agents found' : 'No agents yet'}</Text>
            <Text style={{ fontSize: 12.5, color: T.text3, marginTop: 4, textAlign: 'center' }}>
              {search ? 'Try a different search' : 'Agents assigned to you will appear here'}
            </Text>
          </View>
        ) : (
          filteredAgents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onManage={setEditingAgent} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const TS = StyleSheet.create({
  header: { padding: 20, paddingTop: 18, paddingBottom: 18, position: 'relative', overflow: 'hidden' },
});