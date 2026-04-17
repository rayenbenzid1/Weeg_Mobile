/**
 * src/core/components/BiometricToggle.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Displayed in ProfileScreen → Security tab.
 *
 * When biometric login is ACTIVE, shows:
 *   - The toggle row
 *   - A fingerprint scan visual with animated pulse + slot indicators
 *   - "Fingerprint login is active" status pill
 *
 * When biometric login is OFF, shows the toggle row only.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Alert, ActivityIndicator, TextInput, Modal,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, BorderRadius, Shadow } from '../constants/theme';
import { BiometricService, BiometricCapability, MAX_FINGERPRINTS } from '../lib/biometricService';

const WEEG_BLUE   = '#1a6fe8';
const WEEG_ORANGE = '#e87c1a';

// ─── Password Confirmation Modal ──────────────────────────────────────────────

function PasswordConfirmModal({
  visible, email, onConfirm, onCancel,
}: {
  visible: boolean;
  email: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  useEffect(() => {
    if (visible) { setPassword(''); setShowPw(false); }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={pm.overlay}>
        <View style={pm.card}>
          <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={pm.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="finger-print-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={pm.title}>Confirm Your Password</Text>
          <Text style={pm.sub}>
            Enter your password once to enable biometric login. It will be stored securely on your device.
          </Text>
          <View style={pm.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.text3} />
            <TextInput
              style={pm.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={Colors.text3}
              secureTextEntry={!showPw}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.text3} />
            </TouchableOpacity>
          </View>
          <View style={pm.actions}>
            <TouchableOpacity style={pm.cancelBtn} onPress={onCancel}>
              <Text style={pm.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pm.confirmBtn, !password && { opacity: 0.5 }]}
              onPress={() => { if (password) onConfirm(password); }}
              disabled={!password}
            >
              <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={pm.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={pm.confirmTxt}>Enable</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(5,13,26,0.55)', justifyContent: 'center', paddingHorizontal: 24 },
  card:        { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, alignItems: 'center', ...Shadow.xl },
  iconWrap:    { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:       { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  sub:         { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', backgroundColor: Colors.surface2, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  input:       { flex: 1, fontSize: 15, color: Colors.text },
  actions:     { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn:   { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border2, alignItems: 'center', backgroundColor: Colors.surface2 },
  cancelTxt:   { fontSize: 14, fontWeight: '600', color: Colors.text2 },
  confirmBtn:  { flex: 1.5, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 12, alignItems: 'center' },
  confirmTxt:  { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── Fingerprint Scan Visual ──────────────────────────────────────────────────

function FingerprintScanVisual({
  biometricType, usedSlots, maxSlots, onScanPress, scanning,
}: {
  biometricType: string;
  usedSlots: number;
  maxSlots: number;
  onScanPress: () => void;
  scanning: boolean;
}) {
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const glowOpacity  = useRef(new Animated.Value(0.3)).current;
  const scanLine     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1.22, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(300),
      ]),
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.75, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.25, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    glow.start();

    return () => { pulse.stop(); glow.stop(); };
  }, []);

  useEffect(() => {
    if (scanning) {
      scanLine.setValue(0);
      Animated.loop(
        Animated.timing(scanLine, { toValue: 1, duration: 550, easing: Easing.linear, useNativeDriver: true }),
        { iterations: 4 },
      ).start();
    } else {
      scanLine.setValue(0);
    }
  }, [scanning]);

  const iconName = biometricType === 'Face ID' ? 'scan-outline'
    : biometricType === 'Iris'   ? 'eye-outline'
    : 'finger-print-outline';

  const sweepY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [-44, 44] });

  return (
    <View style={fv.container}>

      {/* ── Top row: label + slot indicators ── */}
      <View style={fv.topRow}>
        <Text style={fv.regLabel}>Registered fingerprints</Text>
        <View style={fv.slots}>
          {Array.from({ length: maxSlots }).map((_, i) => (
            <View key={i} style={[fv.slot, i < usedSlots ? fv.slotOn : fv.slotOff]}>
              <Ionicons name="finger-print-outline" size={11} color={i < usedSlots ? '#fff' : Colors.text3} />
            </View>
          ))}
          <Text style={fv.slotCount}>{usedSlots}/{maxSlots}</Text>
        </View>
      </View>

      {/* ── Central fingerprint button ── */}
      <TouchableOpacity onPress={onScanPress} activeOpacity={0.85} disabled={scanning} style={fv.btnWrap}>

        {/* Outer pulse ring */}
        <Animated.View style={[fv.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />

        {/* Second subtle ring */}
        <View style={fv.ring2} />

        {/* Main gradient circle */}
        <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={fv.circle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Glow shimmer */}
          <Animated.View style={[fv.glow, { opacity: glowOpacity }]} />

          {/* Scan sweep */}
          {scanning && (
            <Animated.View style={[fv.sweep, { transform: [{ translateY: sweepY }] }]} />
          )}

          <Ionicons name={iconName as any} size={46} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Labels ── */}
      <Text style={fv.tapLabel}>
        {scanning ? 'Scanning…' : `Tap to test ${biometricType}`}
      </Text>
      <Text style={fv.hintLabel}>
        Your {biometricType.toLowerCase()} stays on this device and is never shared
      </Text>
    </View>
  );
}

const fv = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  regLabel: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  slots:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slot:     { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  slotOn:   { backgroundColor: WEEG_BLUE },
  slotOff:  { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border2 },
  slotCount:{ fontSize: 11, fontWeight: '700', color: Colors.text3, marginLeft: 2 },

  btnWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 18, width: 120, height: 120 },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: WEEG_BLUE,
  },
  ring2: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 1,
    borderColor: 'rgba(26,111,232,0.2)',
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sweep: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 1,
  },

  tapLabel:  { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  hintLabel: { fontSize: 11, color: Colors.text3, textAlign: 'center', lineHeight: 16, paddingHorizontal: 16 },
});

// ─── Standalone hardware prompt ───────────────────────────────────────────────

async function promptBiometricHardware(msg: string): Promise<{ success: boolean; errorCode?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:         msg,
      fallbackLabel:         'Use Password',
      cancelLabel:           'Cancel',
      disableDeviceFallback: false,
    });
    if (!result.success) {
      return { success: false, errorCode: (result as any).error === 'user_cancel' ? 'user_cancel' : 'biometric_mismatch' };
    }
    return { success: true };
  } catch {
    return { success: false, errorCode: 'failed' };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BiometricToggleProps {
  email: string;
}

export function BiometricToggle({ email }: BiometricToggleProps) {
  const [capability, setCapability]               = useState<BiometricCapability | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toggling, setToggling]                   = useState(false);
  const [scanning, setScanning]                   = useState(false);

  const load = useCallback(async () => {
    const cap = await BiometricService.getCapability(email);
    setCapability(cap);
    setLoading(false);
  }, [email]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle ────────────────────────────────────────────────────────────────

  const handleToggle = async (newValue: boolean) => {
    if (!capability) return;
    if (newValue) {
      if (!capability.isSupported || !capability.isEnrolled) {
        Alert.alert('Biometrics Unavailable',
          capability.isSupported
            ? `No ${capability.biometricType} enrolled. Please set up biometrics in device settings first.`
            : 'This device does not support biometric authentication.');
        return;
      }
      if (capability.enrolledCount > MAX_FINGERPRINTS) {
        Alert.alert('Too Many Fingerprints',
          `WEEG allows a maximum of ${MAX_FINGERPRINTS} fingerprints per account.\n\nPlease remove fingerprints in device settings and try again.`);
        return;
      }
      setShowPasswordModal(true);
    } else {
      Alert.alert(`Disable ${capability.biometricType} Login`,
        'You will need to use your email and password to sign in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: async () => {
              setToggling(true);
              await BiometricService.disable(email);
              await load();
              setToggling(false);
            },
          },
        ],
      );
    }
  };

  // ── Enable flow ───────────────────────────────────────────────────────────

  const handlePasswordConfirm = async (password: string) => {
    setShowPasswordModal(false);
    setToggling(true);

    const authResult = await promptBiometricHardware('Scan your fingerprint to confirm');
    if (!authResult.success) {
      setToggling(false);
      if (authResult.errorCode !== 'user_cancel') {
        Alert.alert('Authentication Failed', 'Could not verify your identity. Please try again.');
      }
      return;
    }

    const saved = await BiometricService.enable(email, password);
    if (!saved.success) {
      setToggling(false);
      Alert.alert(
        saved.errorCode === 'too_many_fingerprints' ? 'Too Many Fingerprints' : 'Error',
        saved.error ?? 'Failed to save credentials. Please try again.',
      );
      return;
    }

    await load();
    setToggling(false);
  };

  // ── Test scan (press icon when already active) ────────────────────────────

  const handleTestScan = async () => {
    if (!capability?.isEnabled || scanning) return;
    setScanning(true);
    const result = await BiometricService.authenticate(email, 'Test your fingerprint login');
    setScanning(false);
    if (result.success) {
      Alert.alert('✓ Fingerprint Verified', 'Your fingerprint is working correctly.');
    } else if (result.errorCode !== 'user_cancel') {
      Alert.alert('Verification Failed', result.error ?? 'Fingerprint not recognised.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={T.loadingRow}>
        <ActivityIndicator size="small" color={Colors.blue} />
        <Text style={T.loadingTxt}>Checking biometric support…</Text>
      </View>
    );
  }

  if (!capability?.isSupported) {
    return (
      <View style={T.unsupportedRow}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.text3} />
        <Text style={T.unsupportedTxt}>Biometric authentication is not supported on this device.</Text>
      </View>
    );
  }

  const iconName = capability.biometricType === 'Face ID' ? 'scan-outline'
    : capability.biometricType === 'Iris' ? 'eye-outline'
    : 'finger-print-outline';

  const isOn      = capability.isEnabled;
  const usedSlots = isOn ? Math.min(capability.enrolledCount, MAX_FINGERPRINTS) : 0;

  return (
    <>
      <PasswordConfirmModal
        visible={showPasswordModal}
        email={email}
        onConfirm={handlePasswordConfirm}
        onCancel={() => setShowPasswordModal(false)}
      />

      {/* ── Toggle row ── */}
      <View style={T.wrap}>
        <View style={T.left}>
          <View style={[T.iconWrap, isOn && T.iconWrapActive]}>
            {isOn ? (
              <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={T.iconGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={iconName as any} size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <Ionicons name={iconName as any} size={18} color={Colors.text3} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={T.title}>{capability.biometricType} Login</Text>
            <Text style={T.sub}>
              {isOn
                ? `Active — tap your ${capability.biometricType.toLowerCase()} to sign in`
                : capability.isEnrolled
                ? `Enable quick login with your ${capability.biometricType.toLowerCase()}`
                : `No ${capability.biometricType.toLowerCase()} enrolled on this device`}
            </Text>
          </View>
        </View>

        {toggling ? (
          <ActivityIndicator size="small" color={WEEG_BLUE} />
        ) : (
          <Switch
            value={isOn}
            onValueChange={handleToggle}
            trackColor={{ false: Colors.border2, true: WEEG_BLUE }}
            thumbColor="#fff"
            disabled={!capability.isEnrolled && !isOn}
          />
        )}
      </View>

      {/* ── Fingerprint scan visual (only when active) ── */}
      {isOn && (
        <>
          <FingerprintScanVisual
            biometricType={capability.biometricType}
            usedSlots={usedSlots}
            maxSlots={MAX_FINGERPRINTS}
            onScanPress={handleTestScan}
            scanning={scanning}
          />

          <View style={T.statusPill}>
            <View style={T.statusDot} />
            <Text style={T.statusTxt}>{capability.biometricType} login is active</Text>
          </View>
        </>
      )}

      {/* Warning: too many fingerprints while OFF */}
      {!isOn && capability.isEnrolled && capability.enrolledCount > MAX_FINGERPRINTS && (
        <View style={T.warningPill}>
          <Ionicons name="warning-outline" size={12} color="#b45309" />
          <Text style={T.warningTxt}>
            {capability.enrolledCount} fingerprints enrolled — max {MAX_FINGERPRINTS} allowed. Remove one in device settings.
          </Text>
        </View>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const T = StyleSheet.create({
  loadingRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  loadingTxt:     { fontSize: 13, color: Colors.text3 },
  unsupportedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10 },
  unsupportedTxt: { flex: 1, fontSize: 12, color: Colors.text3, lineHeight: 18 },

  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },

  iconWrap: {
    width: 40, height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconWrapActive: { borderColor: 'transparent', padding: 0 },
  iconGrad: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  sub:   { fontSize: 11, color: Colors.text3, lineHeight: 15 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  statusTxt: { fontSize: 11, fontWeight: '700', color: Colors.greenText },

  warningPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(180,83,9,0.08)',
    borderWidth: 1, borderColor: 'rgba(180,83,9,0.2)',
    alignSelf: 'flex-start',
  },
  warningTxt: { fontSize: 11, fontWeight: '600', color: '#b45309', flex: 1 },
});