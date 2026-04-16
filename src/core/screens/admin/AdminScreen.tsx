/**
 * AdminScreen.tsx — WEEG Admin v3 Premium
 * Deep navy + indigo accent, refined cards with clear action hierarchy
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { AdminService } from '../../lib/api';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  navy:    '#0a1628',
  navy2:   '#111f3a',
  indigo:  '#4f46e5',
  indigo2: '#3730a3',
  sky:     '#0284c7',
  skyBg:   '#e0f2fe',
  green:   '#059669',
  greenBg: '#d1fae5',
  amber:   '#d97706',
  amberBg: '#fef3c7',
  red:     '#dc2626',
  redBg:   '#fee2e2',
  violet:  '#7c3aed',
  violetBg:'#ede9fe',
  white:   '#ffffff',
  surface: '#ffffff',
  surface2:'#f8fafc',
  border:  '#e2e8f0',
  border2: '#f1f5f9',
  text:    '#0f172a',
  text2:   '#334155',
  text3:   '#64748b',
  text4:   '#94a3b8',
  bg:      '#f1f5f9',
};

type AdminTab = 'pending' | 'managers' | 'agents' | 'suspended' | 'all';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';
  return (
    <LinearGradient colors={[color, color + 'aa']} style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '900', color: T.white, letterSpacing: 0.5 }}>{initials}</Text>
    </LinearGradient>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string }> = {
    approved:  { bg: T.greenBg,  color: T.green  },
    active:    { bg: T.greenBg,  color: T.green  },
    pending:   { bg: T.amberBg,  color: T.amber  },
    rejected:  { bg: T.redBg,    color: T.red    },
    suspended: { bg: T.redBg,    color: T.red    },
  };
  const s = m[status] || { bg: T.border2, color: T.text3 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: s.color }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.color, textTransform: 'capitalize' }}>{status}</Text>
    </View>
  );
}

// ─── Role Pill ────────────────────────────────────────────────────────────────
function RolePill({ role }: { role: string }) {
  const m: Record<string, { bg: string; color: string }> = {
    manager: { bg: T.skyBg,    color: T.sky    },
    admin:   { bg: '#e0e7ff',  color: T.indigo },
    agent:   { bg: T.violetBg, color: T.violet },
  };
  const s = m[role] || { bg: T.border2, color: T.text3 };
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.color, textTransform: 'capitalize' }}>{role}</Text>
    </View>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ label, icon, bg, border, color, onPress }: { label: string; icon: string; bg: string; border: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: border, backgroundColor: bg }}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ manager, onClose, onReject }: { manager: any; onClose: () => void; onReject: (r: string) => void }) {
  const [reason, setReason] = useState('');
  const quick = ['Incomplete information', 'Unverified company', 'Duplicate account', 'Invalid email domain'];
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: T.white, padding: 24, paddingTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.redBg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close-circle-outline" size={24} color={T.red} />
          </View>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: T.text }}>Reject Request</Text>
            <Text style={{ fontSize: 12, color: T.text4 }}>{manager?.first_name} {manager?.last_name}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Quick Reasons</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {quick.map(r => (
            <TouchableOpacity key={r} onPress={() => setReason(r)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5, borderColor: reason === r ? T.indigo : T.border, backgroundColor: reason === r ? '#e0e7ff' : T.surface2 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: reason === r ? T.indigo : T.text3 }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Custom Reason</Text>
        <TextInput
          value={reason} onChangeText={setReason} multiline numberOfLines={4}
          placeholder="Describe why this request is being rejected…" placeholderTextColor={T.text4}
          style={{ borderWidth: 1.5, borderColor: T.border, borderRadius: 12, padding: 14, fontSize: 14, color: T.text2, backgroundColor: T.surface2, minHeight: 110, textAlignVertical: 'top' }}
        />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: T.surface2, alignItems: 'center', borderWidth: 1, borderColor: T.border }} onPress={onClose}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: T.text3 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={!reason.trim()} onPress={() => { onReject(reason); onClose(); }}
            style={{ flex: 2, opacity: reason.trim() ? 1 : 0.4, borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ backgroundColor: T.red, paddingVertical: 14, alignItems: 'center', borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: T.white }}>Reject Request</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ u, tab, onApprove, onRejectStart, onSuspend, onReactivate }: {
  u: any; tab: AdminTab;
  onApprove: () => void; onRejectStart: () => void;
  onSuspend: () => void; onReactivate: () => void;
}) {
  const name       = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
  const avatarColor = u.role === 'manager' ? T.sky : u.role === 'agent' ? T.violet : T.indigo;
  const isPending  = tab === 'pending';
  const isSuspended = tab === 'suspended' || (tab === 'all' && u.status === 'suspended');
  const canSuspend = u.role === 'manager' && u.status !== 'suspended' && u.status !== 'pending' && (tab === 'managers' || tab === 'all');
  const co         = u.company || {};
  const companyName = co.name || u.company_name || null;
  const industry   = co.industry || u.industry || null;
  const country    = co.country || u.country || null;
  const city       = co.city || u.city || null;
  const showCompany = (isPending || u.role === 'manager' || u.role === 'agent') && (companyName || industry || country || city);

  return (
    <View style={S.card}>
      {/* Top: avatar + info + date */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={name} color={avatarColor} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: T.text, letterSpacing: -0.2 }} numberOfLines={1}>{name}</Text>
          <Text style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }} numberOfLines={1}>{u.email}</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
            <RolePill role={u.role || 'user'} />
            <StatusPill status={u.status || 'active'} />
          </View>
        </View>
        {u.created_at && (
          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={{ fontSize: 9.5, color: T.text4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Joined</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: T.text3, marginTop: 1 }}>
              {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
            </Text>
          </View>
        )}
      </View>

      {/* Company info */}
      {showCompany && (
        <View style={{ marginTop: 12, backgroundColor: T.surface2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: T.border2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Ionicons name="business-outline" size={12} color={T.indigo} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: T.indigo, textTransform: 'uppercase', letterSpacing: 0.8 }}>Company Info</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {([['Company', companyName], ['Industry', industry], ['Country', country], ['City', city]] as [string, string | null][]).map(([lbl, val]) => val ? (
              <View key={lbl} style={{ width: '50%', paddingVertical: 4, paddingRight: 8 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '700', color: T.text4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>{lbl}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: T.text2 }} numberOfLines={1}>{val}</Text>
              </View>
            ) : null)}
          </View>
        </View>
      )}

      {/* Actions */}
      {(isPending || isSuspended || canSuspend) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border2 }}>
          {isPending && (
            <>
              <ActionBtn label="Approve" icon="checkmark-circle-outline" bg={T.green}   border={T.green}  color={T.white} onPress={onApprove}     />
              <ActionBtn label="Reject"  icon="close-circle-outline"     bg={T.redBg}   border="#fecaca"  color={T.red}   onPress={onRejectStart} />
            </>
          )}
          {canSuspend  && <ActionBtn label="Suspend"    icon="ban-outline"             bg="#fff1f2"    border="#fecaca"  color={T.red}   onPress={onSuspend}    />}
          {isSuspended && u.role === 'manager' && <ActionBtn label="Reactivate" icon="refresh-circle-outline" bg={T.greenBg} border="#6ee7b7" color={T.green} onPress={onReactivate} />}
        </View>
      )}

      {!isPending && !isSuspended && !canSuspend && u.role === 'agent' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border2 }}>
          <Ionicons name="information-circle-outline" size={12} color={T.text4} />
          <Text style={{ fontSize: 10.5, color: T.text4, fontStyle: 'italic' }}>Managed by their manager</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AdminScreen() {
  const { approveManager, rejectManager } = useAuth();
  const [tab,          setTab]          = useState<AdminTab>('all');
  const [users,        setUsers]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadUsers = useCallback(async (t: AdminTab) => {
    setLoading(true);
    if (t === 'pending') {
      const res = await AdminService.getPendingManagers();
      const list = res.ok ? (res.data || []) : [];
      setUsers(list);
      setPendingCount(list.length);
    } else {
      const filterMap: Record<string, any> = {
        managers: { role: 'manager' }, agents: { role: 'agent' },
        suspended: { status: 'suspended' }, all: {},
      };
      const res = await AdminService.getAllUsers(filterMap[t] || {});
      let all: any[] = res.ok ? (res.data?.users || []) : [];
      if (t === 'managers') all = all.filter(u => u.status !== 'pending' && u.status !== 'suspended' && u.status !== 'rejected');
      setUsers(all);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(tab); }, [tab]);

  const onRefresh = async () => { setRefreshing(true); await loadUsers(tab); setRefreshing(false); };

  const handleApprove = (u: any) => Alert.alert('Approve Manager', `Approve ${u.first_name} ${u.last_name}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Approve', onPress: async () => {
      const r = await approveManager(u.id);
      if (r.success) { Alert.alert('Approved', r.message); setUsers(p => p.filter(m => m.id !== u.id)); }
      else Alert.alert('Error', r.message);
    }},
  ]);

  const handleReject = async (id: string, reason: string) => {
    const r = await rejectManager(id, reason);
    if (r.success) { Alert.alert('Rejected', r.message); setUsers(p => p.filter(m => m.id !== id)); }
    else Alert.alert('Error', r.message);
  };

  const handleSuspend = (u: any) => Alert.alert('Suspend', `Suspend ${u.first_name} ${u.last_name}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Suspend', style: 'destructive', onPress: async () => {
      const res = await AdminService.updateUserStatus(u.id, 'suspended');
      if (res.ok) { setUsers(p => p.filter(m => m.id !== u.id)); Alert.alert('Suspended', res.data?.message || 'Done.'); }
      else Alert.alert('Error', res.error || 'Failed');
    }},
  ]);

  const handleReactivate = (u: any) => Alert.alert('Reactivate', `Reactivate ${u.first_name} ${u.last_name}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reactivate', onPress: async () => {
      const res = await AdminService.updateUserStatus(u.id, 'active');
      if (res.ok) { setUsers(p => p.filter(m => m.id !== u.id)); Alert.alert('Reactivated', res.data?.message || 'Done.'); }
      else Alert.alert('Error', res.error || 'Failed');
    }},
  ]);

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'all',       label: 'All',       icon: 'grid-outline'      },
    { id: 'pending',   label: 'Pending',   icon: 'time-outline'      },
    { id: 'managers',  label: 'Managers',  icon: 'briefcase-outline' },
    { id: 'agents',    label: 'Agents',    icon: 'people-outline'    },
    { id: 'suspended', label: 'Suspended', icon: 'ban-outline'       },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {rejectTarget && (
        <RejectModal manager={rejectTarget} onClose={() => setRejectTarget(null)} onReject={reason => handleReject(rejectTarget.id, reason)} />
      )}

      {/* Header */}
      <LinearGradient colors={[T.navy, T.navy2, '#1d2f52']} style={S.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Decorative elements */}
        <View style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(79,70,229,0.12)' }} />
        <View style={{ position: 'absolute', left: 80, bottom: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)' }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 5 }}>WEEG PLATFORM</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: T.white, letterSpacing: -0.5 }}>User Management</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Review requests · manage accounts</Text>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: T.white, lineHeight: 28 }}>{users.length}</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '700', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>users</Text>
          </View>
        </View>

        {/* Pending alert */}
        {tab !== 'pending' && pendingCount > 0 && (
          <TouchableOpacity onPress={() => setTab('pending')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: 'rgba(220,38,38,0.18)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f87171' }} />
            <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '600', color: '#fca5a5' }}>{pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting review</Text>
            <Ionicons name="chevron-forward" size={14} color="#f87171" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tab bar */}
      <View style={{ height: 50, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center', height: 50 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 50, borderBottomWidth: 2.5, borderBottomColor: active ? T.indigo : 'transparent', marginRight: 2 }}
                onPress={() => setTab(t.id)}
              >
                <Ionicons name={t.icon as any} size={14} color={active ? T.indigo : T.text4} />
                <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? T.indigo : T.text4 }}>{t.label}</Text>
                {t.id === 'pending' && pendingCount > 0 && (
                  <View style={{ backgroundColor: T.red, borderRadius: 8, minWidth: 17, height: 17, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 9.5, color: T.white, fontWeight: '800' }}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.indigo} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <ActivityIndicator color={T.indigo} size="large" />
            <Text style={{ marginTop: 12, fontSize: 13, color: T.text4 }}>Loading users…</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={{ backgroundColor: T.white, borderRadius: 20, padding: 48, alignItems: 'center', borderWidth: 1, borderColor: T.border, marginTop: 8 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: T.border2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="people-outline" size={36} color={T.text4} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: T.text2, marginBottom: 6 }}>No users found</Text>
            <Text style={{ fontSize: 13, color: T.text4, textAlign: 'center', lineHeight: 20 }}>
              {tab === 'pending' ? 'No pending requests at the moment' : `No ${tab} accounts to display`}
            </Text>
          </View>
        ) : (
          users.map(u => (
            <UserCard
              key={u.id} u={u} tab={tab}
              onApprove={() => handleApprove(u)}
              onRejectStart={() => setRejectTarget(u)}
              onSuspend={() => handleSuspend(u)}
              onReactivate={() => handleReactivate(u)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  header: { padding: 20, paddingTop: 18, paddingBottom: 18, position: 'relative', overflow: 'hidden' },
  card:   {
    backgroundColor: T.white, borderRadius: 16, marginBottom: 10, padding: 14,
    borderWidth: 1, borderColor: T.border,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
});