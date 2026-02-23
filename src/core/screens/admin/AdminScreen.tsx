/**
 * AdminScreen.tsx — Panel Admin WEEG
 * Tabs : Pending · Managers · Agents · Suspended · All
 * Actions : Approve/Reject managers | Suspend/Reactivate | Edit agent permissions
 *
 * FIXES :
 *  1. Managers tab : filtre sans status (managers réactivés visibles)
 *  2. Tab bar fixée (height: 48 + zIndex + wrapper View) pour éviter disparition au scroll
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { AdminService } from '../../lib/api';

const INDIGO = '#4f46e5';
const INDIGO_LIGHT = '#eef2ff';
const INDIGO_BORDER = '#c7d2fe';
const VIOLET = '#7c3aed';
const GREEN = '#16a34a';
const RED = '#dc2626';

type AdminTab = 'pending' | 'managers' | 'agents' | 'suspended' | 'all';

// ─── Permissions ──────────────────────────────────────────────────────────────

const PERMISSIONS_GROUPS = [
  { group: 'Data Management', items: [
    { id: 'import-data', label: 'Import Data', desc: 'Import Excel files' },
    { id: 'export-data', label: 'Export Data', desc: 'Export to Excel/CSV' },
  ]},
  { group: 'Analytics & Reports', items: [
    { id: 'view-dashboard', label: 'View Dashboard', desc: 'Access main dashboard with KPIs' },
    { id: 'view-reports', label: 'View Reports', desc: 'Access and view all reports' },
    { id: 'generate-reports', label: 'Generate Reports', desc: 'Create custom reports' },
    { id: 'view-kpi', label: 'View KPIs', desc: 'Access KPI engine and metrics' },
    { id: 'filter-dashboard', label: 'Filter Dashboard', desc: 'Apply filters to dashboard' },
    { id: 'ai-insights', label: 'AI Insights', desc: 'Access AI-powered insights' },
  ]},
  { group: 'Sales & Inventory', items: [
    { id: 'view-sales', label: 'View Sales', desc: 'Access sales and purchases data' },
    { id: 'view-inventory', label: 'View Inventory', desc: 'Check product availability' },
    { id: 'view-customer-payments', label: 'Customer Payments', desc: 'Access payment history' },
    { id: 'view-aging', label: 'Aging Receivables', desc: 'Track overdue payments' },
  ]},
  { group: 'System Access', items: [
    { id: 'receive-notifications', label: 'Notifications', desc: 'Get notified about events' },
    { id: 'manage-alerts', label: 'Manage Alerts', desc: 'Mark alerts as resolved' },
    { id: 'view-profile', label: 'View Profile', desc: 'Access personal profile' },
    { id: 'change-password', label: 'Change Password', desc: 'Update account password' },
  ]},
];

const DEFAULT_PERMS = [
  'view-dashboard', 'view-reports', 'generate-reports', 'view-kpi',
  'filter-dashboard', 'view-sales', 'view-inventory', 'view-customer-payments',
  'receive-notifications', 'manage-alerts', 'view-profile', 'change-password',
];
const ALL_PERMS = PERMISSIONS_GROUPS.flatMap(g => g.items.map(i => i.id));

// ─── Composants utilitaires ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    approved: { bg: '#dcfce7', color: GREEN,    label: 'Approved' },
    pending:  { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    rejected: { bg: '#fee2e2', color: RED,       label: 'Rejected' },
    suspended:{ bg: '#fee2e2', color: RED,       label: 'Suspended' },
    active:   { bg: '#dcfce7', color: GREEN,    label: 'Active' },
  };
  const c = cfg[status] || { bg: Colors.gray100, color: Colors.gray500, label: status };
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>{c.label}</Text>
    </View>
  );
}

function RoleBadge({ role }: { role: string }) {
  const color = role === 'manager' ? '#2563eb' : VIOLET;
  return (
    <View style={{ backgroundColor: color + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{role}</Text>
    </View>
  );
}

function UserAvatar({ name, color = Colors.gray400 }: { name: string; color?: string }) {
  return (
    <View style={[ad.avatar, { backgroundColor: color }]}>
      <Text style={ad.avatarTxt}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

// ─── Modal permissions ────────────────────────────────────────────────────────

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
                <Text style={{ fontSize: 11, color: INDIGO, fontWeight: '600' }}>
                  {allIn ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
            {group.items.map(item => {
              const checked = perms.includes(item.id);
              return (
                <TouchableOpacity key={item.id} style={ad.permRow} onPress={() => toggle(item.id)}>
                  <View style={[ad.checkbox, checked && ad.checkboxOn]}>
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
        <View style={ad.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={ad.modalTitle}>Manage Permissions</Text>
            <Text style={{ fontSize: 12, color: Colors.gray500 }}>
              {agent?.first_name} {agent?.last_name} · {perms.length} selected
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 }}>
          {([['Default', DEFAULT_PERMS], ['All', ALL_PERMS], ['None', [] as string[]]] as const).map(([label, p]) => (
            <TouchableOpacity key={label} style={ad.quickBtn} onPress={() => setPerms(p as string[])}>
              <Text style={ad.quickTxt}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <PermList perms={perms} setPerms={setPerms} />
        </ScrollView>

        <View style={ad.modalFooter}>
          <TouchableOpacity style={ad.cancelBtn} onPress={onClose}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            onPress={async () => {
              setSaving(true);
              await onSave(agent.id, perms);
              setSaving(false);
              onClose();
            }}
            style={{ flex: 2 }}
          >
            <LinearGradient colors={[INDIGO, VIOLET]} style={ad.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save Permissions</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal rejet ──────────────────────────────────────────────────────────────

function RejectModal({
  manager, onClose, onReject,
}: {
  manager: any;
  onClose: () => void;
  onReject: (r: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.white, padding: 24, paddingTop: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.foreground, marginBottom: 8 }}>
          Reject Request
        </Text>
        <Text style={{ fontSize: 13, color: Colors.gray500, marginBottom: 20 }}>
          Provide a reason for rejecting {manager?.first_name}'s request.
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          placeholder="e.g. Incomplete information, unverified company..."
          placeholderTextColor={Colors.gray400}
          style={{
            borderWidth: 1, borderColor: Colors.gray200, borderRadius: BorderRadius.lg,
            padding: 12, fontSize: 14, color: Colors.foreground,
            backgroundColor: Colors.gray50, minHeight: 100, textAlignVertical: 'top',
          }}
        />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity style={[ad.cancelBtn, { flex: 1 }]} onPress={onClose}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!reason.trim()}
            onPress={() => { onReject(reason); onClose(); }}
            style={{ flex: 2, opacity: reason.trim() ? 1 : 0.5, borderRadius: BorderRadius.lg, overflow: 'hidden' }}
          >
            <View style={{ backgroundColor: RED, paddingVertical: 13, alignItems: 'center', borderRadius: BorderRadius.lg }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Reject Request</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function AdminScreen() {
  const { approveManager, rejectManager } = useAuth();
  const [tab, setTab] = useState<AdminTab>('pending');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingManager, setRejectingManager] = useState<any>(null);

  // ✅ FIX 1 : "managers" n'a plus status: 'approved'
  //    → managers réactivés (status='active') sont maintenant visibles
  const filterMap: Record<AdminTab, { status?: string; role?: string }> = {
    pending:   { status: 'pending' },
    managers:  { role: 'manager' },          // ← FIX : sans filtre status
    agents:    { role: 'agent' },
    suspended: { status: 'suspended' },
    all:       {},
  };

  const loadUsers = useCallback(async (currentTab: AdminTab) => {
    setLoading(true);
    if (currentTab === 'pending') {
      const res = await AdminService.getPendingManagers();
      setUsers(res.ok ? (res.data || []) : []);
    } else {
      const res = await AdminService.getAllUsers(filterMap[currentTab]);
      setUsers(res.ok ? (res.data?.users || []) : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(tab); }, [tab]);

  const onRefresh = async () => { setRefreshing(true); await loadUsers(tab); setRefreshing(false); };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = (manager: any) => {
    Alert.alert('Approve Manager', `Approve ${manager.first_name} ${manager.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          const r = await approveManager(manager.id);
          if (r.success) {
            Alert.alert('✓ Approved', r.message);
            setUsers(p => p.filter(m => m.id !== manager.id));
          } else Alert.alert('Error', r.message);
        },
      },
    ]);
  };

  const handleReject = async (managerId: string, reason: string) => {
    const r = await rejectManager(managerId, reason);
    if (r.success) {
      Alert.alert('Rejected', r.message);
      setUsers(p => p.filter(m => m.id !== managerId));
    } else Alert.alert('Error', r.message);
  };

  const handleSuspend = (u: any) => {
    Alert.alert('Suspend Account', `Suspend ${u.first_name} ${u.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend', style: 'destructive', onPress: async () => {
          const res = await AdminService.updateUserStatus(u.id, 'suspended');
          if (res.ok) { Alert.alert('✓ Suspended', res.data?.message); await loadUsers(tab); }
          else Alert.alert('Error', res.error || 'Failed');
        },
      },
    ]);
  };

  const handleReactivate = (u: any) => {
    Alert.alert('Reactivate Account', `Reactivate ${u.first_name} ${u.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate', onPress: async () => {
          const res = await AdminService.updateUserStatus(u.id, 'active');
          if (res.ok) { Alert.alert('✓ Reactivated', res.data?.message); await loadUsers(tab); }
          else Alert.alert('Error', res.error || 'Failed');
        },
      },
    ]);
  };

  // ── Rendu d'un utilisateur ────────────────────────────────────────────────

  const renderUser = (u: any) => {
    const name = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
    const avatarColor = u.role === 'manager' ? '#2563eb' : u.role === 'agent' ? VIOLET : Colors.gray400;

    return (
      <View key={u.id} style={[ad.userCard, Shadow.sm]}>
        <UserAvatar name={name} color={avatarColor} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <Text style={ad.userName}>{name}</Text>
            <RoleBadge role={u.role || 'user'} />
            <StatusBadge status={u.status || 'active'} />
          </View>
          <Text style={{ fontSize: 12, color: Colors.gray500 }}>{u.email}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {u.company_name && (
              <View style={ad.infoTag}>
                <Ionicons name="business-outline" size={10} color={Colors.gray500} />
                <Text style={ad.infoTagTxt}>{u.company_name}</Text>
              </View>
            )}
            {u.created_at && (
              <View style={ad.infoTag}>
                <Ionicons name="calendar-outline" size={10} color={Colors.gray500} />
                <Text style={ad.infoTagTxt}>{new Date(u.created_at).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions selon le tab */}
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          {tab === 'pending' && (
            <>
              <TouchableOpacity style={ad.approveBtn} onPress={() => handleApprove(u)}>
                <Ionicons name="checkmark" size={13} color="#fff" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ad.rejectBtn} onPress={() => setRejectingManager(u)}>
                <Ionicons name="close" size={13} color={RED} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: RED }}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {(tab === 'managers' || (tab === 'all' && u.status !== 'suspended' && u.status !== 'pending')) && (
            <TouchableOpacity style={ad.suspendBtn} onPress={() => handleSuspend(u)}>
              <Ionicons name="ban-outline" size={13} color={RED} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: RED }}>Suspend</Text>
            </TouchableOpacity>
          )}
          {(tab === 'suspended' || (tab === 'all' && u.status === 'suspended')) && (
            <TouchableOpacity style={ad.reactivateBtn} onPress={() => handleReactivate(u)}>
              <Ionicons name="person-add-outline" size={13} color={GREEN} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: GREEN }}>Reactivate</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    );
  };

  // ── Tab config ────────────────────────────────────────────────────────────

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'pending',   label: 'Pending' },
    { id: 'managers',  label: 'Managers' },
    { id: 'agents',    label: 'Agents' },
    { id: 'suspended', label: 'Suspended' },
    { id: 'all',       label: 'All' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>

      {/* Modals */}
      {rejectingManager && (
        <RejectModal
          manager={rejectingManager}
          onClose={() => setRejectingManager(null)}
          onReject={reason => handleReject(rejectingManager.id, reason)}
        />
      )}

      {/* Header */}
      <View style={ad.pageHeader}>
        <Text style={ad.pageTitle}>User Management</Text>
        <Text style={ad.pageSub}>Validate requests and manage accounts</Text>
      </View>

      {/* ✅ FIX 2 : wrapper View fixe pour que la tab bar ne disparaisse pas au scroll */}
      <View style={ad.tabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={ad.tabBarContent}
        >
          {tabs.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[ad.tabBtn, tab === t.id && ad.tabBtnActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[ad.tabLabel, tab === t.id && { color: INDIGO, fontWeight: '700' }]}>
                {t.label}
              </Text>
              {t.id === 'pending' && users.length > 0 && tab === 'pending' && (
                <View style={ad.tabBadge}>
                  <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>{users.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
      >
        <View style={{ padding: Spacing.base }}>
          {loading ? (
            <ActivityIndicator color={INDIGO} style={{ marginTop: 60 }} />
          ) : users.length === 0 ? (
            <View style={[ad.emptyBox, Shadow.sm]}>
              <Ionicons name="filter-outline" size={40} color={Colors.gray300} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.foreground, marginTop: 12 }}>
                No users found
              </Text>
              <Text style={{ fontSize: 12, color: Colors.gray500, marginTop: 4 }}>
                {tab === 'pending' ? 'No pending requests' : `No ${tab} accounts`}
              </Text>
            </View>
          ) : (
            users.map(u => renderUser(u))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ad = StyleSheet.create({
  pageHeader: {
    padding: Spacing.base,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.foreground },
  pageSub: { fontSize: 13, color: Colors.gray500, marginTop: 2 },

  // ✅ FIX 2 : height fixe + zIndex pour rester visible pendant le scroll
  tabBarWrap: {
    height: 48,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    zIndex: 10,
  },
  tabBarContent: { paddingHorizontal: 8 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: INDIGO },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.gray500 },
  tabBadge: {
    backgroundColor: RED,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  emptyBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.foreground },

  infoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  infoTagTxt: { fontSize: 10, color: Colors.gray600 },

  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GREEN,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#fecaca',
  },
  suspendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#fecaca',
  },
  reactivateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    marginBottom: 6,
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: INDIGO, borderColor: INDIGO },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 24,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.foreground },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  quickTxt: { fontSize: 12, fontWeight: '600', color: Colors.foreground },
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
    flex: 1, paddingVertical: 13,
    borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
});