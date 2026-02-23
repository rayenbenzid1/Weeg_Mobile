/**
 * SettingsScreen.tsx — Paramètres connectés au backend Django WEEG
 * Accessible depuis le tab Profile → bouton Settings
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { SessionService } from '../../lib/api';

const WEEG_BLUE = '#1a6fe8';
const WEEG_ORANGE = '#e87c1a';

export function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  // Préférences locales (à connecter à un vrai backend de préférences si nécessaire)
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleLogoutAll = async () => {
    Alert.alert(
      'Log Out All Devices',
      'This will close all active sessions on all your devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All', style: 'destructive', onPress: async () => {
            const res = await SessionService.logoutAll();
            if (res.ok) {
              Alert.alert('Done', `${res.data?.sessions_revoked || 0} session(s) closed.`);
              await logout();
            } else {
              Alert.alert('Error', res.error || 'An error occurred.');
            }
          }
        },
      ],
    );
  };

  const settingsSections = [
    {
      title: 'Notifications',
      icon: 'notifications-outline' as const,
      color: WEEG_BLUE,
      items: [
        { label: 'Push Notifications', desc: 'Receive alerts on your device', value: notifications, setter: setNotifications },
        { label: 'Email Alerts', desc: 'Get critical alerts via email', value: emailAlerts, setter: setEmailAlerts },
        { label: 'Critical Push Alerts', desc: 'Immediate notifications for emergencies', value: pushAlerts, setter: setPushAlerts },
      ],
    },
    {
      title: 'Data & Sync',
      icon: 'cloud-outline' as const,
      color: Colors.success,
      items: [
        { label: 'Auto Sync', desc: 'Automatically sync data in background', value: autoSync, setter: setAutoSync },
      ],
    },
  ];

  const navItems = [
    { icon: 'person-outline' as const, label: 'My Profile', color: WEEG_BLUE, onPress: () => navigation.navigate('Profile') },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', color: Colors.warning, onPress: () => navigation.navigate('Profile', { tab: 'security' }) },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', color: Colors.info, onPress: () => Alert.alert('Help', 'Contact: support@weeg.app') },
    { icon: 'document-text-outline' as const, label: 'Terms & Privacy Policy', color: Colors.gray500, onPress: () => {} },
    { icon: 'information-circle-outline' as const, label: 'About WEEG', color: Colors.gray500, onPress: () => Alert.alert('WEEG', 'Financial Analytics & System Intelligence\nVersion 1.0.0') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.gray50 }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Profile Card */}
          <View style={[styles.profileCard, Shadow.md]}>
            <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={styles.profileAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.profileAvatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name || '—'}</Text>
              <Text style={styles.profileEmail}>{user?.email || '—'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{(user?.role || 'user').toUpperCase()}</Text>
                </View>
                {user?.companyName && (
                  <View style={[styles.roleBadge, { backgroundColor: Colors.indigo50 }]}>
                    <Text style={[styles.roleBadgeText, { color: Colors.indigo600 }]}>{user.companyName}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Toggle Sections */}
          {settingsSections.map((section, si) => (
            <View key={si} style={[styles.card, Shadow.sm]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.color + '18' }]}>
                  <Ionicons name={section.icon} size={18} color={section.color} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.items.map((item, i) => (
                <View key={i} style={[styles.settingRow, i > 0 && styles.settingRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.setter}
                    trackColor={{ false: Colors.gray200, true: WEEG_BLUE }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray200}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* Navigation Links */}
          <View style={[styles.card, Shadow.sm]}>
            {navItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.navRow, i > 0 && styles.navRowBorder]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Security Actions */}
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#fee2e218' }]}>
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              </View>
              <Text style={styles.sectionTitle}>Session Management</Text>
            </View>

            <TouchableOpacity style={[styles.navRow]} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.navIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              </View>
              <Text style={[styles.navLabel, { color: '#dc2626' }]}>Log Out</Text>
              <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navRow, styles.navRowBorder]} onPress={handleLogoutAll} activeOpacity={0.7}>
              <View style={[styles.navIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: '#dc2626' }]}>Log Out All Devices</Text>
                <Text style={styles.settingDesc}>Closes all active sessions everywhere</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>WEEG v1.0.0 · Financial Analytics & System Intelligence</Text>
          <Text style={[styles.versionText, { marginTop: 2 }]}>Where Data Finds Balance</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.base, paddingBottom: 40 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.gray100 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 22, fontWeight: '800', color: Colors.white },
  profileName: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
  profileEmail: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: WEEG_BLUE },

  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.gray100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIcon: { width: 34, height: 34, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: Colors.gray50 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  settingDesc: { fontSize: 11, color: Colors.gray400, marginTop: 2 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  navRowBorder: { borderTopWidth: 1, borderTopColor: Colors.gray50 },
  navIcon: { width: 34, height: 34, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.foreground },

  versionText: { fontSize: 11, color: Colors.gray400, textAlign: 'center' },
});