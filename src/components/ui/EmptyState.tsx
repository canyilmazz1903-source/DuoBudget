import React from 'react';
import { View, Text, StyleSheet, useColorScheme, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';

/* ─── Types ────────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/* ─── Component ────────────────────────────────────────────────── */

export function EmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const iconColor = isDark ? '#475569' : '#CBD5E1';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <MaterialCommunityIcons name={icon} size={48} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: subtextColor }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrapper}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: 24,
  },
});

export default EmptyState;
