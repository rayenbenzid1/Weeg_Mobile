/**
 * ProfileScreen.tsx — WEEG v2
 * Tabs: Account (view + edit profile) · Security (change password + sessions)
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadow } from '../../constants/theme';
import {
  Avatar, FormField, PrimaryButton, AlertBanner, EmptyState,
} from '../../components/SharedComponents';
import { useAuth } from '../../contexts/AuthContext';
import { UserService, SessionService } from '../../lib/api';

type Tab = 'account' | 'security';

// ─── Info Row (read-only) ─────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={S.infoRow}>
      <View style={S.infoIconWrap}>
        <Ionicons name={icon as any} size={13} color={Colors.blue} />
      </View>
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────
function SessionRow({ session, onRevoke }: { session: any; onRevoke: (id: string) => void }) {
  return (
    <View style={S.sessionRow}>
      <View style={[S.sessionIcon, session.is_current && { backgroundColor:'rgba(26,92,240,0.08)' }]}>
        <Ionicons name="phone-portrait-outline" size={15} color={session.is_current ? Colors.blue : Colors.text3} />
      </View>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={{ fontSize:13, fontWeight:'600', color:Colors.text }}>
          {session.device_name || 'Unknown device'}
        </Text>
        <Text style={{ fontSize:10.5, color:Colors.text3, marginTop:1 }}>{session.ip_address}</Text>
        <Text style={{ fontSize:10, color:Colors.text3, marginTop:1 }}>
          {new Date(session.last_activity).toLocaleString()}
        </Text>
      </View>
      {session.is_current ? (
        <View style={S.currentBadge}>
          <View style={{ width:5, height:5, borderRadius:3, backgroundColor:Colors.green }} />
          <Text style={{ fontSize:10, fontWeight:'700', color:Colors.greenText }}>CURRENT</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onRevoke(session.id)}
          style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:BorderRadius.md, backgroundColor:Colors.redBg, borderWidth:1, borderColor:'#fecaca' }}
        >
          <Text style={{ fontSize:11, fontWeight:'700', color:Colors.red }}>Revoke</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Strength Indicator ───────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1;
  const colors = ['#e83535', '#f59e0b', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];
  return (
    <View style={{ marginTop:6 }}>
      <View style={{ flexDirection:'row', gap:4, marginBottom:5 }}>
        {[0,1,2].map(i => (
          <View key={i} style={{ flex:1, height:3, borderRadius:2, backgroundColor: i < score ? colors[score - 1] : Colors.border }} />
        ))}
      </View>
      <Text style={{ fontSize:10.5, color:colors[score - 1], fontWeight:'600' }}>
        {labels[score - 1]} password
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, logout, changePassword, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('account');

  // ── Account ──────────────────────────────────────────────────────────────
  const [editMode, setEditMode]         = useState(false);
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [phone, setPhone]               = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]     = useState<{ type:'success'|'error'; text:string }|null>(null);

  useEffect(() => {
    setFirstName(user?.firstName || user?.name?.split(' ')[0] || '');
    setLastName(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
    setPhone(user?.phoneNumber || '');
  }, [user]);

  const cancelEdit = () => {
    setFirstName(user?.firstName || user?.name?.split(' ')[0] || '');
    setLastName(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
    setPhone(user?.phoneNumber || '');
    setEditMode(false);
    setProfileMsg(null);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      setProfileMsg({ type:'error', text:'First name is required.' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await UserService.updateProfile({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      phone_number: phone.trim() || undefined,
    });
    setSavingProfile(false);
    if (res.ok) {
      await refreshProfile();
      setEditMode(false);
      setProfileMsg({ type:'success', text:'Profile updated successfully!' });
    } else {
      setProfileMsg({ type:'error', text: res.error || 'Failed to update profile.' });
    }
  };

  // ── Security ──────────────────────────────────────────────────────────────
  const [oldPw, setOldPw]               = useState('');
  const [newPw, setNewPw]               = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [showOld, setShowOld]           = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [savingPw, setSavingPw]         = useState(false);
  const [pwMsg, setPwMsg]               = useState<{ type:'success'|'error'; text:string }|null>(null);
  const [sessions, setSessions]         = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (tab === 'security') loadSessions();
  }, [tab]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const res = await SessionService.getActiveSessions();
    if (res.ok) setSessions(res.data?.sessions || []);
    setLoadingSessions(false);
  };

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      setPwMsg({ type:'error', text:'Please fill in all fields.' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type:'error', text:'Password must be at least 8 characters.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type:'error', text:'Passwords do not match.' });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    const result = await changePassword(oldPw, newPw, confirmPw);
    setSavingPw(false);
    if (result.success) {
      setPwMsg({ type:'success', text: result.message });
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } else {
      setPwMsg({ type:'error', text: result.message });
    }
  };

  const handleRevokeSession = (id: string) => {
    Alert.alert('Revoke Session', 'This device will be logged out.', [
      { text:'Cancel', style:'cancel' },
      { text:'Revoke', style:'destructive', onPress: async () => {
        const res = await SessionService.revokeSession(id);
        if (res.ok) setSessions(prev => prev.filter(s => s.id !== id));
        else Alert.alert('Error', res.error || 'Failed.');
      }},
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert('Log Out All Devices', 'All sessions will be closed.', [
      { text:'Cancel', style:'cancel' },
      { text:'Log Out All', style:'destructive', onPress: async () => {
        const res = await SessionService.logoutAll();
        if (res.ok) await logout();
        else Alert.alert('Error', res.error || 'Failed.');
      }},
    ]);
  };

  const roleColors: Record<string,string> = { admin:Colors.red, manager:Colors.blue, agent:Colors.green };
  const initials = (user?.name || 'U').split(' ').map((w:string) => w[0] || '').join('').slice(0, 2).toUpperCase();
  const mismatch = newPw && confirmPw && newPw !== confirmPw;

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id:'account',  icon:'person-outline',  label:'Account'  },
    { id:'security', icon:'shield-outline',  label:'Security' },
  ];

  return (
    <View style={{ flex:1, backgroundColor:Colors.bg }}>
      {/* Avatar header */}
      <View style={S.avatarHeader}>
        <View style={S.bgCircle1} />
        <View style={S.bgCircle2} />
        <View style={S.avatarRing}>
          <LinearGradient colors={[Colors.blue, Colors.orange]} style={S.avatarGrad} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
            <Text style={S.avatarTxt}>{initials}</Text>
          </LinearGradient>
        </View>
        <Text style={S.headerName}>{user?.name || '—'}</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:12 }}>
          <Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.5)" />
          <Text style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{user?.email || '—'}</Text>
        </View>
        <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          <View style={[S.badge, { backgroundColor: Colors.orange + 'bb' }]}>
            <Ionicons name="briefcase-outline" size={10} color="#fff" />
            <Text style={S.badgeTxt}>{(user?.role || 'user').toUpperCase()}</Text>
          </View>
          {user?.companyName && (
            <View style={[S.badge, { backgroundColor:'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="business-outline" size={10} color="#fff" />
              <Text style={S.badgeTxt}>{user.companyName}</Text>
            </View>
          )}
          <View style={[S.badge, {
            backgroundColor: user?.status === 'active' || user?.status === 'approved'
              ? Colors.green + 'aa' : Colors.amber + 'aa',
          }]}>
            <View style={{ width:5, height:5, borderRadius:3, backgroundColor:'#fff' }} />
            <Text style={S.badgeTxt}>{(user?.status || 'active').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={S.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[S.tabItem, tab === t.id && S.tabItemActive]}
            onPress={() => { setTab(t.id); setProfileMsg(null); setPwMsg(null); }}
          >
            <Ionicons name={t.icon as any} size={14} color={tab === t.id ? Colors.blue : Colors.text3} />
            <Text style={[S.tabLabel, tab === t.id && S.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, paddingBottom:48 }}>

        {/* ═══════════════ ACCOUNT TAB ═══════════════ */}
        {tab === 'account' && (
          <>
            {profileMsg && <AlertBanner type={profileMsg.type} message={profileMsg.text} />}

            {/* My Information card */}
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:editMode ? 14 : 4 }}>
                <View style={S.cardIconWrap}>
                  <Ionicons name="person-outline" size={15} color={Colors.blue} />
                </View>
                <Text style={S.cardTitle}>My Information</Text>
                <TouchableOpacity
                  style={[S.editPill, editMode && S.editPillCancel]}
                  onPress={() => editMode ? cancelEdit() : setEditMode(true)}
                >
                  <Ionicons name={editMode ? 'close-outline' : 'pencil-outline'} size={12} color={editMode ? Colors.text2 : Colors.blue} />
                  <Text style={[S.editPillTxt, editMode && { color:Colors.text2 }]}>
                    {editMode ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              {editMode ? (
                <>
                  <FormField
                    label="First Name *"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                  <FormField
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                  {user?.role !== 'admin' && (
                    <FormField
                      label="Phone Number"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+218 XX XXX XXXX"
                      icon="call-outline"
                      keyboardType="phone-pad"
                    />
                  )}
                  <FormField
                    label="Email (cannot be changed)"
                    value={user?.email || ''}
                    onChangeText={() => {}}
                    placeholder=""
                    icon="mail-outline"
                    editable={false}
                  />
                  <PrimaryButton
                    label="Save Changes"
                    onPress={handleSaveProfile}
                    loading={savingProfile}
                    icon="checkmark-outline"
                  />
                </>
              ) : (
                <>
                  <InfoRow icon="person-outline"    label="Name"    value={user?.name || '—'} />
                  <InfoRow icon="mail-outline"      label="Email"   value={user?.email || '—'} />
                  <InfoRow icon="briefcase-outline" label="Role"    value={user?.role || '—'} />
                  {user?.role !== 'admin' && (
                    <InfoRow icon="call-outline"     label="Phone"   value={user?.phoneNumber || '—'} />
                  )}
                  {user?.role !== 'admin' && (
                    <InfoRow icon="business-outline" label="Company" value={user?.companyName || '—'} />
                  )}
                </>
              )}
            </View>

            {/* Account Status */}
            {user?.role !== 'admin' && (
              <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
                  <View style={S.cardIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={15} color={Colors.blue} />
                  </View>
                  <Text style={S.cardTitle}>Account Status</Text>
                </View>
                <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
                  <View style={[S.statusChip, { backgroundColor: user?.isVerified ? Colors.greenBg : Colors.amberBg }]}>
                    <Ionicons name={user?.isVerified ? 'checkmark-circle' : 'time-outline'} size={13} color={user?.isVerified ? Colors.green : Colors.amber} />
                    <Text style={[S.statusChipTxt, { color: user?.isVerified ? Colors.greenText : Colors.amberText }]}>
                      {user?.isVerified ? 'Verified' : 'Pending Verification'}
                    </Text>
                  </View>
                  <View style={[S.statusChip, { backgroundColor:'rgba(26,92,240,0.08)' }]}>
                    <View style={{ width:6, height:6, borderRadius:3, backgroundColor:Colors.blue }} />
                    <Text style={[S.statusChipTxt, { color:Colors.blue, textTransform:'capitalize' }]}>
                      {user?.status || 'active'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Logout */}
            <TouchableOpacity
              style={[S.logoutBtn, Shadow.sm, { marginTop:12 }]}
              onPress={() => Alert.alert('Log Out', 'Are you sure?', [
                { text:'Cancel' },
                { text:'Log Out', style:'destructive', onPress: logout },
              ])}
            >
              <Ionicons name="log-out-outline" size={17} color={Colors.red} />
              <Text style={{ fontSize:14, fontWeight:'700', color:Colors.red }}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ═══════════════ SECURITY TAB ═══════════════ */}
        {tab === 'security' && (
          <>
            {pwMsg && <AlertBanner type={pwMsg.type} message={pwMsg.text} />}

            {/* Change Password */}
            <View style={[S.card, Shadow.sm]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:16 }}>
                <View style={S.cardIconWrap}>
                  <Ionicons name="lock-closed-outline" size={15} color={Colors.blue} />
                </View>
                <View>
                  <Text style={S.cardTitle}>Change Password</Text>
                  <Text style={{ fontSize:11, color:Colors.text3, marginTop:1 }}>All sessions will be closed after change</Text>
                </View>
              </View>

              <FormField
                label="Current Password"
                value={oldPw}
                onChangeText={v => { setOldPw(v); setPwMsg(null); }}
                placeholder="••••••••"
                icon="lock-closed-outline"
                secure
                showSecure={showOld}
                onToggleSecure={() => setShowOld(!showOld)}
              />

              <FormField
                label="New Password"
                value={newPw}
                onChangeText={v => { setNewPw(v); setPwMsg(null); }}
                placeholder="Min. 8 characters"
                icon="lock-open-outline"
                secure
                showSecure={showNew}
                onToggleSecure={() => setShowNew(!showNew)}
                error={newPw.length > 0 && newPw.length < 8 ? 'At least 8 characters required' : undefined}
              />
              {newPw.length >= 8 && <PasswordStrength password={newPw} />}

              <View style={{ marginTop:newPw.length >= 8 ? 14 : 0 }}>
                <FormField
                  label="Confirm New Password"
                  value={confirmPw}
                  onChangeText={v => { setConfirmPw(v); setPwMsg(null); }}
                  placeholder="Repeat new password"
                  icon="lock-open-outline"
                  secure
                  showSecure={showConfirm}
                  onToggleSecure={() => setShowConfirm(!showConfirm)}
                  error={mismatch ? 'Passwords do not match' : undefined}
                />
              </View>

              <PrimaryButton
                label="Update Password"
                onPress={handleChangePassword}
                loading={savingPw}
                icon="lock-closed-outline"
              />
            </View>

            {/* Active Sessions */}
            <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
                <View style={S.cardIconWrap}>
                  <Ionicons name="phone-portrait-outline" size={15} color={Colors.blue} />
                </View>
                <Text style={[S.cardTitle, { flex:1 }]}>Active Sessions</Text>
                <TouchableOpacity onPress={loadSessions} style={{ width:30, height:30, borderRadius:BorderRadius.md, backgroundColor:'rgba(26,92,240,0.08)', alignItems:'center', justifyContent:'center' }}>
                  <Ionicons name="refresh-outline" size={14} color={Colors.blue} />
                </TouchableOpacity>
              </View>

              {loadingSessions ? (
                <ActivityIndicator color={Colors.blue} style={{ marginVertical:16 }} />
              ) : sessions.length === 0 ? (
                <EmptyState icon="phone-portrait-outline" title="No active sessions" />
              ) : (
                sessions.map((s, i) => (
                  <SessionRow key={s.id || i} session={s} onRevoke={handleRevokeSession} />
                ))
              )}

              {sessions.length > 0 && (
                <TouchableOpacity onPress={handleLogoutAll} style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, marginTop:14, paddingTop:12, borderTopWidth:1, borderTopColor:Colors.border }}>
                  <Ionicons name="log-out-outline" size={14} color={Colors.red} />
                  <Text style={{ fontSize:12, fontWeight:'700', color:Colors.red }}>Log out all devices</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  avatarHeader: {
    backgroundColor:Colors.navy2,
    paddingHorizontal:24, paddingTop:40, paddingBottom:24,
    alignItems:'center', overflow:'hidden', position:'relative',
  },
  bgCircle1:   { position:'absolute', width:200, height:200, borderRadius:100, borderWidth:1, borderColor:'rgba(26,92,240,0.12)', top:-60, right:-60 },
  bgCircle2:   { position:'absolute', width:120, height:120, borderRadius:60,  borderWidth:1, borderColor:'rgba(240,112,32,0.1)',  bottom:-20, left:-20 },
  avatarRing:  { width:84, height:84, borderRadius:26, borderWidth:2.5, borderColor:Colors.orange, padding:3, marginBottom:12 },
  avatarGrad:  { flex:1, borderRadius:22, alignItems:'center', justifyContent:'center' },
  avatarTxt:   { fontSize:26, fontWeight:'900', color:'#fff', letterSpacing:1 },
  headerName:  { fontSize:20, fontWeight:'700', color:'#fff', letterSpacing:-0.3, marginBottom:4 },
  badge:       { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:4, borderRadius:BorderRadius.full },
  badgeTxt:    { fontSize:10, fontWeight:'800', color:'#fff', letterSpacing:0.5 },

  tabBar:      { flexDirection:'row', backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border },
  tabItem:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:12, borderBottomWidth:2, borderBottomColor:'transparent' },
  tabItemActive:{ borderBottomColor:Colors.blue },
  tabLabel:    { fontSize:12, fontWeight:'500', color:Colors.text3 },
  tabLabelActive:{ color:Colors.blue, fontWeight:'700' },

  card:        { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:16, borderWidth:1, borderColor:Colors.border },
  cardIconWrap:{ width:30, height:30, borderRadius:BorderRadius.md, backgroundColor:'rgba(26,92,240,0.08)', alignItems:'center', justifyContent:'center' },
  cardTitle:   { flex:1, fontSize:14, fontWeight:'700', color:Colors.text },

  editPill:       { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:BorderRadius.md, backgroundColor:'rgba(26,92,240,0.08)', borderWidth:1, borderColor:'rgba(26,92,240,0.2)' },
  editPillCancel: { backgroundColor:Colors.surface2, borderColor:Colors.border },
  editPillTxt:    { fontSize:12, fontWeight:'600', color:Colors.blue },

  infoRow:     { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.bg },
  infoIconWrap:{ width:26, height:26, borderRadius:BorderRadius.md, backgroundColor:'rgba(26,92,240,0.08)', alignItems:'center', justifyContent:'center' },
  infoLabel:   { fontSize:12, color:Colors.text3, width:64 },
  infoValue:   { flex:1, fontSize:13, fontWeight:'500', color:Colors.text, textAlign:'right' },

  statusChip:    { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:7, borderRadius:BorderRadius.full },
  statusChipTxt: { fontSize:12, fontWeight:'700' },

  logoutBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, paddingVertical:14,
    borderWidth:1.5, borderColor:'#fecaca',
  },

  sessionRow:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:11, borderBottomWidth:1, borderBottomColor:Colors.bg },
  sessionIcon:   { width:36, height:36, borderRadius:BorderRadius.lg, backgroundColor:Colors.surface2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  currentBadge:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:9, paddingVertical:5, borderRadius:BorderRadius.md, backgroundColor:Colors.greenBg },
});