/**
 * DuoBudget - Varsayılan Kategori Tanımları
 * Türkçe harcama kategorileri, ikon ve renk bilgileriyle.
 * İkonlar Ionicons kütüphanesinden kullanılmaktadır.
 */

/** Varsayılan kategori yapısı */
export interface DefaultCategory {
  /** Benzersiz anahtar */
  key: string;
  /** Görüntülenen ad (Türkçe) */
  name: string;
  /** Ionicons ikon adı */
  icon: string;
  /** Kategori rengi (hex) */
  color: string;
  /** Gelir kategorisi mi? */
  isIncome: boolean;
  /** Sıralama */
  sortOrder: number;
}

// ─── Gider Kategorileri ───────────────────────────────────────────

/** Varsayılan harcama kategorileri */
export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    key: 'market',
    name: 'Market',
    icon: 'cart-outline',
    color: '#10B981',
    isIncome: false,
    sortOrder: 1,
  },
  {
    key: 'fuel',
    name: 'Akaryakıt',
    icon: 'car-outline',
    color: '#F59E0B',
    isIncome: false,
    sortOrder: 2,
  },
  {
    key: 'clothing',
    name: 'Giyim',
    icon: 'shirt-outline',
    color: '#8B5CF6',
    isIncome: false,
    sortOrder: 3,
  },
  {
    key: 'restaurant',
    name: 'Restoran',
    icon: 'restaurant-outline',
    color: '#EF4444',
    isIncome: false,
    sortOrder: 4,
  },
  {
    key: 'transport',
    name: 'Ulaşım',
    icon: 'bus-outline',
    color: '#3B82F6',
    isIncome: false,
    sortOrder: 5,
  },
  {
    key: 'bills',
    name: 'Faturalar',
    icon: 'receipt-outline',
    color: '#EC4899',
    isIncome: false,
    sortOrder: 6,
  },
  {
    key: 'health',
    name: 'Sağlık',
    icon: 'medkit-outline',
    color: '#14B8A6',
    isIncome: false,
    sortOrder: 7,
  },
  {
    key: 'entertainment',
    name: 'Eğlence',
    icon: 'game-controller-outline',
    color: '#F97316',
    isIncome: false,
    sortOrder: 8,
  },
  {
    key: 'education',
    name: 'Eğitim',
    icon: 'school-outline',
    color: '#6366F1',
    isIncome: false,
    sortOrder: 9,
  },
  {
    key: 'rent',
    name: 'Kira',
    icon: 'home-outline',
    color: '#0EA5E9',
    isIncome: false,
    sortOrder: 10,
  },
  {
    key: 'subscriptions',
    name: 'Abonelikler',
    icon: 'refresh-outline',
    color: '#A855F7',
    isIncome: false,
    sortOrder: 11,
  },
  {
    key: 'other_expense',
    name: 'Diğer',
    icon: 'ellipsis-horizontal-outline',
    color: '#6B7280',
    isIncome: false,
    sortOrder: 12,
  },
];

// ─── Gelir Kategorileri ───────────────────────────────────────────

/** Varsayılan gelir kategorileri */
export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    key: 'salary',
    name: 'Maaş',
    icon: 'wallet-outline',
    color: '#059669',
    isIncome: true,
    sortOrder: 1,
  },
  {
    key: 'freelance',
    name: 'Serbest Çalışma',
    icon: 'laptop-outline',
    color: '#10B981',
    isIncome: true,
    sortOrder: 2,
  },
  {
    key: 'investment',
    name: 'Yatırım Geliri',
    icon: 'trending-up-outline',
    color: '#3B82F6',
    isIncome: true,
    sortOrder: 3,
  },
  {
    key: 'gift_income',
    name: 'Hediye / Transfer',
    icon: 'gift-outline',
    color: '#F59E0B',
    isIncome: true,
    sortOrder: 4,
  },
  {
    key: 'other_income',
    name: 'Diğer Gelir',
    icon: 'add-circle-outline',
    color: '#6B7280',
    isIncome: true,
    sortOrder: 5,
  },
];

// ─── Birleşik Liste ───────────────────────────────────────────────

/** Tüm varsayılan kategoriler */
export const ALL_DEFAULT_CATEGORIES: DefaultCategory[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────

/**
 * Kategori adına göre varsayılan kategori bilgisini bulur.
 * AI'ın önerdiği kategori adlarını eşleştirmek için kullanılır.
 */
export function findDefaultCategoryByName(name: string): DefaultCategory | undefined {
  const normalizedName = name.toLowerCase().trim();
  return ALL_DEFAULT_CATEGORIES.find(
    (cat) => cat.name.toLowerCase() === normalizedName || cat.key === normalizedName,
  );
}

/**
 * Kategorinin rengini key'e göre döndürür, bulunamazsa varsayılan gri döner.
 */
export function getCategoryColor(key: string): string {
  const category = ALL_DEFAULT_CATEGORIES.find((cat) => cat.key === key);
  return category?.color ?? '#6B7280';
}

/**
 * Kategorinin ikonunu key'e göre döndürür.
 */
export function getCategoryIcon(key: string): string {
  const category = ALL_DEFAULT_CATEGORIES.find((cat) => cat.key === key);
  return category?.icon ?? 'help-circle-outline';
}
