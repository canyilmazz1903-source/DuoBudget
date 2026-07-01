import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

/* ─── Types ────────────────────────────────────────────────────── */

interface SegmentedControlProps<T extends string> {
  segments: { label: string; value: T }[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  style?: ViewStyle;
}

/* ─── Component ────────────────────────────────────────────────── */

export function SegmentedControl<T extends string>({
  segments,
  selectedValue,
  onValueChange,
  style,
}: SegmentedControlProps<T>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const containerWidth = useSharedValue(0);
  const segmentCount = segments.length;

  const bg = isDark ? '#1E293B' : '#F1F5F9';
  const activeBg = isDark ? '#334155' : '#FFFFFF';
  const activeText = isDark ? '#F1F5F9' : '#0F172A';
  const inactiveText = isDark ? '#94A3B8' : '#64748B';

  const selectedIndex = segments.findIndex((s) => s.value === selectedValue);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      containerWidth.value = event.nativeEvent.layout.width;
    },
    [containerWidth],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const segWidth = containerWidth.value / segmentCount;
    return {
      width: segWidth - 4,
      transform: [
        {
          translateX: withSpring(selectedIndex * segWidth + 2, {
            damping: 18,
            stiffness: 300,
          }),
        },
      ],
    };
  });

  return (
    <View
      style={[styles.container, { backgroundColor: bg }, style]}
      onLayout={handleLayout}
    >
      {/* Sliding indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: activeBg },
          indicatorStyle,
        ]}
      />

      {/* Segments */}
      {segments.map((segment) => {
        const isActive = segment.value === selectedValue;
        return (
          <Pressable
            key={segment.value}
            style={styles.segment}
            onPress={() => onValueChange(segment.value)}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? activeText : inactiveText },
                isActive && styles.labelActive,
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    position: 'relative',
    height: 44,
  },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
  },
});

export default SegmentedControl;
