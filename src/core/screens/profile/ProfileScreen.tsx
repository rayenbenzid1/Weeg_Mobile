/**
 * ProfileScreen.tsx — Profil connecté au backend Django WEEG
 * - Header dark navy + orange style Weeg (comme splash screen)
 * - Nom, email, rôle, company dans le header
 * - Section Permissions visible uniquement pour role === 'agent'
 * - Changement de mot de passe + sessions actives
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { UserService, SessionService } from '../../lib/api';

// ─── Couleurs Weeg (identiques au splash screen) ─────────────────────────────
const WEEG_NAVY   = '#0d1b2e';   // fond sombre du splash
const WEEG_BLUE   = '#1a6fe8';   // bleu logo
const WEEG_BLUE2  = '#1a4a8a';   // bleu intermédiaire
const WEEG_ORANGE = '#e87c1a';   // orange logo

type Tab = 'account' | 'security' | 'permissions';

export function ProfileScreen() {
  const { user, logout, changePassword, refreshProfile } = useAuth();

  const availableTabs: Tab[] = user?.role === 'agent'
    ? ['account', 'security', 'permissions']
    : ['account', 'security'];
  const [tab, setTab] = useState<Tab>('account');

  // ── Mode édition profil ──────────────────────────────────────────────────
  const [editing, setEditing]       = useState(false);
  const [firstName, setFirstName]   = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName]     = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone]           = useState(user?.phoneNumber || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhone(user?.phoneNumber || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!firstName.trim()) { Alert.alert('Error', 'First name is required.'); return; }
    setSavingProfile(true);
    const res = await UserService.updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phone.trim() || undefined,
    });
    setSavingProfile(false);
    if (res.ok) {
      await refreshProfile();
      setEditing(false);
      Alert.alert('✓ Updated', 'Profile updated successfully.');
    } else {
      Alert.alert('Error', res.error || 'Failed to update profile.');
    }
  };

  const handleCancelEdit = () => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhone(user?.phoneNumber || '');
    setEditing(false);
  };

  // ── Changement mot de passe ──────────────────────────────────────────────
  const [oldPw, setOldPw]         = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [savingPw, setSavingPw]   = useState(false);

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) { Alert.alert('Error', 'Please fill all fields.'); return; }
    if (newPw.length < 8)               { Alert.alert('Error', 'New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)            { Alert.alert('Error', 'New passwords do not match.'); return; }
    setSavingPw(true);
    const result = await changePassword(oldPw, newPw, confirmPw);
    setSavingPw(false);
    if (result.success) {
      Alert.alert('✓ Password Changed', result.message);
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } else Alert.alert('Error', result.message);
  };

  // ── Sessions ─────────────────────────────────────────────────────────────
  const [sessions, setSessions]             = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => { if (tab === 'security') loadSessions(); }, [tab]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const res = await SessionService.getActiveSessions();
    if (res.ok) setSessions(res.data?.sessions || []);
    setLoadingSessions(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    Alert.alert('Revoke Session', 'This device will be logged out immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        const res = await SessionService.revokeSession(sessionId);
        if (res.ok) setSessions(p => p.filter(s => s.id !== sessionId));
        else Alert.alert('Error', res.error || 'Failed.');
      }},
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert('Log Out All Devices', 'This will close all active sessions including this one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out All', style: 'destructive', onPress: async () => {
        const res = await SessionService.logoutAll();
        if (res.ok) await logout();
        else Alert.alert('Error', res.error || 'Failed.');
      }},
    ]);
  };

  const roleColor: Record<string, string> = {
    admin: '#dc2626', manager: WEEG_BLUE, agent: '#16a34a',
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>

      {/* ── Header style Weeg (dark navy → bleu → orange) ── */}
      <LinearGradient
        colors={[WEEG_NAVY, WEEG_BLUE2, WEEG_ORANGE]}
        style={ps.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Avatar */}
        <View style={ps.avatarRing}>
          <View style={ps.avatar}>
            <Text style={ps.avatarTxt}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Nom */}
        <Text style={ps.profileName}>{user?.name || '—'}</Text>

        {/* Email */}
        <View style={ps.infoRow}>
          <Ionicons name="mail-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={ps.infoTxt}>{user?.email || '—'}</Text>
        </View>

        {/* Badges : Rôle + Company */}
        <View style={ps.badgeRow}>
          <View style={[ps.badge, { backgroundColor: WEEG_ORANGE + 'cc' }]}>
            <Ionicons name="briefcase-outline" size={11} color="#fff" />
            <Text style={ps.badgeTxt}>{(user?.role || 'user').toUpperCase()}</Text>
          </View>
          {user?.companyName && (
            <View style={[ps.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="business-outline" size={11} color="#fff" />
              <Text style={ps.badgeTxt}>{user.companyName}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── Tabs ── */}
      <View style={ps.tabBar}>
        {availableTabs.map(id => {
          const icons: Record<Tab, string>  = { account: 'person-outline', security: 'shield-outline', permissions: 'key-outline' };
          const labels: Record<Tab, string> = { account: 'Account',        security: 'Security',        permissions: 'Permissions' };
          return (
            <TouchableOpacity key={id} style={[ps.tabBtn, tab === id && ps.tabBtnActive]} onPress={() => setTab(id)}>
              <Ionicons name={icons[id] as any} size={16} color={tab === id ? WEEG_BLUE : Colors.gray500} />
              <Text style={[ps.tabLabel, tab === id && { color: WEEG_BLUE, fontWeight: '700' }]}>{labels[id]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: Spacing.base, paddingBottom: 40 }}>

          {/* ── Account Tab ── */}
          {tab === 'account' && (
            <>
              <View style={[ps.card, Shadow.sm, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={ps.cardTitle}>My Information</Text>
                  {!editing ? (
                    <TouchableOpacity style={ps.editBtn} onPress={() => setEditing(true)}>
                      <Ionicons name="pencil-outline" size={14} color={WEEG_BLUE} />
                      <Text style={{ fontSize: 13, color: WEEG_BLUE, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={ps.editBtn} onPress={handleCancelEdit}>
                      <Ionicons name="close-outline" size={14} color={Colors.gray500} />
                      <Text style={{ fontSize: 13, color: Colors.gray500, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {!editing ? (
                  <>
                    {[
                      { icon: 'person-outline',    label: 'Name',    value: user?.name || '—' },
                      { icon: 'mail-outline',       label: 'Email',   value: user?.email || '—' },
                      { icon: 'call-outline',       label: 'Phone',   value: user?.phoneNumber || '—' },
                      { icon: 'briefcase-outline',  label: 'Role',    value: user?.role || '—', highlight: roleColor[user?.role || ''] },
                      { icon: 'business-outline',   label: 'Company', value: user?.companyName || '—' },
                      { icon: 'git-branch-outline', label: 'Branch',  value: user?.branchName || 'None', last: true },
                    ].map((item, i) => (
                      <View key={i} style={[ps.infoRowCard, (item as any).last && { borderBottomWidth: 0 }]}>
                        <Ionicons name={item.icon as any} size={16} color={Colors.gray400} />
                        <Text style={ps.infoLabel}>{item.label}</Text>
                        <Text style={[ps.infoVal, item.highlight ? { color: item.highlight, fontWeight: '700', textTransform: 'capitalize' } : undefined]}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <>
                    <Text style={ps.fieldLabel}>First Name *</Text>
                    <View style={[ps.inputBox, { marginBottom: 12 }]}>
                      <Ionicons name="person-outline" size={16} color={Colors.gray400} />
                      <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={Colors.gray400} style={ps.input} />
                    </View>

                    <Text style={ps.fieldLabel}>Last Name</Text>
                    <View style={[ps.inputBox, { marginBottom: 12 }]}>
                      <Ionicons name="person-outline" size={16} color={Colors.gray400} />
                      <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={Colors.gray400} style={ps.input} />
                    </View>

                    <Text style={ps.fieldLabel}>Phone Number</Text>
                    <View style={[ps.inputBox, { marginBottom: 16 }]}>
                      <Ionicons name="call-outline" size={16} color={Colors.gray400} />
                      <TextInput value={phone} onChangeText={setPhone} placeholder="+216 XX XXX XXX" placeholderTextColor={Colors.gray400} keyboardType="phone-pad" style={ps.input} />
                    </View>

                    <Text style={ps.fieldLabel}>Email (cannot be changed)</Text>
                    <View style={[ps.inputBox, { marginBottom: 16, backgroundColor: Colors.gray100 }]}>
                      <Ionicons name="mail-outline" size={16} color={Colors.gray400} />
                      <Text style={[ps.input, { color: Colors.gray500 }]}>{user?.email}</Text>
                    </View>

                    <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile}>
                      <LinearGradient colors={[WEEG_NAVY, WEEG_BLUE, WEEG_ORANGE]} style={ps.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {savingProfile
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <><Ionicons name="checkmark-outline" size={16} color="#fff" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Save Changes</Text></>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Statut */}
              <View style={[ps.card, Shadow.sm, { marginBottom: 16 }]}>
                <Text style={ps.cardTitle}>Account Status</Text>
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  <View style={[ps.statusChip, { backgroundColor: user?.isVerified ? '#dcfce7' : '#fef9c3' }]}>
                    <Ionicons name={user?.isVerified ? 'checkmark-circle' : 'time-outline'} size={14} color={user?.isVerified ? '#16a34a' : '#854d0e'} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: user?.isVerified ? '#16a34a' : '#854d0e' }}>
                      {user?.isVerified ? 'Verified' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[ps.statusChip, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="ellipse" size={8} color={WEEG_BLUE} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: WEEG_BLUE, textTransform: 'capitalize' }}>
                      {user?.status || 'active'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Déconnexion */}
              <TouchableOpacity
                style={[ps.logoutBtn, Shadow.sm]}
                onPress={() => Alert.alert('Log Out', 'Are you sure?', [
                  { text: 'Cancel' },
                  { text: 'Log Out', style: 'destructive', onPress: logout },
                ])}
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#dc2626' }}>Log Out</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <>
              <View style={[ps.card, Shadow.sm, { marginBottom: 16 }]}>
                <Text style={ps.cardTitle}>Change Password</Text>
                <Text style={{ fontSize: 12, color: Colors.gray500, marginBottom: 16 }}>
                  After changing, all sessions will be closed.
                </Text>
                {[
                  { label: 'Current Password',      value: oldPw,     setter: setOldPw,     show: showOld, toggle: () => setShowOld(!showOld) },
                  { label: 'New Password',           value: newPw,     setter: setNewPw,     show: showNew, toggle: () => setShowNew(!showNew) },
                  { label: 'Confirm New Password',   value: confirmPw, setter: setConfirmPw, show: showNew, toggle: undefined },
                ].map((field, i) => (
                  <View key={i} style={{ marginBottom: 14 }}>
                    <Text style={ps.fieldLabel}>{field.label}</Text>
                    <View style={ps.inputBox}>
                      <Ionicons name="lock-closed-outline" size={16} color={Colors.gray400} />
                      <TextInput
                        value={field.value} onChangeText={field.setter}
                        secureTextEntry={!field.show}
                        placeholder="••••••••" placeholderTextColor={Colors.gray400}
                        style={ps.input} editable={!savingPw}
                      />
                      {field.toggle && (
                        <TouchableOpacity onPress={field.toggle}>
                          <Ionicons name={field.show ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity onPress={handleChangePassword} disabled={savingPw}>
                  <LinearGradient colors={[WEEG_NAVY, WEEG_BLUE, WEEG_ORANGE]} style={ps.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {savingPw
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Ionicons name="lock-closed-outline" size={16} color="#fff" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Update Password</Text></>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={[ps.card, Shadow.sm]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={ps.cardTitle}>Active Sessions</Text>
                  <TouchableOpacity onPress={loadSessions}>
                    <Ionicons name="refresh-outline" size={18} color={WEEG_BLUE} />
                  </TouchableOpacity>
                </View>
                {loadingSessions ? (
                  <ActivityIndicator color={WEEG_BLUE} />
                ) : sessions.length === 0 ? (
                  <Text style={{ fontSize: 13, color: Colors.gray400, textAlign: 'center', marginVertical: 16 }}>
                    No active sessions found
                  </Text>
                ) : sessions.map((s, i) => (
                  <View key={s.id} style={[ps.sessionRow, i === sessions.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={ps.sessionIcon}>
                      <Ionicons name="phone-portrait-outline" size={18} color={WEEG_BLUE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.foreground }}>{s.device_name || 'Unknown device'}</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray500 }}>{s.ip_address}</Text>
                      <Text style={{ fontSize: 10, color: Colors.gray400 }}>Last active: {new Date(s.last_activity).toLocaleString()}</Text>
                    </View>
                    {!s.is_current ? (
                      <TouchableOpacity onPress={() => handleRevokeSession(s.id)} style={ps.revokeBtn}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>Revoke</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={ps.currentBadge}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>Current</Text>
                      </View>
                    )}
                  </View>
                ))}
                {sessions.length > 0 && (
                  <TouchableOpacity style={{ marginTop: 12 }} onPress={handleLogoutAll}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626', textAlign: 'center' }}>
                      Log out all devices
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── Permissions Tab (agent uniquement) ── */}
          {tab === 'permissions' && user?.role === 'agent' && (
            <View style={[ps.card, Shadow.sm]}>
              <Text style={ps.cardTitle}>My Permissions</Text>
              <Text style={{ fontSize: 12, color: Colors.gray500, marginBottom: 14 }}>
                Features and access granted to your account ({(user?.permissions || []).length} permissions)
              </Text>
              {(user?.permissions || []).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="key-outline" size={36} color={Colors.gray300} />
                  <Text style={{ fontSize: 13, color: Colors.gray400, marginTop: 8 }}>No permissions assigned yet</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(user?.permissions || []).map((p: string, i: number) => (
                    <View key={i} style={ps.permChip}>
                      <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                      <Text style={ps.permChipTxt}>{p.replace(/-/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ps = StyleSheet.create({
  // Header dark navy → bleu → orange (style splash Weeg)
  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: WEEG_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt:   { fontSize: 30, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },

  // Email en ligne avec icône sous le nom
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  infoTxt: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Badges rôle + company
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Tab bar
  tabBar:      { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:{ borderBottomColor: WEEG_BLUE },
  tabLabel:    { fontSize: 11, fontWeight: '500', color: Colors.gray500 },

  // Cards
  card:      { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
  editBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.lg, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },

  // Lignes info (dans la card)
  infoRowCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  infoLabel:   { fontSize: 13, color: Colors.gray500, width: 70 },
  infoVal:     { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.foreground, textAlign: 'right' },

  // Formulaire
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.foreground, marginBottom: 6 },
  inputBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.gray200, borderRadius: BorderRadius.lg, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.gray50 },
  input:      { flex: 1, fontSize: 14, color: Colors.foreground },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: BorderRadius.lg },

  // Status
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingVertical: 16, borderWidth: 1, borderColor: '#fecaca' },

  // Sessions
  sessionRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  sessionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  revokeBtn:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.lg, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  currentBadge:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.lg, backgroundColor: '#dcfce7' },

  // Permissions
  permChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.gray50, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gray100 },
  permChipTxt: { fontSize: 11, color: Colors.foreground, fontWeight: '500', textTransform: 'capitalize' },
});