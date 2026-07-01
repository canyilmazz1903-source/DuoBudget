import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/* ─── Types ────────────────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ─── Core Error Boundary (class component) ────────────────────── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log for debugging / future Sentry integration
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

/* ─── Default Fallback UI ──────────────────────────────────────── */

interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0F172A' : '#F8F9FB';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const primaryColor = isDark ? '#3B82F6' : '#2563EB';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color="#DC2626"
        />
        <Text style={[styles.title, { color: textColor }]}>
          Bir şeyler yanlış gitti
        </Text>
        <Text style={[styles.message, { color: subtextColor }]}>
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </Text>
        {__DEV__ && (
          <Text style={[styles.errorDetail, { color: subtextColor }]}>
            {error.message}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={onReset}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Screen Error Boundary ────────────────────────────────────── */

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({
  children,
  screenName,
}: ScreenErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`[ScreenError] ${screenName ?? 'Unknown'}:`, error);
        console.error('[ScreenError] Stack:', errorInfo.componentStack);
      }}
      fallback={(error: Error, reset: () => void) => (
        <ScreenErrorFallback
          error={error}
          onReset={reset}
          screenName={screenName}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

interface ScreenErrorFallbackProps {
  error: Error;
  onReset: () => void;
  screenName?: string;
}

function ScreenErrorFallback({
  error,
  onReset,
  screenName,
}: ScreenErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0F172A' : '#F8F9FB';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const primaryColor = isDark ? '#3B82F6' : '#2563EB';

  return (
    <View style={[styles.screenContainer, { backgroundColor: bg }]}>
      <MaterialCommunityIcons
        name="monitor-off"
        size={72}
        color="#DC2626"
      />
      <Text style={[styles.screenTitle, { color: textColor }]}>
        {screenName ? `"${screenName}" yüklenemedi` : 'Sayfa yüklenemedi'}
      </Text>
      <Text style={[styles.message, { color: subtextColor }]}>
        Bu sayfada bir sorun oluştu. Lütfen tekrar deneyin.
      </Text>
      {__DEV__ && (
        <Text style={[styles.errorDetail, { color: subtextColor }]}>
          {error.message}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: primaryColor }]}
        onPress={onReset}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Widget Error Boundary ────────────────────────────────────── */

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  widgetName?: string;
  compact?: boolean;
}

export function WidgetErrorBoundary({
  children,
  widgetName,
  compact = false,
}: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error(`[WidgetError] ${widgetName ?? 'Unknown'}:`, error);
      }}
      fallback={(error: Error, reset: () => void) => (
        <WidgetErrorFallback
          error={error}
          onReset={reset}
          widgetName={widgetName}
          compact={compact}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

interface WidgetErrorFallbackProps {
  error: Error;
  onReset: () => void;
  widgetName?: string;
  compact?: boolean;
}

function WidgetErrorFallback({
  onReset,
  widgetName,
  compact,
}: WidgetErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactWidget, { backgroundColor: cardBg }]}
        onPress={onReset}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={16}
          color="#DC2626"
        />
        <Text style={[styles.compactText, { color: subtextColor }]}>
          Yüklenemedi – Dokunarak tekrar deneyin
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.widgetContainer, { backgroundColor: cardBg }]}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={32}
        color="#DC2626"
      />
      <Text style={[styles.widgetTitle, { color: textColor }]}>
        {widgetName ? `${widgetName} yüklenemedi` : 'Widget yüklenemedi'}
      </Text>
      <TouchableOpacity
        style={styles.widgetRetry}
        onPress={onReset}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="refresh" size={16} color="#2563EB" />
        <Text style={styles.widgetRetryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorDetail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginTop: 20,
    textAlign: 'center',
  },
  widgetContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    margin: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  widgetRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  widgetRetryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2563EB',
  },
  compactWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  compactText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});

export default ErrorBoundary;
