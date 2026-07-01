import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Transaction } from '@/types';

/* ─── Types ────────────────────────────────────────────────────── */

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  style?: ViewStyle;
}

/* ─── Category Icons Map ───────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  food: 'food',
  transport: 'car',
  shopping: 'shopping',
  health: 'hospital-box',
  entertainment: 'gamepad-variant',
  bills: 'file-document-outline',
  education: 'school',
  salary: 'cash-multiple',
  investment: 'chart-line',
  transfer: 'bank-transfer',
  rent: 'home-city',
  groceries: 'cart',
  utilities: 'flash',
  clothing: 'tshirt-crew',
  travel: 'airplane',
  other: 'dots-horizontal-circle',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  transport: '#3B82F6',
  shopping: '#EC4899',
  health: '#EF4444',
  entertainment: '#8B5CF6',
  bills: '#64748B',
  education: '#06B6D4',
  salary: '#059669',
  investment: '#10B981',
  transfer: '#6366F1',
  rent: '#F97316',
  groceries: '#22C55E',
  utilities: '#EAB308',
  clothing: '#D946EF',
  travel: '#0EA5E9',
  other: '#94A3B8',
};

/* ─── Component ────────────────────────────────────────────────── */

const DELETE_THRESHOLD = -80;

export function TransactionItem({
  transaction,
  onPress,
  onDelete,
  style,
}: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const translateX = useSharedValue(0);

  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const amountColor = transaction.type === 'income' ? '#059669' : '#DC2626';

  const categoryKey = transaction.categories?.name?.toLowerCase() ?? 'other';
  const iconName = CATEGORY_ICONS[categoryKey] ?? 'dots-horizontal-circle';
  const iconBg = CATEGORY_COLORS[categoryKey] ?? '#94A3B8';

  const formattedAmount = `${transaction.type === 'income' ? '+' : '-'}₺${Math.abs(
    transaction.amount,
  ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

  const formattedDate = new Date(transaction.transaction_date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });

  const doDelete = useCallback(() => {
    onDelete?.(transaction.id);
  }, [onDelete, transaction.id]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0 && onDelete) {
        translateX.value = Math.max(event.translationX, -120);
      }
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD && onDelete) {
        translateX.value = withTiming(-120, { duration: 200 });
        runOnJS(doDelete)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.wrapper, style]}
    >
      {/* Delete background */}
      {onDelete && (
        <View style={styles.deleteBackground}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteText}>Sil</Text>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, { backgroundColor: cardBg }, swipeStyle]}>
          <Pressable
            style={styles.content}
            onPress={() => onPress?.(transaction)}
          >
            {/* Category icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${iconBg}20` }]}>
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={iconBg}
              />
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={[styles.description, { color: textColor }]} numberOfLines={1}>
                {transaction.description || transaction.merchant || transaction.categories?.name}
              </Text>
              <Text style={[styles.meta, { color: subtextColor }]}>
                {transaction.categories?.name || 'Diğer'} • {formattedDate}
              </Text>
            </View>

            {/* Amount */}
            <Text style={[styles.amount, { color: amountColor }]}>
              {formattedAmount}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
    gap: 8,
    borderRadius: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  container: {
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  meta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default TransactionItem;
