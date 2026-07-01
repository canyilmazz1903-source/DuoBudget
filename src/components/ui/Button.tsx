import React, { useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* ─── Types ────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

/* ─── Theme Colors ─────────────────────────────────────────────── */

const getVariantStyles = (
  variant: ButtonVariant,
  isDark: boolean,
): { bg: string; text: string; border: string } => {
  const primary = isDark ? '#3B82F6' : '#2563EB';
  const map: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
    primary: { bg: primary, text: '#FFFFFF', border: 'transparent' },
    secondary: {
      bg: isDark ? '#334155' : '#E2E8F0',
      text: isDark ? '#E2E8F0' : '#1E293B',
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: primary,
      border: primary,
    },
    ghost: {
      bg: 'transparent',
      text: primary,
      border: 'transparent',
    },
    danger: { bg: '#DC2626', text: '#FFFFFF', border: 'transparent' },
  };
  return map[variant];
};

const sizeStyles: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number; iconSize: number; borderRadius: number }
> = {
  sm: { height: 36, paddingH: 14, fontSize: 13, iconSize: 16, borderRadius: 10 },
  md: { height: 48, paddingH: 20, fontSize: 15, iconSize: 20, borderRadius: 12 },
  lg: { height: 56, paddingH: 28, fontSize: 17, iconSize: 22, borderRadius: 14 },
};

/* ─── Component ────────────────────────────────────────────────── */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  const colors = getVariantStyles(variant, isDark);
  const sizing = sizeStyles[size];
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onPress();
    }
  }, [isDisabled, onPress]);

  const containerStyle: ViewStyle = {
    height: sizing.height,
    paddingHorizontal: sizing.paddingH,
    borderRadius: sizing.borderRadius,
    backgroundColor: colors.bg,
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderColor: colors.border,
    opacity: isDisabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'center',
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[styles.base, containerStyle, animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.text}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            typeof icon === 'string' ? (
              <MaterialCommunityIcons
                name={icon as any}
                size={sizing.iconSize}
                color={colors.text}
                style={styles.iconLeft}
              />
            ) : (
              icon
            )
          )}
          <Text
            style={[
              styles.text,
              {
                color: colors.text,
                fontSize: sizing.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            typeof icon === 'string' ? (
              <MaterialCommunityIcons
                name={icon as any}
                size={sizing.iconSize}
                color={colors.text}
                style={styles.iconRight}
              />
            ) : (
              icon
            )
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
