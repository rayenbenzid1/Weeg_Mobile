/**
 * SignupScreen.tsx — Inscription Manager connectée au backend Django WEEG
 * Adapté pour le nouveau AuthContext avec les vrais champs requis par l'API
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const WEEG_BLUE = '#1a6fe8';
const WEEG_ORANGE = '#e87c1a';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  password: string;
  passwordConfirm: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  password?: string;
  passwordConfirm?: string;
}

export function SignupScreen({ navigation }: any) {
  const { signup } = useAuth();
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof FormData) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!form.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!form.email.trim()) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email invalide';
    if (!form.companyName.trim()) newErrors.companyName = 'Nom de société requis';
    if (!form.password) newErrors.password = 'Mot de passe requis';
    else if (form.password.length < 8) newErrors.password = 'Au moins 8 caractères';
    if (form.password !== form.passwordConfirm) newErrors.passwordConfirm = 'Les mots de passe ne correspondent pas';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        companyName: form.companyName,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });

      if (result.success) {
        Alert.alert(
          '✓ Compte créé !',
          result.message,
          [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label, fieldKey, placeholder, icon, keyboardType = 'default',
    autoCapitalize = 'none', secureTextEntry = false, rightIcon
  }: {
    label: string;
    fieldKey: keyof FormData;
    placeholder: string;
    icon: string;
    keyboardType?: any;
    autoCapitalize?: any;
    secureTextEntry?: boolean;
    rightIcon?: React.ReactNode;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[fieldKey] ? styles.inputError : undefined]}>
        <Ionicons name={icon as any} size={18} color={Colors.gray400} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          value={form[fieldKey]}
          onChangeText={update(fieldKey)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          editable={!loading}
        />
        {rightIcon}
      </View>
      {errors[fieldKey] && (
        <Text style={styles.errorText}>{errors[fieldKey]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <Image source={require('../../assets/logo.jpeg')} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.logoSub}>Where Data Finds Balance</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, Shadow.lg]}>
            <Text style={styles.cardTitle}>Create Manager Account</Text>
            <Text style={styles.cardSubtitle}>Your account will be reviewed by an admin</Text>

            {/* Nom/Prénom en ligne */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>First Name *</Text>
                <View style={[styles.inputWrapper, errors.firstName ? styles.inputError : undefined]}>
                  <Ionicons name="person-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor={Colors.gray400}
                    value={form.firstName}
                    onChangeText={update('firstName')}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last Name *</Text>
                <View style={[styles.inputWrapper, errors.lastName ? styles.inputError : undefined]}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 12 }]}
                    placeholder="Doe"
                    placeholderTextColor={Colors.gray400}
                    value={form.lastName}
                    onChangeText={update('lastName')}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Email */}
            <Field
              label="Email Address *"
              fieldKey="email"
              placeholder="john.doe@company.com"
              icon="mail-outline"
              keyboardType="email-address"
            />

            {/* Téléphone */}
            <Field
              label="Phone Number (optional)"
              fieldKey="phone"
              placeholder="+213 6X XXX XXXX"
              icon="call-outline"
              keyboardType="phone-pad"
            />

            {/* Société */}
            <Field
              label="Company Name *"
              fieldKey="companyName"
              placeholder="Your Company Inc."
              icon="business-outline"
              autoCapitalize="words"
            />

            {/* Mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.gray400}
                  value={form.password}
                  onChangeText={update('password')}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirmer mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={[styles.inputWrapper, errors.passwordConfirm ? styles.inputError : undefined]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.gray400}
                  value={form.passwordConfirm}
                  onChangeText={update('passwordConfirm')}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
              </View>
              {errors.passwordConfirm && <Text style={styles.errorText}>{errors.passwordConfirm}</Text>}
            </View>

            {/* Info Banner */}
            <View style={styles.roleBanner}>
              <View style={styles.roleBannerIcon}>
                <Ionicons name="information-circle-outline" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleBannerTitle}>Manager Account</Text>
                <Text style={styles.roleBannerText}>
                  After creation, your account will be pending review. An admin will approve or reject your request. You'll receive a confirmation email.
                </Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleSignup} disabled={loading} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={loading ? [Colors.gray300, Colors.gray400] : [WEEG_BLUE, WEEG_ORANGE]}
                style={styles.submitBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : <>
                    <Ionicons name="person-add-outline" size={20} color="white" />
                    <Text style={styles.submitBtnText}>Create Manager Account</Text>
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signinLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base, paddingVertical: 32 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoImg: { width: 220, height: 80, marginBottom: 8 },
  logoSub: { fontSize: 13, color: Colors.gray500, textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: 24, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: Colors.gray500, marginBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 0 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200 },
  inputError: { borderColor: Colors.red500 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: Colors.foreground },
  eyeBtn: { padding: 14 },
  errorText: { fontSize: 11, color: Colors.red500, marginTop: 4 },
  roleBanner: { flexDirection: 'row', gap: 12, backgroundColor: '#eff6ff', borderRadius: BorderRadius.lg, padding: 14, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 4 },
  roleBannerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: WEEG_BLUE, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  roleBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  roleBannerText: { fontSize: 11, color: Colors.gray500, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.lg },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signinText: { fontSize: 14, color: Colors.gray500 },
  signinLink: { fontSize: 14, fontWeight: '600', color: WEEG_BLUE },
});