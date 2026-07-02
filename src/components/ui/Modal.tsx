import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─── Types ────────────────────────────────────────────────────── */

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  style?: ViewStyle;
  dismissOnBackdrop?: boolean;
  showHandle?: boolean;
}

/* ─── Component ────────────────────────────────────────────────── */

export function Modal({
  visible,
  onClose,
  children,
  snapPoints,
  style,
  dismissOnBackdrop = true,
  showHandle = true,
}: ModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const handleColor = isDark ? '#475569' : '#CBD5E1';

  const maxHeight = snapPoints
    ? screenHeight * (Math.max(...snapPoints) / 100)
    : screenHeight * 0.85;

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = 0;
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, backdropOpacity, translateY]);

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 800) {
        translateY.value = withTiming(screenHeight, { duration: 250 });
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.5,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        {/* Backdrop */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdrop ? closeModal : undefined}
        >
          <Animated.View
            style={[styles.backdrop, backdropAnimStyle]}
          />
        </Pressable>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(300)}
            exiting={SlideOutDown.duration(250)}
            style={[
              styles.sheet,
              {
                backgroundColor: cardBg,
                height: maxHeight,
                paddingBottom: insets.bottom + 16,
              },
              sheetAnimStyle,
              style,
            ]}
          >
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: handleColor }]} />
              </View>
            )}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.content}
            >
              {children}
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});

export default Modal;
