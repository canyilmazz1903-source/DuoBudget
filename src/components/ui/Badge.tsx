import React from 'react';
import { View, Text, StyleSheet, useColorScheme, type ViewStyle } from 'react-native';

/* ─── Types ────────────────────────────────────────────────────── */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/* ─── Colors ───────────────────────────────────────────────────── */

const variantColors: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#DCFCE7', text: '#166534', dot: '#059669' },
  warning: { bg: '#FEF9C3', text: '#854D0E', dot: '#D97706' },
  danger: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  info: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  neutral: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

const variantColorsDark: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#052E16', text: '#86EFAC', dot: '#34D399' },
  warning: { bg: '#422006', text: '#FDE047', dot: '#FBBF24' },
  danger: { bg: '#450A0A', text: '#FCA5A5', dot: '#F87171' },
  info: { bg: '#1E3A5F', text: '#93C5FD', dot: '#60A5FA' },
  neutral: { bg: '#334155', text: '#CBD5E1', dot: '#94A3B8' },
};

/* ─── Component ────────────────────────────────────────────────── */

export function Badge({
  label,
  variant = 'neutral',
  dot = false,
  size = 'md',
  style,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? variantColorsDark[variant] : variantColors[variant];

  // Dot-only variant
  if (dot && !label) {
    const dotSize = size === 'sm' ? 8 : 10;
    return (
      <View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.dot,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dotInline,
            { backgroundColor: colors.dot },
          ]}
        />
      )}
      {label ? (
        <Text
          style={[
            styles.text,
            size === 'sm' ? styles.textSm : styles.textMd,
            { color: colors.text },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 100,
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontFamily: 'Inter_500Medium',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
  dotInline: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Badge;
