import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail, validatePassword } from '../../utils/validators';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';

function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setErrors({
        email: emailErr || '',
        password: passErr || '',
      });
      return;
    }

    setErrors({});
    try {
      await signIn(email, password);
      // Auth change listener in root layout will handle redirect, 
      // but in case it needs explicit push:
      const jointAccountId = useAuthStore.getState().jointAccountId;
      if (jointAccountId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/partner-invite');
      }
    } catch (error: any) {
      Alert.alert('Giriş Hatası', error.message || 'E-posta veya şifre hatalı.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoText}>DuoBudget</Text>
          <Text style={styles.subtitle}>Eşler için Akıllı Bütçe Yönetimi</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="E-posta Adresi"
            placeholder="örnek@eposta.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Şifre"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Giriş Yap"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <Text style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              Kayıt Olun
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function LoginWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <LoginScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: 'Inter',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
});
