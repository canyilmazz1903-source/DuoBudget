import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* ─── Types ────────────────────────────────────────────────────── */

type InputVariant = 'default' | 'password' | 'currency';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  variant?: InputVariant;
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

/* ─── Component ────────────────────────────────────────────────── */

export function Input({
  label,
  variant = 'default',
  error,
  icon,
  containerStyle,
  disabled = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputRef = useRef<TextInput>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useSharedValue(value ? 1 : 0);

  const hasValue = value !== undefined && value !== null && value !== '';

  // React to value or focus changes dynamically
  React.useEffect(() => {
    labelAnim.value = withTiming(isFocused || hasValue ? 1 : 0, { duration: 200 });
  }, [value, isFocused, hasValue]);

  // Colors
  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const borderDefault = isDark ? '#334155' : '#E2E8F0';
  const borderFocus = isDark ? '#3B82F6' : '#2563EB';
  const borderError = '#DC2626';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const placeholderColor = isDark ? '#475569' : '#CBD5E1';

  const currentBorder = error ? borderError : isFocused ? borderFocus : borderDefault;

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const labelAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(labelAnim.value, [0, 1], [0, -22]) },
        { scale: interpolate(labelAnim.value, [0, 1], [1, 0.8]) },
      ],
      color: interpolateColor(
        labelAnim.value,
        [0, 1],
        [labelColor, isFocused ? borderFocus : labelColor],
      ),
    };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.container,
          {
            backgroundColor: bg,
            borderColor: currentBorder,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Icon or Currency prefix */}
        {variant === 'currency' && (
          <Text style={[styles.currencySymbol, { color: textColor }]}>₺</Text>
        )}
        {icon && variant !== 'currency' && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={labelColor}
            style={styles.leftIcon}
          />
        )}

        {/* Input area */}
        <View style={styles.inputArea}>
          <Animated.Text
            style={[
              styles.floatingLabel,
              labelAnimStyle,
              { backgroundColor: bg },
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: textColor }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={variant === 'password' && !showPassword}
            keyboardType={variant === 'currency' ? 'decimal-pad' : rest.keyboardType}
            placeholder={(isFocused || hasValue) ? rest.placeholder : undefined}
            placeholderTextColor={placeholderColor}
            editable={!disabled}
            {...rest}
          />
        </View>

        {/* Password toggle */}
        {variant === 'password' && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={labelColor}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Error message */}
      {error ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 16,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 4,
    paddingTop: 8,
    minHeight: 40,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 8,
  },
  leftIcon: {
    marginRight: 12,
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#DC2626',
  },
});

export default Input;
