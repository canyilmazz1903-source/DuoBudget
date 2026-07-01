import React, { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail, validatePassword } from '../../utils/validators';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';

function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    
    const validationErrors: Record<string, string> = {
      email: emailErr || '',
      password: passErr || '',
    };

    if (!fullName.trim()) {
      validationErrors.fullName = 'Ad Soyad gereklidir';
    }

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (Object.values(validationErrors).some((x) => x !== '')) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await signUp(email, password, fullName);
      router.replace('/(auth)/partner-invite');
    } catch (error: any) {
      Alert.alert('Kayıt Hatası', error.message || 'Kayıt sırasında bir sorun oluştu.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoText}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>DuoBudget ile ortak bütçe yolculuğuna başlayın</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Ad Soyad"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoCapitalize="words"
          />

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

          <Input
            label="Şifre Tekrarı"
            placeholder="••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <Button
            title="Kayıt Ol"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <Text style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
              Giriş Yapın
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function RegisterWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <RegisterScreen />
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
    marginBottom: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  registerButton: {
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
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
});
