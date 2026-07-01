import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* ─── Types ────────────────────────────────────────────────────── */

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

interface FullScreenLoaderProps {
  label?: string;
  overlay?: boolean;
}

/* ─── Inline Spinner ───────────────────────────────────────────── */

export function LoadingSpinner({
  size = 32,
  color,
  label,
}: LoadingSpinnerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const defaultColor = color ?? (isDark ? '#3B82F6' : '#2563EB');
  const textColor = isDark ? '#94A3B8' : '#64748B';

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.inlineContainer}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name="loading"
          size={size}
          color={defaultColor}
        />
      </Animated.View>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </View>
  );
}

/* ─── Full Screen Loader ───────────────────────────────────────── */

export function FullScreenLoader({
  label = 'Yükleniyor...',
  overlay = false,
}: FullScreenLoaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0F172A' : '#F8F9FB';

  return (
    <View
      style={[
        styles.fullScreen,
        overlay ? styles.overlay : { backgroundColor: bg },
      ]}
    >
      <View style={styles.loaderBox}>
        <LoadingSpinner size={48} label={label} />
      </View>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loaderBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
});

export default LoadingSpinner;
