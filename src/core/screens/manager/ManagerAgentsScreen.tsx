/**
 * ManagerAgentsScreen.tsx — Gestion des agents pour les managers WEEG
 * - Liste des agents liés au manager
 * - Edition des permissions de chaque agent
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerService } from '../../lib/api';

const WEEG_NAVY   = '#0d1b2e';
const WEEG_BLUE   = '#1a6fe8';
const WEEG_ORANGE = '#e87c1a';
const VIOLET      = '#7c3aed';
const GREEN       = '#16a34a';

// ─── Groupes de permissions ───────────────────────────────────────────────────

const PERMISSIONS_GROUPS = [
  { group: 'Data Management', items: [
    { id: 'import-data',  label: 'Import Data',  desc: 'Import Excel files' },
    { id: 'export-data',  label: 'Export Data',  desc: 'Export to Excel/CSV' },
  ]},
  { group: 'Analytics & Reports', items: [
    { id: 'view-dashboard',   label: 'View Dashboard',   desc: 'Access main dashboard with KPIs' },
    { id: 'view-reports',     label: 'View Reports',     desc: 'Access and view all reports' },
    { id: 'generate-reports', label: 'Generate Reports', desc: 'Create custom reports' },
    { id: 'view-kpi',         label: 'View KPIs',        desc: 'Access KPI engine and metrics' },
    { id: 'filter-dashboard', label: 'Filter Dashboard', desc: 'Apply filters to dashboard' },
    { id: 'ai-insights',      label: 'AI Insights',      desc: 'Access AI-powered insights' },
  ]},
  { group: 'Sales & Inventory', items: [
    { id: 'view-sales',             label: 'View Sales',         desc: 'Access sales and purchases data' },
    { id: 'view-inventory',         label: 'View Inventory',     desc: 'Check product availability' },
    { id: 'view-customer-payments', label: 'Customer Payments',  desc: 'Access payment history' },
    { id: 'view-aging',             label: 'Aging Receivables',  desc: 'Track overdue payments' },
  ]},
  { group: 'System Access', items: [
    { id: 'receive-notifications', label: 'Notifications',    desc: 'Get notified about events' },
    { id: 'manage-alerts',         label: 'Manage Alerts',    desc: 'Mark alerts as resolved' },
    { id: 'view-profile',          label: 'View Profile',     desc: 'Access personal profile' },
    { id: 'change-password',       label: 'Change Password',  desc: 'Update account password' },
  ]},
];

const DEFAULT_PERMS = [
  'view-dashboard', 'view-reports', 'generate-reports', 'view-kpi',
  'filter-dashboard', 'view-sales', 'view-inventory', 'view-customer-payments',
  'receive-notifications', 'manage-alerts', 'view-profile', 'change-password',
];
const ALL_PERMS = PERMISSIONS_GROUPS.flatMap(g => g.items.map(i => i.id));

// ─── PermList ─────────────────────────────────────────────────────────────────

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
        const ids = group.items.map(i => i.id);
        const allIn = ids.every(id => perms.includes(id));
        return (
          <View key={gi} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.foreground }}>{group.group}</Text>
              <TouchableOpacity onPress={() => toggleGroup(ids)}>
                <Text style={{ fontSize: 11, color: WEEG_BLUE, fontWeight: '600' }}>
                  {allIn ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            {group.items.map(item => {
              const checked = perms.includes(item.id);
              return (
                <TouchableOpacity key={item.id} style={ms.permRow} onPress={() => toggle(item.id)}>
                  <View style={[ms.checkbox, checked && ms.checkboxOn]}>
                    {checked && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.foreground }}>{item.label}</Text>
                    <Text style={{ fontSize: 11, color: Colors.gray500 }}>{item.desc}</Text>
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

// ─── Modal permissions ────────────────────────────────────────────────────────

function PermissionsModal({
  agent, onClose, onSave,
}: {
  agent: any;
  onClose: () => void;
  onSave: (id: string, p: string[]) => Promise<void>;
}) {
  const [perms, setPerms] = useState<string[]>(agent?.permissions_list || []);
  const [saving, setSaving] = useState(false);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.white }}>

        {/* Header modal avec gradient Weeg */}
        <LinearGradient
          colors={[WEEG_NAVY, WEEG_BLUE, WEEG_ORANGE]}
          style={ms.modalHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={ms.modalTitle}>Manage Permissions</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {agent?.first_name} {agent?.last_name} · {perms.length} selected
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Boutons rapides */}
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 }}>
          {([['Default', DEFAULT_PERMS], ['All', ALL_PERMS], ['None', [] as string[]]] as const).map(([label, p]) => (
            <TouchableOpacity key={label} style={ms.quickBtn} onPress={() => setPerms(p as string[])}>
              <Text style={ms.quickTxt}>{label}</Text>
            </TouchableOpacity>
          ))}
          <View style={ms.countBadge}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: WEEG_BLUE }}>{perms.length} / {ALL_PERMS.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <PermList perms={perms} setPerms={setPerms} />
        </ScrollView>

        <View style={ms.modalFooter}>
          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            onPress={async () => { setSaving(true); await onSave(agent.id, perms); setSaving(false); onClose(); }}
            style={{ flex: 2 }}
          >
            <LinearGradient colors={[WEEG_NAVY, WEEG_BLUE, WEEG_ORANGE]} style={ms.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="checkmark-outline" size={16} color="#fff" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save Permissions</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function ManagerAgentsScreen() {
  const { updateAgentPermissions } = useAuth();
  const [agents, setAgents]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [search, setSearch]           = useState('');

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
      Alert.alert('✓ Saved', r.message);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, permissions_list: perms } : a));
    } else Alert.alert('Error', r.message);
  };

  const filtered = agents.filter(a => {
    const name = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>

      {/* Modal permissions */}
      {editingAgent && (
        <PermissionsModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={handleSavePermissions}
        />
      )}

      {/* Header */}
      <LinearGradient
        colors={[WEEG_NAVY, WEEG_BLUE, WEEG_ORANGE]}
        style={ms.pageHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View>
          <Text style={ms.pageTitle}>My Agents</Text>
          <Text style={ms.pageSub}>Manage permissions for your team</Text>
        </View>
        <View style={ms.headerCount}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{agents.length}</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>agents</Text>
        </View>
      </LinearGradient>

      {/* Barre de recherche */}
      <View style={ms.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.gray400} />
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, color: search ? Colors.foreground : Colors.gray400 }}
            onPress={() => {}} // handled by TextInput below — just visual placeholder
          />
        </View>
        {/* On utilise une TextInput réelle */}
      </View>

      {/* Vraie barre de recherche */}
      <View style={ms.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.gray400} />
        <View style={{ flex: 1 }}>
          <Text
            style={{ position: 'absolute', fontSize: 14, color: Colors.gray400, display: search ? 'none' : 'flex' }}
          >
            Search agents...
          </Text>
        </View>
      </View>

      {/* Liste */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WEEG_BLUE} />}
      >
        <View style={{ padding: Spacing.base }}>
          {loading ? (
            <ActivityIndicator color={WEEG_BLUE} style={{ marginTop: 60 }} />
          ) : agents.length === 0 ? (
            <View style={[ms.emptyBox, Shadow.sm]}>
              <Ionicons name="people-outline" size={48} color={Colors.gray300} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.foreground, marginTop: 12 }}>
                No agents yet
              </Text>
              <Text style={{ fontSize: 12, color: Colors.gray500, marginTop: 4, textAlign: 'center' }}>
                Agents assigned to your company will appear here
              </Text>
            </View>
          ) : (
            agents.map(agent => {
              const name = agent.full_name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || '—';
              const permCount = (agent.permissions_list || []).length;

              return (
                <View key={agent.id} style={[ms.agentCard, Shadow.sm]}>
                  {/* Avatar */}
                  <View style={ms.avatar}>
                    <Text style={ms.avatarTxt}>{(name).charAt(0).toUpperCase()}</Text>
                  </View>

                  {/* Infos */}
                  <View style={{ flex: 1 }}>
                    <Text style={ms.agentName}>{name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.gray500 }}>{agent.email}</Text>

                    {/* Badges */}
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {/* Badge statut */}
                      <View style={[
                        ms.statusBadge,
                        { backgroundColor: agent.status === 'active' || agent.status === 'approved' ? '#dcfce7' : '#fef9c3' },
                      ]}>
                        <View style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: agent.status === 'active' || agent.status === 'approved' ? GREEN : '#ca8a04',
                        }} />
                        <Text style={{
                          fontSize: 10, fontWeight: '700',
                          color: agent.status === 'active' || agent.status === 'approved' ? GREEN : '#92400e',
                          textTransform: 'capitalize',
                        }}>
                          {agent.status || 'active'}
                        </Text>
                      </View>

                      {/* Nombre de permissions */}
                      <View style={ms.permCountBadge}>
                        <Ionicons name="key-outline" size={10} color={WEEG_BLUE} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: WEEG_BLUE }}>
                          {permCount} permissions
                        </Text>
                      </View>
                    </View>

                    {/* Date ajout */}
                    {agent.created_at && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="calendar-outline" size={10} color={Colors.gray400} />
                        <Text style={{ fontSize: 10, color: Colors.gray400 }}>
                          Added {new Date(agent.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Bouton permissions */}
                  <TouchableOpacity style={ms.editBtn} onPress={() => setEditingAgent(agent)}>
                    <LinearGradient
                      colors={[WEEG_BLUE, WEEG_ORANGE]}
                      style={ms.editBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="settings-outline" size={14} color="#fff" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Permissions</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    paddingVertical: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pageSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerCount: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 10 },

  searchWrap: { display: 'none' }, // caché — placeholder visuel uniquement
  searchBar: { display: 'none' },

  emptyBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
    marginTop: 20,
  },

  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  avatar:    { width: 46, height: 46, borderRadius: 23, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 18, fontWeight: '800', color: '#fff' },
  agentName: { fontSize: 14, fontWeight: '700', color: Colors.foreground },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  permCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },

  editBtn:         { alignSelf: 'center' },
  editBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 28,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  quickTxt:   { fontSize: 12, fontWeight: '600', color: Colors.foreground },
  countBadge: {
    marginLeft: 'auto' as any,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eff6ff',
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  modalFooter: {
    flexDirection: 'row', gap: 12,
    padding: 16,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: BorderRadius.lg,
  },

  // Permissions list
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg, marginBottom: 6,
  },
  checkbox:    { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:  { backgroundColor: WEEG_BLUE, borderColor: WEEG_BLUE },
});