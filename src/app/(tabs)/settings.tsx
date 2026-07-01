import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TextInput, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useBudgetStore } from '../../store/budgetStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { formatMoney } from '../../utils/formatters';
import { updateProfile } from '../../api/supabase';
import { useNotifications } from '../../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

function SettingsScreen() {
  const router = useRouter();
  const { scheduleSalaryReminder, scheduleCardDueReminder } = useNotifications();

  const profile = useAuthStore((state) => state.profile);
  const partner = useAuthStore((state) => state.partner);
  const jointAccountId = useAuthStore((state) => state.jointAccountId);
  const logOut = useAuthStore((state) => state.logOut);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const cards = useBudgetStore((state) => state.cards);
  const addCardItem = useBudgetStore((state) => state.addCardItem);
  const removeCardItem = useBudgetStore((state) => state.removeCardItem);
  const clearCache = useBudgetStore((state) => state.clearCache);

  // States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [salaryAmount, setSalaryAmount] = useState(String(profile?.salary_amount || ''));
  const [salaryDay, setSalaryDay] = useState(String(profile?.salary_day || ''));
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Card input states
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardType, setNewCardType] = useState<'credit' | 'debit'>('credit');
  const [newCardLastFour, setNewCardLastFour] = useState('');
  const [newCardBillingDay, setNewCardBillingDay] = useState('');
  const [newCardDueDay, setNewCardDueDay] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updates = {
        full_name: fullName,
        salary_amount: parseFloat(salaryAmount) || 0,
        salary_day: parseInt(salaryDay) || null,
      };

      const { error } = await updateProfile(profile.id, updates);
      if (error) throw error;

      await fetchProfile();

      // Schedule reminders locally
      if (updates.salary_day && notifEnabled) {
        await scheduleSalaryReminder(updates.salary_day, updates.salary_amount);
      }

      Alert.alert('Başarılı', 'Profil ayarlarınız güncellendi.');
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Profil güncellenirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCard = async () => {
    if (!jointAccountId || !profile) return;
    if (!newCardName.trim()) {
      Alert.alert('Hata', 'Lütfen kart adı giriniz.');
      return;
    }

    try {
      const billing = parseInt(newCardBillingDay) || null;
      const due = parseInt(newCardDueDay) || null;
      const limit = parseFloat(newCardLimit) || null;

      await addCardItem(jointAccountId, profile.id, {
        card_name: newCardName,
        card_type: newCardType as any,
        last_four_digits: newCardLastFour || '0000',
        billing_day: billing,
        due_day: due,
        credit_limit: limit,
        color: newCardType === 'credit' ? '#3B82F6' : '#10B981',
        is_active: true,
      });

      // Schedule notifications for card due date
      if (due && notifEnabled && newCardType === 'credit') {
        await scheduleCardDueReminder(newCardName, due);
      }

      Alert.alert('Başarılı', 'Kart başarıyla eklendi.');
      // Reset card inputs
      setNewCardName('');
      setNewCardLastFour('');
      setNewCardBillingDay('');
      setNewCardDueDay('');
      setNewCardLimit('');
      setShowAddCard(false);
    } catch (error: any) {
      Alert.alert('Hata', 'Kart eklenemedi.');
    }
  };

  const handleDeleteCard = (cardId: string, cardName: string) => {
    Alert.alert('Karta Sil', `"${cardName}" isimli kartı silmek istediğinizden emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await removeCardItem(cardId);
          Alert.alert('Silindi', 'Kart silindi.');
        },
      },
    ]);
  };

  const handleDissolvePartnership = () => {
    Alert.alert(
      '⚠️ Eşleşmeyi Sonlandır',
      'Eşinizle olan bağlantıyı koparmak istediğinizden emin misiniz? Ortak bütçe grubundaki verileriniz korunacaktır.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Bağlantıyı Kes',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            // Clear joint_account_id on profile
            await updateProfile(profile.id, { joint_account_id: null });
            clearCache();
            await fetchProfile();
            router.replace('/(auth)/partner-invite');
          },
        },
      ]
    );
  };

  const handleLogOut = async () => {
    await logOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Text style={styles.sectionTitle}>Profil Ayarları</Text>
        <Card style={styles.card}>
          <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} />
          <Input
            label="Aylık Maaş Geliri (₺)"
            value={salaryAmount}
            onChangeText={setSalaryAmount}
            keyboardType="numeric"
          />
          <Input
            label="Maaş Günü (1-31)"
            value={salaryDay}
            onChangeText={setSalaryDay}
            keyboardType="numeric"
            maxLength={2}
          />
          <Button
            title="Değişiklikleri Kaydet"
            onPress={handleSaveProfile}
            loading={isSaving}
            style={styles.saveButton}
          />
        </Card>

        {/* Local Notifications Card */}
        <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
        <Card style={[styles.card, styles.rowBetween]}>
          <View style={styles.notifInfo}>
            <Text style={styles.settingLabel}>Akıllı Hatırlatıcılar</Text>
            <Text style={styles.settingSub}>Maaş günü ve kredi kartı ödemeleri için bildirim al</Text>
          </View>
          <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ true: '#2563EB' }} />
        </Card>

        {/* Card Management */}
        <Text style={styles.sectionTitle}>Kartlarım & Hesaplarım</Text>
        <Card style={styles.card}>
          {cards.length > 0 ? (
            cards.map((c) => (
              <View key={c.id} style={styles.cardItem}>
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: c.color }]}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{c.card_name}</Text>
                    <Text style={styles.cardMeta}>
                      {c.card_type === 'credit' ? 'Kredi Kartı' : 'Debit Kart'} • **** {c.last_four_digits}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteCard(c.id, c.card_name)}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCardsText}>Kayıtlı bir kart bulunamadı.</Text>
          )}

          {showAddCard ? (
            <View style={styles.addCardForm}>
              <View style={styles.divider} />
              <Text style={styles.addCardTitle}>Yeni Kart Ekle</Text>
              
              <Input label="Kart / Hesap Adı" placeholder="Örn: Garanti Kredi" value={newCardName} onChangeText={setNewCardName} />
              
              <View style={styles.typeSelector}>
                <Button
                  title="Kredi Kartı"
                  variant={newCardType === 'credit' ? 'primary' : 'outline'}
                  onPress={() => setNewCardType('credit')}
                  style={styles.flex1}
                />
                <Button
                  title="Banka Kartı"
                  variant={newCardType === 'debit' ? 'primary' : 'outline'}
                  onPress={() => setNewCardType('debit')}
                  style={styles.flex1}
                />
              </View>

              <Input label="Son 4 Hane" placeholder="1234" value={newCardLastFour} onChangeText={setNewCardLastFour} keyboardType="numeric" maxLength={4} />

              {newCardType === 'credit' && (
                <View>
                  <Input label="Kart Limiti (₺)" placeholder="50000" value={newCardLimit} onChangeText={setNewCardLimit} keyboardType="numeric" />
                  <View style={styles.row}>
                    <Input label="Hesap Kesim" placeholder="15" value={newCardBillingDay} onChangeText={setNewCardBillingDay} keyboardType="numeric" containerStyle={styles.flex1} maxLength={2} />
                    <View style={styles.spacer} />
                    <Input label="Son Ödeme" placeholder="25" value={newCardDueDay} onChangeText={setNewCardDueDay} keyboardType="numeric" containerStyle={styles.flex1} maxLength={2} />
                  </View>
                </View>
              )}

              <View style={styles.addCardActions}>
                <Button title="Kartı Kaydet" onPress={handleAddCard} style={styles.flex1} />
                <Button title="İptal" variant="ghost" onPress={() => setShowAddCard(false)} style={styles.flex1} />
              </View>
            </View>
          ) : (
            <Button
              title="Kart/Hesap Ekle"
              variant="outline"
              icon={<Ionicons name="add" size={16} color="#2563EB" />}
              onPress={() => setShowAddCard(true)}
              style={styles.addCardBtn}
            />
          )}
        </Card>

        {/* Partner Connection management */}
        {profile?.joint_account_id && (
          <View style={styles.dangerZone}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Tehlikeli Bölge</Text>
            <Card style={styles.card}>
              <Text style={styles.dangerDesc}>
                Eşinizle olan ortak hesap bağlantısını keser. Mevcut bütçe grubu korunur fakat artık eşinizin hareketlerini göremezsiniz.
              </Text>
              <Button
                title="Eş Eşleşmesini Sonlandır"
                variant="danger"
                onPress={handleDissolvePartnership}
              />
            </Card>
          </View>
        )}

        {/* Sign out */}
        <Button title="Çıkış Yap" variant="outline" onPress={handleLogOut} style={styles.logoutButton} />
      </ScrollView>
    </View>
  );
}

export default function SettingsWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <SettingsScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  settingSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
    lineHeight: 14,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  emptyCardsText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginVertical: 16,
  },
  addCardBtn: {
    marginTop: 10,
  },
  addCardForm: {
    marginTop: 16,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginBottom: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  spacer: {
    width: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  addCardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  dangerZone: {
    marginTop: 10,
  },
  dangerTitle: {
    color: '#DC2626',
  },
  dangerDesc: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    lineHeight: 16,
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 24,
    borderColor: '#DC2626',
    borderWidth: 1,
  },
});
