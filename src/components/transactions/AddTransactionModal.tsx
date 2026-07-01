import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TransactionType } from '@/types';

/* ─── Types ────────────────────────────────────────────────────── */

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  loading?: boolean;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  merchant: string;
  date: string;
  cardId?: string;
}

/* ─── Category Data ────────────────────────────────────────────── */

interface CategoryOption {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { key: 'fatura', label: 'Fatura & Aidat', icon: 'file-document-outline', color: '#EF4444' },
  { key: 'market', label: 'Market & Gıda', icon: 'cart-outline', color: '#F59E0B' },
  { key: 'ulasim', label: 'Ulaşım & Yakıt', icon: 'car-outline', color: '#3B82F6' },
  { key: 'eglence', label: 'Eğlence & Sosyal', icon: 'popcorn', color: '#10B981' },
  { key: 'saglik', label: 'Sağlık & Kişisel Bakım', icon: 'heart-outline', color: '#EC4899' },
  { key: 'diger', label: 'Diğer', icon: 'dots-horizontal', color: '#6B7280' },
];

const INCOME_CATEGORIES: CategoryOption[] = [
  { key: 'maas', label: 'Maaş', icon: 'cash-multiple', color: '#10B981' },
  { key: 'ek-gelir', label: 'Ek Gelir', icon: 'plus-circle-outline', color: '#3B82F6' },
  { key: 'diger-gelir', label: 'Diğer', icon: 'dots-horizontal', color: '#6B7280' },
];

/* ─── Step Enum ────────────────────────────────────────────────── */

type Step = 'amount' | 'category' | 'details';

/* ─── Component ────────────────────────────────────────────────── */

export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: AddTransactionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('amount');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');

  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const bg = isDark ? '#0F172A' : '#F8F9FB';

  const categories = useMemo(
    () => (type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [type],
  );

  const resetForm = useCallback(() => {
    setStep('amount');
    setType(TransactionType.EXPENSE);
    setAmount('');
    setCategory('');
    setDescription('');
    setMerchant('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;

    onSubmit({
      type,
      amount: parsed,
      category,
      description,
      merchant,
      date: new Date().toISOString(),
    });
    resetForm();
  }, [amount, type, category, description, merchant, onSubmit, resetForm]);

  const amountColor = type === 'income' ? '#059669' : '#DC2626';

  /* ─── Step: Amount ─────────────────────────────────────────── */

  const renderAmountStep = () => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.stepContainer}>
      <SegmentedControl
        segments={[
          { label: 'Gider', value: 'expense' as TransactionType },
          { label: 'Gelir', value: 'income' as TransactionType },
        ]}
        selectedValue={type}
        onValueChange={(v) => setType(v)}
      />

      <View style={styles.amountSection}>
        <Text style={[styles.currencyLabel, { color: subtextColor }]}>Tutar</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.currencySign, { color: amountColor }]}>₺</Text>
          <Input
            label=""
            value={amount}
            onChangeText={setAmount}
            variant="default"
            keyboardType="decimal-pad"
            placeholder="0,00"
            containerStyle={styles.amountInput}
          />
        </View>
      </View>

      <Button
        title="Devam"
        onPress={() => setStep('category')}
        disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
        fullWidth
        icon="arrow-right"
        iconPosition="right"
      />
    </Animated.View>
  );

  /* ─── Step: Category ───────────────────────────────────────── */

  const renderCategoryStep = () => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: textColor }]}>Kategori Seç</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const isSelected = category === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: isSelected
                    ? `${cat.color}20`
                    : isDark
                    ? '#1E293B'
                    : '#F8F9FB',
                  borderColor: isSelected ? cat.color : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                },
              ]}
              onPress={() => setCategory(cat.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={28}
                color={cat.color}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  { color: isSelected ? cat.color : subtextColor },
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.stepButtons}>
        <Button
          title="Geri"
          onPress={() => setStep('amount')}
          variant="ghost"
          icon="arrow-left"
        />
        <Button
          title="Devam"
          onPress={() => setStep('details')}
          disabled={!category}
          icon="arrow-right"
          iconPosition="right"
        />
      </View>
    </Animated.View>
  );

  /* ─── Step: Details ────────────────────────────────────────── */

  const renderDetailsStep = () => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: textColor }]}>Detaylar</Text>

      <Input
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        icon="text-box-outline"
        placeholder="İşlem açıklaması"
      />

      <Input
        label="İşyeri"
        value={merchant}
        onChangeText={setMerchant}
        icon="store"
        placeholder="İşyeri adı (opsiyonel)"
      />

      <View style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: subtextColor }]}>Özet</Text>
        <Text style={[styles.summaryAmount, { color: amountColor }]}>
          {type === 'income' ? '+' : '-'}₺{amount}
        </Text>
        <Text style={[styles.summaryCategory, { color: textColor }]}>
          {categories.find((c) => c.key === category)?.label ?? category}
        </Text>
      </View>

      <View style={styles.stepButtons}>
        <Button
          title="Geri"
          onPress={() => setStep('category')}
          variant="ghost"
          icon="arrow-left"
        />
        <Button
          title="Kaydet"
          onPress={handleSubmit}
          loading={loading}
          icon="check"
          iconPosition="right"
        />
      </View>
    </Animated.View>
  );

  return (
    <Modal visible={visible} onClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Yeni İşlem
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={subtextColor}
              />
            </TouchableOpacity>
          </View>

          {/* Step indicators */}
          <View style={styles.stepIndicators}>
            {(['amount', 'category', 'details'] as Step[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      step === s
                        ? isDark
                          ? '#3B82F6'
                          : '#2563EB'
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                  },
                ]}
              />
            ))}
          </View>

          {/* Current step */}
          {step === 'amount' && renderAmountStep()}
          {step === 'category' && renderCategoryStep()}
          {step === 'details' && renderDetailsStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  currencyLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySign: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  summaryAmount: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  summaryCategory: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});

export default AddTransactionModal;
