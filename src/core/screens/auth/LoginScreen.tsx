/**
 * src/core/screens/auth/LoginScreen.tsx — WEEG v2 with Biometric Auth
 *
 * SECURITY FIX — Email-first biometric flow:
 *   - Biometric button is hidden until the user types an email
 *   - Once an email is entered, we check if biometrics are enabled FOR THAT
 *     specific account; only then is the button shown
 *   - `BiometricService.authenticate(email)` explicitly passes the email so
 *     only credentials for that account are returned
 *   - Auto-trigger on mount is removed — the user must type their email first
 *   - Multi-account support: each email has independent biometric state
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image, Modal, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../lib/api';
import { BiometricService, BiometricCapability } from '../../lib/biometricService';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const WEEG_BLUE   = '#1a6fe8';
const WEEG_ORANGE = '#e87c1a';

// ─── Forgot Password Modal (unchanged) ───────────────────────────────────────

type ForgotStep = 'email' | 'code' | 'reset' | 'done';

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]                       = useState<ForgotStep>('email');
  const [email, setEmail]                     = useState('');
  const [code, setCode]                       = useState('');
  const [resetToken, setResetToken]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [showPw, setShowPw]                   = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setError(''); setLoading(true);
    const res = await AuthService.forgotPasswordRequest(email.trim().toLowerCase());
    setLoading(false);
    if (res.ok) setStep('code');
    else setError(res.error || 'An error occurred.');
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError(''); setLoading(true);
    const res = await AuthService.forgotPasswordVerify(email, code);
    setLoading(false);
    if (res.ok && res.data?.reset_token) { setResetToken(res.data.reset_token); setStep('reset'); }
    else setError(res.error || 'Invalid or expired code.');
  };

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) { setError('Minimum 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    const res = await AuthService.forgotPasswordReset({
      reset_token: resetToken,
      new_password: newPassword,
      new_password_confirm: confirmPassword,
    });
    setLoading(false);
    if (res.ok) setStep('done');
    else setError(res.error || 'Reset failed.');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.gray500} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={fw.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons
              name={step === 'email' ? 'mail-outline' : step === 'code' ? 'keypad-outline' : step === 'reset' ? 'lock-open-outline' : 'checkmark-circle-outline'}
              size={32}
              color="white"
            />
          </LinearGradient>

          <Text style={fw.title}>
            {step === 'email' ? 'Forgot Password' : step === 'code' ? 'Enter Code' : step === 'reset' ? 'New Password' : 'Password Reset!'}
          </Text>
          <Text style={fw.subtitle}>
            {step === 'email' ? 'Enter your email to receive a verification code' :
             step === 'code' ? `A 6-digit code was sent to ${email}` :
             step === 'reset' ? 'Choose a strong new password' :
             'You can now log in with your new password'}
          </Text>

          {step !== 'done' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              {['email', 'code', 'reset'].map((s, i) => {
                const idx = ['email', 'code', 'reset'].indexOf(step);
                const active = i <= idx;
                return (
                  <React.Fragment key={s}>
                    <View style={[fw.dot, active && { backgroundColor: WEEG_BLUE }]}>
                      <Text style={[fw.dotNum, active && { color: '#fff' }]}>{i + 1}</Text>
                    </View>
                    {i < 2 && <View style={[fw.line, i < idx && { backgroundColor: WEEG_BLUE }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {error ? (
            <View style={fw.errBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={fw.errTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={{ width: '100%' }}>
            {step === 'email' && (
              <>
                <Text style={fw.label}>Email Address</Text>
                <View style={fw.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={Colors.gray400} />
                  <TextInput style={fw.input} placeholder="your@email.com" placeholderTextColor={Colors.gray400} value={email} onChangeText={t => { setEmail(t); setError(''); }} keyboardType="email-address" autoCapitalize="none" autoFocus editable={!loading} />
                </View>
                <TouchableOpacity onPress={handleRequestCode} disabled={loading} style={{ marginTop: 20 }}>
                  <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={fw.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={fw.btnTxt}>Send Verification Code</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 'code' && (
              <>
                <Text style={fw.label}>6-Digit Code</Text>
                <TextInput style={fw.codeInput} placeholder="000000" placeholderTextColor={Colors.gray300} value={code} onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(''); }} keyboardType="number-pad" maxLength={6} autoFocus editable={!loading} />
                <TouchableOpacity onPress={handleVerifyCode} disabled={loading || code.length < 6} style={{ marginTop: 20 }}>
                  <LinearGradient colors={code.length === 6 ? [WEEG_BLUE, WEEG_ORANGE] : [Colors.gray300, Colors.gray400]} style={fw.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={fw.btnTxt}>Verify Code</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => { setStep('email'); setCode(''); setError(''); }}>
                  <Text style={{ fontSize: 13, color: WEEG_BLUE, fontWeight: '600' }}>← Change email / Resend</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <Text style={fw.label}>New Password</Text>
                <View style={fw.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} />
                  <TextInput style={fw.input} placeholder="Min. 8 characters" placeholderTextColor={Colors.gray400} value={newPassword} onChangeText={t => { setNewPassword(t); setError(''); }} secureTextEntry={!showPw} autoFocus editable={!loading} />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                  </TouchableOpacity>
                </View>
                <Text style={[fw.label, { marginTop: 14 }]}>Confirm New Password</Text>
                <View style={fw.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} />
                  <TextInput style={fw.input} placeholder="Repeat your password" placeholderTextColor={Colors.gray400} value={confirmPassword} onChangeText={t => { setConfirmPassword(t); setError(''); }} secureTextEntry={!showPw} editable={!loading} />
                </View>
                <TouchableOpacity onPress={handleReset} disabled={loading} style={{ marginTop: 20 }}>
                  <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={fw.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={fw.btnTxt}>Reset Password</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 'done' && (
              <>
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
                  <Text style={{ fontSize: 14, color: Colors.gray500, textAlign: 'center', marginTop: 12 }}>
                    Your password has been reset successfully.
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <LinearGradient colors={[WEEG_BLUE, WEEG_ORANGE]} style={fw.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={fw.btnTxt}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Biometric Button ─────────────────────────────────────────────────────────

function BiometricButton({
  capability,
  onPress,
  loading,
}: {
  capability: BiometricCapability;
  onPress: () => void;
  loading: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }).start();

  const iconName = capability.biometricType === 'Face ID'
    ? 'scan-outline'
    : capability.biometricType === 'Iris'
    ? 'eye-outline'
    : 'finger-print-outline';

  const borderColor = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(26,111,232,0.25)', 'rgba(232,124,26,0.55)'],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[s.biometricWrapper, { borderColor }]}>
        <TouchableOpacity
          style={s.biometricBtn}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          activeOpacity={1}
        >
          {loading ? (
            <ActivityIndicator color={WEEG_BLUE} size="small" />
          ) : (
            <>
              <LinearGradient
                colors={[WEEG_BLUE, WEEG_ORANGE]}
                style={s.biometricIconWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={iconName as any} size={22} color="#fff" />
              </LinearGradient>
              <Text style={s.biometricLabel}>
                Sign in with {capability.biometricType}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.gray400} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <View style={s.dividerRow}>
      <View style={s.dividerLine} />
      <Text style={s.dividerTxt}>or</Text>
      <View style={s.dividerLine} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError]               = useState('');
  const [showForgot, setShowForgot]     = useState(false);

  /**
   * Hardware capability (type, isSupported, isEnrolled).
   * isEnabled is always computed per-email — see emailBiometricEnabled.
   */
  const [hardwareCapability, setHardwareCapability] = useState<BiometricCapability | null>(null);

  /**
   * Whether the CURRENTLY TYPED email has biometric login enabled.
   * This drives whether the biometric button is shown.
   */
  const [emailBiometricEnabled, setEmailBiometricEnabled] = useState(false);

  // Debounce ref for email checking
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load hardware capability once on mount ────────────────────────────────
  useEffect(() => {
    (async () => {
      // Pass null → only hardware check, no per-email lookup
      const cap = await BiometricService.getCapability(null);
      setHardwareCapability(cap);
    })();
  }, []);

  // ── Check biometric status whenever email changes ─────────────────────────
  const checkEmailBiometric = useCallback(async (emailValue: string) => {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailBiometricEnabled(false);
      return;
    }
    if (!hardwareCapability?.isSupported || !hardwareCapability?.isEnrolled) {
      setEmailBiometricEnabled(false);
      return;
    }
    const enabled = await BiometricService.isEnabledForEmail(trimmed);
    setEmailBiometricEnabled(enabled);
  }, [hardwareCapability]);

  useEffect(() => {
    // Debounce so we don't hit storage on every keystroke
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    emailCheckTimer.current = setTimeout(() => {
      checkEmailBiometric(email);
    }, 300);
    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    };
  }, [email, checkEmailBiometric]);

  // ── Password login ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      // LOGIN SUCCEEDED
      // Write a "pending setup" flag so BiometricSetupGate (authenticated side)
      // can offer to enable biometrics AFTER navigation.
      const cap = await BiometricService.getCapability(email.trim().toLowerCase());
      if (cap.isSupported && cap.isEnrolled && !cap.isEnabled) {
        await BiometricService.setPendingSetup(
          email.trim().toLowerCase(),
          password,
        );
      }
      // AuthContext navigation happens automatically — nothing else needed here.
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  // ── Biometric login ───────────────────────────────────────────────────────
  const handleBiometricLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!emailBiometricEnabled || !trimmedEmail) return;

    setBiometricLoading(true);
    setError('');
    try {
      // Authenticate strictly for this email — never returns another user's credentials
      const result = await BiometricService.authenticate(
        trimmedEmail,
        `Sign in as ${trimmedEmail}`,
      );

      if (!result.success) {
        if (result.errorCode !== 'user_cancel') {
          setError(result.error || 'Biometric authentication failed.');
        }
        setBiometricLoading(false);
        return;
      }

      // Use the credentials that were returned for this specific email
      const loginResult = await login(result.email!, result.password!);
      if (!loginResult.success) {
        // Credentials changed on server — disable biometric and ask for password
        await BiometricService.disable(trimmedEmail);
        setEmailBiometricEnabled(false);
        setError('Your credentials have changed. Please sign in with your password.');
      }
    } catch {
      setError('Biometric authentication failed.');
    } finally {
      setBiometricLoading(false);
    }
  };

  // The biometric button is shown only when:
  //   1. The typed email has biometrics enabled
  //   2. Not currently doing a password login
  const showBiometricButton =
    emailBiometricEnabled &&
    !loading &&
    hardwareCapability !== null;

  // Build a display capability for the button (merging hardware + per-email flag)
  const displayCapability: BiometricCapability | null = hardwareCapability
    ? { ...hardwareCapability, isEnabled: emailBiometricEnabled }
    : null;

  return (
    <SafeAreaView style={s.container}>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoArea}>
            <Image source={require('../../assets/logo.jpeg')} style={s.logoImg} resizeMode="contain" />
            <Text style={s.logoSub}>Where Data Finds Balance</Text>
          </View>

          {/* Card */}
          <View style={[s.card, Shadow.lg]}>
            <Text style={s.cardTitle}>Welcome Back</Text>
            <Text style={s.cardSub}>Sign in to your WEEG account</Text>

            {/* Error banner */}
            {error ? (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={s.errorBannerTxt}>{error}</Text>
              </View>
            ) : null}

            {/* Email — always first */}
            <View style={s.field}>
              <Text style={s.label}>Email Address</Text>
              <View style={[s.inputRow, !!error && s.inputErr]}>
                <Ionicons name="mail-outline" size={18} color={Colors.gray400} style={{ paddingLeft: 14 }} />
                <TextInput
                  style={s.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.gray400}
                  value={email}
                  onChangeText={t => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading && !biometricLoading}
                />
              </View>
            </View>

            {/* ── Biometric quick-login — only shown AFTER a recognised email ── */}
            {showBiometricButton && displayCapability && (
              <>
                <BiometricButton
                  capability={displayCapability}
                  onPress={handleBiometricLogin}
                  loading={biometricLoading}
                />
                <OrDivider />
              </>
            )}

            {/* Password */}
            <View style={s.field}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={s.label}>Password</Text>
                <TouchableOpacity onPress={() => setShowForgot(true)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: WEEG_BLUE }}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[s.inputRow, !!error && s.inputErr]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} style={{ paddingLeft: 14 }} />
                <TextInput
                  style={s.input}
                  placeholder="Your password"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={t => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  editable={!loading && !biometricLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 14 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign in button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading || biometricLoading} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={(loading || biometricLoading) ? [Colors.gray300, Colors.gray400] : [WEEG_BLUE, WEEG_ORANGE]}
                style={s.submitBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : <><Ionicons name="log-in-outline" size={20} color="white" /><Text style={s.submitBtnTxt}>Sign In</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
              <Text style={{ fontSize: 14, color: Colors.gray500 }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: WEEG_BLUE }}>Sign up as Manager</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, paddingHorizontal: 4 }}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gray400} />
            <Text style={{ flex: 1, fontSize: 12, color: Colors.gray400, lineHeight: 18 }}>
              Manager accounts require admin approval before first login.
              Agents receive their credentials by email from their manager.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff' },
  scroll:    { flexGrow: 1, paddingHorizontal: Spacing.base, paddingVertical: 32, justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoImg:  { width: 220, height: 80, marginBottom: 8 },
  logoSub:  { fontSize: 13, color: Colors.gray500, textAlign: 'center' },

  card:      { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: 24, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: Colors.gray500, marginBottom: 24 },

  errorBanner:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef2f2', borderRadius: BorderRadius.lg, padding: 12, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  errorBannerTxt: { flex: 1, fontSize: 13, color: '#dc2626', lineHeight: 18 },

  field:    { marginBottom: 18 },
  label:    { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200 },
  inputErr: { borderColor: '#fca5a5' },
  input:    { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: Colors.foreground },

  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.lg },
  submitBtnTxt: { fontSize: 16, fontWeight: '700', color: Colors.white },

  biometricWrapper: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#f8faff',
  },
  biometricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  biometricLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerTxt: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const fw = StyleSheet.create({
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 8 },
  title:      { fontSize: 22, fontWeight: '800', color: Colors.foreground, textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 13, color: Colors.gray500, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  dot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  dotNum:     { fontSize: 12, fontWeight: '700', color: Colors.gray500 },
  line:       { width: 40, height: 2, backgroundColor: Colors.gray200, marginHorizontal: 4 },
  errBox:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#fef2f2', borderRadius: BorderRadius.lg, padding: 12, borderWidth: 1, borderColor: '#fecaca', width: '100%', marginBottom: 16 },
  errTxt:     { flex: 1, fontSize: 13, color: '#dc2626' },
  label:      { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200, paddingHorizontal: 14, paddingVertical: 12 },
  input:      { flex: 1, fontSize: 15, color: Colors.foreground },
  codeInput:  { fontSize: 36, fontWeight: '800', letterSpacing: 12, textAlign: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200, paddingVertical: 16, paddingHorizontal: 20, color: WEEG_BLUE },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: BorderRadius.lg },
  btnTxt:     { fontSize: 16, fontWeight: '700', color: Colors.white },
});