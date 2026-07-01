/**
 * DuoBudget - Uygulama Yapılandırması
 * API endpoint'leri, sayfalama limitleri, önbellek süreleri ve sürüm bilgileri.
 */

// ─── Uygulama Bilgileri ───────────────────────────────────────────

export const APP_CONFIG = {
  /** Uygulama adı */
  APP_NAME: 'DuoBudget',
  /** Uygulama sürümü */
  APP_VERSION: '1.0.0',
  /** Build numarası */
  BUILD_NUMBER: 1,
  /** Minimum desteklenen API sürümü */
  MIN_API_VERSION: '1.0.0',
} as const;

// ─── Supabase Yapılandırması ──────────────────────────────────────

export const SUPABASE_CONFIG = {
  /** Supabase proje URL'si - .env'den okunacak */
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  /** Supabase anon key - .env'den okunacak */
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Edge Functions base URL */
  FUNCTIONS_URL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ?? '',
} as const;

// ─── Gemini AI Yapılandırması ─────────────────────────────────────

export const GEMINI_CONFIG = {
  /** Gemini API anahtarı - .env'den okunacak */
  API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  /** Gemini API base URL */
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  /** Kullanılacak model */
  MODEL: 'gemini-2.0-flash',
  /** Ekstre analizi için sıcaklık */
  STATEMENT_TEMPERATURE: 0.1,
  /** Finansal projeksiyon için sıcaklık */
  PROJECTION_TEMPERATURE: 0.4,
  /** Maksimum çıktı token sayısı */
  MAX_OUTPUT_TOKENS: 8192,
  /** Top P değeri */
  TOP_P: 0.95,
  /** Top K değeri */
  TOP_K: 40,
  /** API istek zaman aşımı (ms) */
  TIMEOUT_MS: 30_000,
  /** Maksimum yeniden deneme sayısı */
  MAX_RETRIES: 3,
  /** İlk yeniden deneme bekleme süresi (ms) */
  INITIAL_RETRY_DELAY_MS: 1_000,
} as const;

// ─── Sayfalama ────────────────────────────────────────────────────

export const PAGINATION = {
  /** İşlem listesi sayfa boyutu */
  TRANSACTIONS_PAGE_SIZE: 25,
  /** Kategori listesi sayfa boyutu */
  CATEGORIES_PAGE_SIZE: 50,
  /** AI analiz geçmişi sayfa boyutu */
  AI_ANALYSES_PAGE_SIZE: 10,
  /** Arama sonuçları limiti */
  SEARCH_RESULTS_LIMIT: 20,
} as const;

// ─── Önbellek Süreleri ────────────────────────────────────────────

export const CACHE_DURATION = {
  /** Profil verisi önbellek süresi (ms) - 5 dakika */
  PROFILE: 5 * 60 * 1_000,
  /** Kategori listesi önbellek süresi (ms) - 30 dakika */
  CATEGORIES: 30 * 60 * 1_000,
  /** İşlem listesi önbellek süresi (ms) - 2 dakika */
  TRANSACTIONS: 2 * 60 * 1_000,
  /** Bütçe verisi önbellek süresi (ms) - 10 dakika */
  BUDGETS: 10 * 60 * 1_000,
  /** AI analiz önbellek süresi (ms) - 1 saat */
  AI_ANALYSIS: 60 * 60 * 1_000,
  /** Kart listesi önbellek süresi (ms) - 15 dakika */
  CARDS: 15 * 60 * 1_000,
} as const;

// ─── Çevrimdışı Kuyruk ───────────────────────────────────────────

export const OFFLINE_CONFIG = {
  /** Maksimum yeniden deneme sayısı */
  MAX_RETRY_COUNT: 5,
  /** Senkronizasyon kontrol aralığı (ms) - 30 saniye */
  SYNC_INTERVAL_MS: 30_000,
  /** Kuyruk maksimum boyutu */
  MAX_QUEUE_SIZE: 100,
} as const;

// ─── Para Birimi ──────────────────────────────────────────────────

export const CURRENCY_CONFIG = {
  /** Varsayılan para birimi */
  DEFAULT_CURRENCY: 'TRY',
  /** Para birimi sembolü */
  DEFAULT_SYMBOL: '₺',
  /** Ondalık basamak sayısı */
  DECIMAL_PLACES: 2,
  /** Desteklenen para birimleri */
  SUPPORTED_CURRENCIES: ['TRY', 'USD', 'EUR', 'GBP'] as const,
} as const;

// ─── Davet Kodu ───────────────────────────────────────────────────

export const INVITE_CODE_CONFIG = {
  /** Davet kodu uzunluğu */
  CODE_LENGTH: 8,
  /** Davet kodunda kullanılacak karakterler */
  CODE_CHARACTERS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  /** Davet kodunun geçerlilik süresi (ms) - 7 gün */
  EXPIRY_MS: 7 * 24 * 60 * 60 * 1_000,
} as const;

// ─── Doğrulama Sabitleri ──────────────────────────────────────────

export const VALIDATION = {
  /** Minimum şifre uzunluğu */
  MIN_PASSWORD_LENGTH: 8,
  /** Maksimum şifre uzunluğu */
  MAX_PASSWORD_LENGTH: 128,
  /** Maksimum isim uzunluğu */
  MAX_NAME_LENGTH: 64,
  /** Maksimum açıklama uzunluğu */
  MAX_DESCRIPTION_LENGTH: 256,
  /** Maksimum not uzunluğu */
  MAX_NOTE_LENGTH: 512,
  /** Kart son 4 hane uzunluğu */
  CARD_LAST_FOUR_LENGTH: 4,
  /** Maksimum işlem tutarı */
  MAX_TRANSACTION_AMOUNT: 9_999_999.99,
  /** Minimum işlem tutarı */
  MIN_TRANSACTION_AMOUNT: 0.01,
} as const;

// ─── Edge Function Yolları ────────────────────────────────────────

export const EDGE_FUNCTIONS = {
  /** PDF metin çıkarma */
  EXTRACT_PDF_TEXT: 'extract-pdf-text',
  /** Toplu işlem importu */
  BULK_IMPORT_TRANSACTIONS: 'bulk-import-transactions',
} as const;

// ─── AsyncStorage Anahtarları ─────────────────────────────────────

export const STORAGE_KEYS = {
  /** Auth store persist anahtarı */
  AUTH_STORE: 'duobudget-auth-store',
  /** Budget store persist anahtarı */
  BUDGET_STORE: 'duobudget-budget-store',
  /** Tema tercihi */
  THEME_PREFERENCE: 'duobudget-theme',
  /** Dil tercihi */
  LOCALE_PREFERENCE: 'duobudget-locale',
  /** Son senkronizasyon zamanı */
  LAST_SYNC_TIME: 'duobudget-last-sync',
  /** Onboarding tamamlandı mı */
  ONBOARDING_COMPLETE: 'duobudget-onboarding',
} as const;

// ─── Bildirim Sabitleri ───────────────────────────────────────────

export const NOTIFICATION_CONFIG = {
  /** Maaş günü hatırlatma saati (saat) */
  SALARY_REMINDER_HOUR: 9,
  /** Fatura son ödeme hatırlatma (gün önce) */
  DUE_DATE_REMINDER_DAYS_BEFORE: 3,
  /** Bütçe aşımı eşiği (%) */
  BUDGET_WARNING_THRESHOLD: 80,
  /** Bütçe kritik eşik (%) */
  BUDGET_CRITICAL_THRESHOLD: 95,
} as const;
