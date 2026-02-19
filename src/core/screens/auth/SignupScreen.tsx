import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export function SignupScreen({ navigation }: any) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await signup({ name, email, password });
      if (result.success) {
        Alert.alert('Success!', result.message, [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoLetter}>F</Text>
            </LinearGradient>
            <Text style={styles.logoTitle}>FASI</Text>
            <Text style={styles.logoSub}>Financial Analytics & System Intelligence</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, Shadow.lg]}>
            <Text style={styles.cardTitle}>Create Manager Account</Text>
            <Text style={styles.cardSubtitle}>Sign up to manage your organization</Text>

            {[
              { label: 'Full Name', value: name, setter: setName, placeholder: 'Enter your full name', icon: 'person-outline', type: 'default', secure: false },
              { label: 'Email Address', value: email, setter: setEmail, placeholder: 'Enter your email', icon: 'mail-outline', type: 'email-address', secure: false },
              { label: 'Password', value: password, setter: setPassword, placeholder: 'Create a password', icon: 'lock-closed-outline', type: 'default', secure: !showPassword },
              { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Confirm your password', icon: 'lock-closed-outline', type: 'default', secure: !showPassword },
            ].map((field, i) => (
              <View key={i} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name={field.icon as any} size={18} color={Colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.gray400}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.type as any}
                    autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                    secureTextEntry={field.secure}
                    editable={!loading}
                  />
                  {(field.label === 'Password' || field.label === 'Confirm Password') && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray400} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Role Info Banner */}
            <View style={styles.roleBanner}>
              <View style={styles.roleBannerIcon}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleBannerTitle}>Manager Account</Text>
                <Text style={styles.roleBannerText}>
                  Your account will be reviewed by an admin before activation. You'll be able to create agent accounts and manage your organization once verified.
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={loading ? [Colors.gray300, Colors.gray400] : [Colors.indigo600, Colors.violet600]}
                style={styles.submitBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={20} color="white" />
                    <Text style={styles.submitBtnText}>Create Manager Account</Text>
                  </>
                )}
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
  container: { flex: 1, backgroundColor: Colors.indigo50 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.base, paddingVertical: 32 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: BorderRadius['2xl'], alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoLetter: { fontSize: 28, fontWeight: '900', color: Colors.white },
  logoTitle: { fontSize: 28, fontWeight: '800', color: Colors.indigo600, marginBottom: 4 },
  logoSub: { fontSize: 13, color: Colors.gray500, textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: 24, borderWidth: 1, borderColor: Colors.gray100 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: Colors.gray500, marginBottom: 24 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.foreground, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: Colors.foreground },
  eyeBtn: { padding: 14 },
  roleBanner: { flexDirection: 'row', gap: 12, backgroundColor: Colors.indigo50, borderRadius: BorderRadius.lg, padding: 14, borderWidth: 1, borderColor: Colors.indigo100, marginBottom: 4 },
  roleBannerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.indigo600, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  roleBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  roleBannerText: { fontSize: 11, color: Colors.gray500, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.lg },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signinText: { fontSize: 14, color: Colors.gray500 },
  signinLink: { fontSize: 14, fontWeight: '600', color: Colors.indigo600 },
});
