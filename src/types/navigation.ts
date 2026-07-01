/**
 * DuoBudget - Navigasyon Tip Tanımlamaları
 * expo-router için route parametreleri.
 */

// ─── Root Layout Routes ──────────────────────────────────────────

/** Root layout route tanımları */
export type RootRoutes = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'modal': undefined;
};

// ─── Auth Routes ──────────────────────────────────────────────────

/** Kimlik doğrulama ekranları */
export type AuthRoutes = {
  'login': undefined;
  'register': undefined;
  'forgot-password': undefined;
  'partner-setup': PartnerSetupParams;
};

/** Partner eşleşme ekranı parametreleri */
export interface PartnerSetupParams {
  /** Direkt davet kodu ile gelindiyse */
  inviteCode?: string;
}

// ─── Tab Routes ───────────────────────────────────────────────────

/** Ana tab ekranları */
export type TabRoutes = {
  'index': undefined;          // Ana sayfa / Dashboard
  'transactions': undefined;   // İşlem listesi
  'add': undefined;            // Yeni işlem ekleme
  'budget': undefined;         // Bütçe yönetimi
  'profile': undefined;        // Profil & Ayarlar
};

// ─── Modal Routes ─────────────────────────────────────────────────

/** Modal ekranları */
export type ModalRoutes = {
  'transaction-detail': TransactionDetailParams;
  'card-detail': CardDetailParams;
  'category-picker': CategoryPickerParams;
  'pdf-import': undefined;
  'ai-analysis': undefined;
  'budget-edit': BudgetEditParams;
  'settings': undefined;
  'partner-invite': undefined;
};

// ─── Route Parametreleri ──────────────────────────────────────────

/** İşlem detay ekranı parametreleri */
export interface TransactionDetailParams {
  transactionId: string;
}

/** Kart detay ekranı parametreleri */
export interface CardDetailParams {
  cardId: string;
}

/** Kategori seçici parametreleri */
export interface CategoryPickerParams {
  /** Seçilen kategori ID'si geri döndürülecek */
  selectedCategoryId?: string;
  /** Sadece gelir kategorileri mi gösterilsin */
  incomeOnly?: boolean;
}

/** Bütçe düzenleme parametreleri */
export interface BudgetEditParams {
  categoryId: string;
  month: string; // YYYY-MM formatı
}

// ─── Navigasyon Yardımcı Tipleri ──────────────────────────────────

/** Tüm route isimlerinin birleşimi */
export type AllRouteNames =
  | keyof RootRoutes
  | keyof AuthRoutes
  | keyof TabRoutes
  | keyof ModalRoutes;

/** Tab bar'da gösterilecek ekran bilgisi */
export interface TabBarItem {
  name: keyof TabRoutes;
  title: string;
  icon: string;
  focusedIcon: string;
}

/** Tab bar tanımları */
export const TAB_BAR_ITEMS: TabBarItem[] = [
  {
    name: 'index',
    title: 'Ana Sayfa',
    icon: 'home-outline',
    focusedIcon: 'home',
  },
  {
    name: 'transactions',
    title: 'İşlemler',
    icon: 'swap-horizontal-outline',
    focusedIcon: 'swap-horizontal',
  },
  {
    name: 'add',
    title: 'Ekle',
    icon: 'add-circle-outline',
    focusedIcon: 'add-circle',
  },
  {
    name: 'budget',
    title: 'Bütçe',
    icon: 'pie-chart-outline',
    focusedIcon: 'pie-chart',
  },
  {
    name: 'profile',
    title: 'Profil',
    icon: 'person-outline',
    focusedIcon: 'person',
  },
];
