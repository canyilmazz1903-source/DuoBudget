import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme, type ViewStyle } from 'react-native';

/* ─── Types ────────────────────────────────────────────────────── */

interface AvatarProps {
  name: string;
  imageUri?: string;
  size?: number;
  showPartnerDot?: boolean;
  partnerOnline?: boolean;
  style?: ViewStyle;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    '#2563EB', '#7C3AED', '#DB2777', '#059669',
    '#D97706', '#DC2626', '#0891B2', '#4F46E5',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Component ────────────────────────────────────────────────── */

export function Avatar({
  name,
  imageUri,
  size = 44,
  showPartnerDot = false,
  partnerOnline = false,
  style,
}: AvatarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const fontSize = Math.round(size * 0.38);
  const dotSize = Math.max(12, Math.round(size * 0.28));
  const borderColor = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <View style={[{ width: size, height: size }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showPartnerDot && (
        <View
          style={[
            styles.partnerDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderColor,
              backgroundColor: partnerOnline ? '#059669' : '#94A3B8',
            },
          ]}
        />
      )}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  partnerDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});

export default Avatar;
