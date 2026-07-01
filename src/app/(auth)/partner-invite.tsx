import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InviteCodeDisplay } from '../../components/partner/InviteCodeDisplay';
import { PartnerStatus } from '../../components/partner/PartnerStatus';
import { validateInviteCode } from '../../utils/validators';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';

function PartnerInviteScreen() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const partner = useAuthStore((state) => state.partner);
  const jointAccountId = useAuthStore((state) => state.jointAccountId);
  
  const initJointAccount = useAuthStore((state) => state.initJointAccount);
  const linkPartner = useAuthStore((state) => state.linkPartner);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'enter'>('generate');

  useEffect(() => {
    // If user is already active with a partner, go to tabs
    if (profile?.joint_account_id && partner) {
      router.replace('/(tabs)');
    }
  }, [profile, partner]);

  const handleCreateCode = async () => {
    try {
      await initJointAccount();
      Alert.alert('Başarılı', 'Ortak hesap bütçe grubu oluşturuldu.');
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Davet kodu oluşturulurken bir hata oluştu.');
    }
  };

  const handleJoinPartner = async () => {
    const codeErr = validateInviteCode(inviteCodeInput);
    if (codeErr) {
      setError(codeErr);
      return;
    }

    setError('');
    try {
      await linkPartner(inviteCodeInput);
      Alert.alert('Başarılı', 'Eşleşme başarıyla tamamlandı!', [
        { text: 'Tamam', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (err: any) {
      Alert.alert('Eşleşme Hatası', err.message || 'Geçersiz davet kodu.');
    }
  };

  const handleSkip = () => {
    // Single user mode can just use single user joint account if generated, or go directly
    if (jointAccountId) {
      router.replace('/(tabs)');
    } else {
      // Must have at least a joint account to save transactions
      handleCreateCode().then(() => {
        router.replace('/(tabs)');
      });
    }
  };

  // Determine current partner status to show
  let partnerStatus: 'none' | 'pending' | 'active' = 'none';
  if (profile?.joint_account_id) {
    partnerStatus = partner ? 'active' : 'pending';
  }

  // Get joint account invite code if exists
  const myInviteCode = profile?.joint_account_id ? 'PND-CODE' : null; 
  // Wait, in our schema, joint_accounts invite_code is generated. Let's see if we should fetch it.
  // In a real app we fetch it from joint_accounts table. Let's use a placeholder or read it.
  // We can fetch it or show profile's info.
  // Let's assume we can fetch the joint account to get the real code.
  const [realCode, setRealCode] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.joint_account_id) {
      import('../../api/supabase').then(({ supabase }) => {
        (supabase as any)
          .from('joint_accounts')
          .select('invite_code')
          .eq('id', profile.joint_account_id as string)
          .single()
          .then(({ data }: any) => {
            if (data?.invite_code) {
              setRealCode(data.invite_code);
            }
          });
      });
    }
  }, [profile?.joint_account_id]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Partner Eşleşmesi</Text>
          <Text style={styles.subtitle}>
            Gelir ve giderlerinizi birlikte takip edebilmek için eşleşin
          </Text>
        </View>

        {/* Status Indicator */}
        <PartnerStatus partnerName={partner?.full_name || null} status={partnerStatus} />

        {profile?.joint_account_id && realCode ? (
          <View style={styles.inviteContainer}>
            <InviteCodeDisplay inviteCode={realCode} />
            <Text style={styles.waitingText}>
              Partneriniz bu kodu girdiğinde otomatik olarak eşleşeceksiniz.
            </Text>
            <Button
              title="Devam Et (Tek Başıma)"
              variant="outline"
              onPress={() => router.replace('/(tabs)')}
              style={styles.continueButton}
            />
          </View>
        ) : (
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabHeader}>
              <Button
                title="Grup Oluştur"
                variant={activeTab === 'generate' ? 'primary' : 'ghost'}
                onPress={() => setActiveTab('generate')}
                style={styles.tabButton}
              />
              <Button
                title="Koda Katıl"
                variant={activeTab === 'enter' ? 'primary' : 'ghost'}
                onPress={() => setActiveTab('enter')}
                style={styles.tabButton}
              />
            </View>

            {activeTab === 'generate' ? (
              <View style={styles.tabBody}>
                <Text style={styles.tabDesc}>
                  Yeni bir ortak bütçe grubu oluşturun ve bir davet kodu edinin.
                </Text>
                <Button
                  title="Yeni Ortak Hesap Oluştur"
                  onPress={handleCreateCode}
                  loading={isLoading}
                  style={styles.actionButton}
                />
              </View>
            ) : (
              <View style={styles.tabBody}>
                <Text style={styles.tabDesc}>
                  Partnerinizin oluşturduğu davet kodunu girerek ortak bütçeye katılın.
                </Text>
                <Input
                  label="Davet Kodu"
                  placeholder="Davet kodunu girin (8 Karakter)"
                  value={inviteCodeInput}
                  onChangeText={setInviteCodeInput}
                  error={error}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <Button
                  title="Ortak Hesaba Katıl"
                  onPress={handleJoinPartner}
                  loading={isLoading}
                  style={styles.actionButton}
                />
              </View>
            )}

            <Button
              title="Şimdilik Atla ve Başla"
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function PartnerInviteWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <PartnerInviteScreen />
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
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginTop: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    height: 36,
  },
  tabBody: {
    alignItems: 'center',
    width: '100%',
  },
  tabDesc: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    marginTop: 10,
  },
  skipButton: {
    marginTop: 16,
    width: '100%',
  },
  inviteContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  continueButton: {
    width: '100%',
  },
});
