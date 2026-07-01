/**
 * DuoBudget - Tasarım Sistemi
 * Light/Dark tema, tipografi, aralık ve gölge tanımları.
 */

// ─── Renk Tanımları ───────────────────────────────────────────────

/** Tema renk paleti */
export interface ThemeColors {
  // Arka planlar
  background: string;
  backgroundSecondary: string;
  card: string;
  cardSecondary: string;

  // Marka renkleri
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Durum renkleri
  income: string;
  incomeLight: string;
  expense: string;
  expenseLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;

  // Metin renkleri
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Kenarlık ve ayırıcılar
  border: string;
  borderLight: string;
  separator: string;

  // Etkileşim durumları
  ripple: string;
  overlay: string;
  disabled: string;

  // Tab bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Özel
  skeleton: string;
  success: string;
  error: string;
}

/** Light tema renkleri */
export const lightColors: ThemeColors = {
  background: '#F8F9FB',
  backgroundSecondary: '#EFF1F5',
  card: '#FFFFFF',
  cardSecondary: '#F3F4F6',

  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',

  income: '#059669',
  incomeLight: '#D1FAE5',
  expense: '#DC2626',
  expenseLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  separator: '#E5E7EB',

  ripple: 'rgba(37, 99, 235, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#CBD5E1',

  tabBarBackground: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#94A3B8',

  skeleton: '#E2E8F0',
  success: '#059669',
  error: '#DC2626',
};

/** Dark tema renkleri - Organik ve profesyonel */
export const darkColors: ThemeColors = {
  background: '#0F172A',
  backgroundSecondary: '#1A2332',
  card: '#1E293B',
  cardSecondary: '#273449',

  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  primaryDark: '#60A5FA',

  income: '#10B981',
  incomeLight: '#064E3B',
  expense: '#EF4444',
  expenseLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#38BDF8',
  infoLight: '#0C4A6E',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  border: '#334155',
  borderLight: '#1E293B',
  separator: '#2D3B4F',

  ripple: 'rgba(59, 130, 246, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#475569',

  tabBarBackground: '#1E293B',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#64748B',

  skeleton: '#334155',
  success: '#10B981',
  error: '#EF4444',
};

// ─── Tipografi ────────────────────────────────────────────────────

/** Font ailesi tanımları */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Font boyut skalası */
export interface FontSize {
  size: number;
  lineHeight: number;
}

export const typography = {
  /** Büyük başlık (32/40) */
  h1: { size: 32, lineHeight: 40 } as FontSize,
  /** Başlık (24/32) */
  h2: { size: 24, lineHeight: 32 } as FontSize,
  /** Alt başlık (20/28) */
  h3: { size: 20, lineHeight: 28 } as FontSize,
  /** Küçük başlık (18/26) */
  h4: { size: 18, lineHeight: 26 } as FontSize,
  /** Büyük gövde metni (16/24) */
  bodyLarge: { size: 16, lineHeight: 24 } as FontSize,
  /** Normal gövde metni (14/20) */
  body: { size: 14, lineHeight: 20 } as FontSize,
  /** Küçük metin (12/16) */
  caption: { size: 12, lineHeight: 16 } as FontSize,
  /** En küçük metin (10/14) */
  tiny: { size: 10, lineHeight: 14 } as FontSize,
  /** Tutar gösterimi - büyük (28/36) */
  amountLarge: { size: 28, lineHeight: 36 } as FontSize,
  /** Tutar gösterimi - normal (20/28) */
  amount: { size: 20, lineHeight: 28 } as FontSize,
} as const;

// ─── Aralık Sistemi ───────────────────────────────────────────────

/** Aralık skalası (4px tabanlı) */
export const spacing = {
  /** 4px - Çok küçük */
  xs: 4,
  /** 8px - Küçük */
  sm: 8,
  /** 12px - Küçük-orta */
  md: 12,
  /** 16px - Orta (varsayılan) */
  base: 16,
  /** 20px - Orta-büyük */
  lg: 20,
  /** 24px - Büyük */
  xl: 24,
  /** 32px - Çok büyük */
  '2xl': 32,
  /** 40px - Devasa */
  '3xl': 40,
  /** 48px - Ekstra büyük */
  '4xl': 48,
  /** 64px - Maksimum */
  '5xl': 64,
} as const;

// ─── Kenarlık Yarıçapı ───────────────────────────────────────────

/** Köşe yuvarlaklık skalası */
export const borderRadius = {
  /** 4px - Hafif */
  xs: 4,
  /** 8px - Küçük */
  sm: 8,
  /** 12px - Orta */
  md: 12,
  /** 16px - Büyük */
  lg: 16,
  /** 20px - Çok büyük */
  xl: 20,
  /** 24px - Devasa */
  '2xl': 24,
  /** Tam yuvarlak */
  full: 9999,
} as const;

// ─── Gölge Tanımları ──────────────────────────────────────────────

/** Platform bağımsız gölge yapısı */
export interface ShadowDefinition {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
}

/** Gölge skalası */
export const shadows = {
  /** Hafif gölge - Kartlar */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ShadowDefinition,

  /** Orta gölge - Yükselen elemanlar */
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  } as ShadowDefinition,

  /** Büyük gölge - Modal, bottom sheet */
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  } as ShadowDefinition,

  /** Ekstra büyük gölge - Floating butonlar */
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  } as ShadowDefinition,
} as const;

// ─── Tema Yapısı ──────────────────────────────────────────────────

/** Tam tema yapısı */
export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

/** Light tema */
export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
};

/** Dark tema */
export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
};

// ─── Animasyon Sabitleri ──────────────────────────────────────────

/** Animasyon süreleri (ms) */
export const animationDuration = {
  fast: 150,
  normal: 250,
  slow: 400,
  page: 350,
} as const;

/** Geçiş easing değerleri */
export const animationEasing = {
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.175, 0.885, 0.32, 1.275] as const,
} as const;

// ─── Hit Slop ─────────────────────────────────────────────────────

/** Dokunma alanı genişletme değerleri */
export const hitSlop = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;
