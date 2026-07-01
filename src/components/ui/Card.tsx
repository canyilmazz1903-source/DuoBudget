import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

/* ─── Types ────────────────────────────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  elevated?: boolean;
}

/* ─── Component ────────────────────────────────────────────────── */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  style,
  onPress,
  header,
  footer,
  noPadding = false,
  elevated = true,
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }, [onPress, scale]);

  const cardStyle: ViewStyle = {
    backgroundColor: bg,
    borderColor,
    borderWidth: isDark ? 1 : 0,
    ...(elevated && !isDark
      ? {
          shadowColor: '#64748B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }
      : {}),
  };

  const Wrapper = onPress ? AnimatedPressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        style: [styles.card, cardStyle, animatedStyle, style],
      }
    : {
        style: [styles.card, cardStyle, style] as ViewStyle[],
      };

  return (
    <Wrapper {...wrapperProps}>
      {header && (
        <View style={styles.header}>{header}</View>
      )}
      <View style={noPadding ? undefined : styles.content}>
        {children}
      </View>
      {footer && (
        <View style={styles.footer}>{footer}</View>
      )}
    </Wrapper>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});

export default Card;
