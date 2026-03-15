/**
 * AppHeader.tsx — WEEG v2 Reusable Fixed Navigation Header
 *
 * Features:
 *  - Dynamic time-based greeting (Morning / Afternoon / Evening / Welcome Back)
 *  - Notification icon with badge
 *  - Profile avatar (user initial)
 *  - Page title on the left
 *  - Shared across Dashboard, Control, Profile, Settings, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors, BorderRadius } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  /** Page title shown on the left (e.g. "Dashboard", "Control Panel") */
  title?: string;
  /** Number of pending alerts for notification badge */
  pendingAlertsCount?: number;
  /** Called when the notification bell is tapped */
  onNotificationPress?: () => void;
  /** Called when the profile avatar is tapped */
  onProfilePress?: () => void;
}

// ─── Greeting Helper ──────────────────────────────────────────────────────────

function getGreeting(firstName: string): { text: string; emoji: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { text: `Good Morning, ${firstName}`, emoji: '☀️' };
  }
  if (hour >= 12 && hour < 18) {
    return { text: `Good Afternoon, ${firstName}`, emoji: '🌤' };
  }
  if (hour >= 18 && hour < 23) {
    return { text: `Good Evening, ${firstName}`, emoji: '🌙' };
  }
  // 23:00 – 04:59
  return { text: `Welcome Back, ${firstName}`, emoji: '🌙' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppHeader({
  title,
  pendingAlertsCount = 0,
  onNotificationPress,
  onProfilePress,
}: AppHeaderProps) {
  const { user } = useAuth();
  const insets   = useSafeAreaInsets();

  // Recalculate greeting every minute so it updates without needing a restart
  const [greeting, setGreeting] = useState(() =>
    getGreeting(user?.firstName || user?.name?.split(' ')[0] || 'there'),
  );

  useEffect(() => {
    const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';
    setGreeting(getGreeting(firstName));

    const timer = setInterval(() => {
      setGreeting(getGreeting(firstName));
    }, 60_000);

    return () => clearInterval(timer);
  }, [user?.firstName, user?.name]);

  // Avatar initial
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={[Colors.navy2, Colors.navy3]}
      style={[S.header, { paddingTop: insets.top + 10 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={S.circle1} />
      <View style={S.circle2} />

      {/* Row: left title + right icons */}
      <View style={S.row}>
        {/* ── Left: brand mark + page title ── */}
        <View style={S.left}>
          <Text style={S.brand}>
            W<Text style={{ color: Colors.orange }}>EEG</Text>
          </Text>
          {title ? (
            <Text style={S.pageTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        {/* ── Right: notification + avatar ── */}
        <View style={S.right}>
          {/* Notification bell */}
          <TouchableOpacity
            style={S.iconBtn}
            onPress={onNotificationPress}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="rgba(255,255,255,0.85)"
            />
            {pendingAlertsCount > 0 && (
              <View style={S.badge}>
                <Text style={S.badgeTxt}>
                  {pendingAlertsCount > 9 ? '9+' : pendingAlertsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile avatar */}
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.blue, Colors.orange]}
              style={S.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={S.avatarTxt}>{initial}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic greeting line */}
      <View style={S.greetingRow}>
        <Text style={S.greetingText} numberOfLines={1}>
          {greeting.text}
        </Text>
        <Text style={S.greetingEmoji}>{greeting.emoji}</Text>
      </View>

      {/* Sub-line: date */}
      <Text style={S.subLine}>
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month:   'long',
          day:     'numeric',
        })}
      </Text>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative background circles
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(26,92,240,0.12)',
    top: -60,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(240,112,32,0.1)',
    bottom: -20,
    left: 30,
  },

  // Top row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  // Icon button (notification)
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: Colors.navy2,
  },
  badgeTxt: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '800',
  },

  // Profile avatar circle
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  greetingEmoji: {
    fontSize: 18,
  },
  subLine: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
});