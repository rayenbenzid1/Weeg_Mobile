/**
 * SettingsScreen.tsx — WEEG v2
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../lib/api';

function ToggleRow({ label, desc, value, onChange, isLast = false }: {
  label: string; desc: string; value: boolean;
  onChange: (v: boolean) => void; isLast?: boolean;
}) {
  return (
    <View style={[S.row, !isLast && S.rowBorder]}>
      <View style={{ flex:1 }}>
        <Text style={S.rowLabel}>{label}</Text>
        <Text style={S.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false:'#e2e8f0', true: Colors.blue + 'cc' }}
        thumbColor={value ? Colors.blue : Colors.white}
        ios_backgroundColor="#e2e8f0"
      />
    </View>
  );
}

function NavRow({ icon, label, desc, onPress, danger = false, isLast = false }: {
  icon: string; label: string; desc?: string;
  onPress: () => void; danger?: boolean; isLast?: boolean;
}) {
  return (
    <TouchableOpacity style={[S.row, !isLast && S.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={[S.navIcon, { backgroundColor: danger ? Colors.redBg : 'rgba(26,92,240,0.08)' }]}>
        <Ionicons name={icon as any} size={16} color={danger ? Colors.red : Colors.blue} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={[S.rowLabel, danger && { color:Colors.red }]}>{label}</Text>
        {desc && <Text style={S.rowDesc}>{desc}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={14} color={danger ? '#fca5a5' : Colors.text3} />
    </TouchableOpacity>
  );
}

function SectionCard({ icon, color, title, children }: {
  icon: string; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <View style={[S.card, Shadow.sm]}>
      <View style={S.cardHeader}>
        <View style={[S.cardIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={15} color={color} />
        </View>
        <Text style={S.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const [notifs,    setNotifs]    = useState(true);
  const [emailA,    setEmailA]    = useState(true);
  const [pushA,     setPushA]     = useState(true);
  const [autoSync,  setAutoSync]  = useState(true);

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text:'Cancel', style:'cancel' },
      { text:'Log Out', style:'destructive', onPress: logout },
    ]);

  const handleLogoutAll = () =>
    Alert.alert('Log Out All Devices', 'This will close all active sessions on all your devices.', [
      { text:'Cancel', style:'cancel' },
      { text:'Log Out All', style:'destructive', onPress: async () => {
        const res = await SessionService.logoutAll();
        if (res.ok) { Alert.alert('Done', `${res.data?.sessions_revoked || 0} session(s) closed.`); await logout(); }
        else Alert.alert('Error', res.error || 'An error occurred.');
      }},
    ]);

  const initials = (user?.name || 'U').split(' ').map((w:string) => w[0] || '').join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Colors.bg }} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={[Colors.navy2, Colors.navy3]} style={S.header} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
        <View style={S.bgCircle1} />
        <View style={S.bgCircle2} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
          <LinearGradient colors={[Colors.blue, Colors.orange]} style={S.headerAvatar} start={{ x:0,y:0 }} end={{ x:1,y:1 }}>
            <Text style={{ fontSize:17, fontWeight:'900', color:'#fff' }}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex:1 }}>
            <Text style={S.headerName} numberOfLines={1}>{user?.name || '—'}</Text>
            <Text style={S.headerEmail} numberOfLines={1}>{user?.email || '—'}</Text>
            <View style={{ flexDirection:'row', gap:6, marginTop:5 }}>
              <View style={[S.headerBadge, { backgroundColor: Colors.orange + 'bb' }]}>
                <Text style={S.headerBadgeTxt}>{(user?.role || 'user').toUpperCase()}</Text>
              </View>
              {user?.companyName && (
                <View style={[S.headerBadge, { backgroundColor:'rgba(255,255,255,0.12)' }]}>
                  <Text style={S.headerBadgeTxt}>{user.companyName}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={S.profileArrowBtn}>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={S.statsRow}>
          {[
            { icon:'notifications-outline', label: notifs ? 'Notifs On' : 'Notifs Off', color: notifs ? Colors.blue : Colors.text3 },
            { icon:'cloud-outline',         label: autoSync ? 'Auto-sync' : 'Manual',     color: autoSync ? Colors.green : Colors.text3 },
            { icon:'shield-checkmark-outline', label: user?.isVerified ? 'Verified' : 'Pending', color: user?.isVerified ? Colors.green : Colors.text3 },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={{ width:1, height:16, backgroundColor:'rgba(255,255,255,0.1)' }} />}
              <View style={S.statItem}>
                <Ionicons name={item.icon as any} size={12} color={item.color} />
                <Text style={[S.statLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, paddingBottom:48 }}>

        {/* Notifications */}
        <SectionCard icon="notifications-outline" color={Colors.blue} title="Notifications">
          <ToggleRow label="Push Notifications" desc="Receive alerts on your device" value={notifs} onChange={setNotifs} />
          <ToggleRow label="Email Alerts" desc="Get critical alerts via email" value={emailA} onChange={setEmailA} />
          <ToggleRow label="Critical Push Alerts" desc="Immediate emergency notifications" value={pushA} onChange={setPushA} isLast />
        </SectionCard>

        {/* Data & Sync */}
        <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
          <View style={S.cardHeader}>
            <View style={[S.cardIcon, { backgroundColor: Colors.green + '18' }]}>
              <Ionicons name="cloud-outline" size={15} color={Colors.green} />
            </View>
            <Text style={S.cardTitle}>Data & Sync</Text>
          </View>
          <ToggleRow label="Auto Sync" desc="Automatically sync data in background" value={autoSync} onChange={setAutoSync} isLast />
        </View>

        {/* Account */}
        <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
          <View style={S.cardHeader}>
            <View style={[S.cardIcon, { backgroundColor:'rgba(26,92,240,0.08)' }]}>
              <Ionicons name="person-outline" size={15} color={Colors.blue} />
            </View>
            <Text style={S.cardTitle}>Account</Text>
          </View>
          <NavRow icon="person-outline"          label="My Profile"         onPress={() => navigation.navigate('Profile')} />
          <NavRow icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => navigation.navigate('Profile', { tab:'security' })} />
          <NavRow icon="key-outline"              label="Permissions"        onPress={() => navigation.navigate('Profile', { tab:'permissions' })} isLast />
        </View>

        {/* Support */}
        <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
          <View style={S.cardHeader}>
            <View style={[S.cardIcon, { backgroundColor:Colors.surface2 }]}>
              <Ionicons name="help-circle-outline" size={15} color={Colors.text3} />
            </View>
            <Text style={S.cardTitle}>Support & Legal</Text>
          </View>
          <NavRow icon="help-circle-outline"        label="Help & Support"        desc="Contact: support@weeg.app" onPress={() => Alert.alert('Help', 'Contact: support@weeg.app')} />
          <NavRow icon="document-text-outline"      label="Terms & Privacy Policy" onPress={() => {}} />
          <NavRow icon="information-circle-outline" label="About WEEG"            desc="Financial Analytics · v1.0.0" onPress={() => Alert.alert('WEEG', 'Financial Analytics & System Intelligence\nVersion 1.0.0')} isLast />
        </View>

        {/* Session Management */}
        <View style={[S.card, Shadow.sm, { marginTop:12 }]}>
          <View style={S.cardHeader}>
            <View style={[S.cardIcon, { backgroundColor:Colors.redBg }]}>
              <Ionicons name="log-out-outline" size={15} color={Colors.red} />
            </View>
            <Text style={S.cardTitle}>Session Management</Text>
          </View>
          <NavRow icon="log-out-outline"      label="Log Out"             onPress={handleLogout}    danger />
          <NavRow icon="phone-portrait-outline" label="Log Out All Devices" desc="Closes all active sessions" onPress={handleLogoutAll} danger isLast />
        </View>

        {/* Footer */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, marginTop:24 }}>
          <View style={{ width:3, height:3, borderRadius:2, backgroundColor:Colors.text3 }} />
          <Text style={{ fontSize:11, color:Colors.text3 }}>WEEG v1.0.0</Text>
          <View style={{ width:3, height:3, borderRadius:2, backgroundColor:Colors.text3 }} />
          <Text style={{ fontSize:11, color:Colors.text3 }}>Where Data Finds Balance</Text>
          <View style={{ width:3, height:3, borderRadius:2, backgroundColor:Colors.text3 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  header:         { paddingHorizontal:20, paddingTop:18, paddingBottom:18, overflow:'hidden', position:'relative' },
  bgCircle1:      { position:'absolute', width:180, height:180, borderRadius:90, borderWidth:1, borderColor:'rgba(26,92,240,0.1)', top:-50, right:-40 },
  bgCircle2:      { position:'absolute', width:100, height:100, borderRadius:50, borderWidth:1, borderColor:'rgba(240,112,32,0.08)', bottom:10, left:-20 },
  headerAvatar:   { width:52, height:52, borderRadius:BorderRadius.xl, alignItems:'center', justifyContent:'center', flexShrink:0 },
  headerName:     { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:-0.2 },
  headerEmail:    { fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:1 },
  headerBadge:    { paddingHorizontal:8, paddingVertical:3, borderRadius:BorderRadius.full },
  headerBadgeTxt: { fontSize:9, fontWeight:'800', color:'#fff', letterSpacing:0.5 },
  profileArrowBtn:{ width:30, height:30, borderRadius:BorderRadius.md, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center' },
  statsRow:       { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:BorderRadius.lg, paddingVertical:10, paddingHorizontal:16, marginTop:14, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  statItem:       { flex:1, flexDirection:'row', alignItems:'center', gap:5, justifyContent:'center' },
  statLabel:      { fontSize:11, fontWeight:'600' },
  card:           { backgroundColor:Colors.surface, borderRadius:BorderRadius.xl, padding:16, borderWidth:1, borderColor:Colors.border },
  cardHeader:     { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottomWidth:1, borderBottomColor:Colors.bg },
  cardIcon:       { width:32, height:32, borderRadius:BorderRadius.md, alignItems:'center', justifyContent:'center' },
  cardTitle:      { fontSize:14, fontWeight:'700', color:Colors.text },
  row:            { flexDirection:'row', alignItems:'center', paddingVertical:12, gap:12 },
  rowBorder:      { borderBottomWidth:1, borderBottomColor:Colors.bg },
  rowLabel:       { fontSize:13, fontWeight:'600', color:Colors.text },
  rowDesc:        { fontSize:11, color:Colors.text3, marginTop:2 },
  navIcon:        { width:34, height:34, borderRadius:BorderRadius.lg, alignItems:'center', justifyContent:'center', flexShrink:0 },
});