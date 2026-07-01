/**
 * DuoBudget - Veritabanı Tip Tanımlamaları
 * Supabase tablolarına karşılık gelen tüm interface ve enum tanımları.
 */

// ─── Enum Tanımları ───────────────────────────────────────────────

/** Kart türü: Kredi kartı veya banka/debit kartı */
export enum CardType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

/** İşlem türü: Gelir veya gider */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/** İşlem kaynağı: Manuel giriş, PDF import veya AI analiz */
export enum TransactionSource {
  MANUAL = 'manual',
  PDF_IMPORT = 'pdf_import',
  AI_ANALYSIS = 'ai_analysis',
}

/** Ortak hesap durumu */
export enum JointAccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISSOLVED = 'dissolved',
}

// ─── Tablo Interface Tanımları ────────────────────────────────────

/** Kullanıcı profili */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  salary_amount: number;
  salary_day: number | null;
  invite_code: string;
  joint_account_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Ortak hesap (partner eşleşmesi) */
export interface JointAccount {
  id: string;
  user1_id: string;
  user2_id: string | null;
  name: string;
  monthly_budget: number;
  currency: string;
  status: JointAccountStatus;
  created_at: string;
  updated_at: string;
}

/** Banka/Kredi kartı */
export interface Card {
  id: string;
  joint_account_id: string;
  owner_id: string;
  card_name: string;
  card_type: CardType;
  last_four_digits: string;
  billing_day: number | null;
  due_day: number | null;
  credit_limit: number | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

/** Kategori */
export interface Category {
  id: string;
  joint_account_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

/** Finansal işlem (gelir/gider) */
export interface Transaction {
  id: string;
  joint_account_id: string;
  card_id: string | null;
  entered_by: string;
  type: TransactionType;
  amount: number;
  description: string;
  merchant: string | null;
  category_id: string;
  transaction_date: string;
  source: TransactionSource;
  is_recurring: boolean;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
  // Join fields
  categories?: Category;
  cards?: Card;
}

/** Bütçe limiti */
export interface Budget {
  id: string;
  joint_account_id: string;
  category_id: string;
  amount: number;
  period_start: string; // YYYY-MM-DD
  period_end: string;
  created_at: string;
  categories?: Category;
}

/** AI analiz sonuçları */
export interface AiAnalysis {
  id: string;
  joint_account_id: string;
  analysis_month: string;
  savings_suggestions: any;
  projection: any;
  warnings: any;
  created_at: string;
}

/** Çevrimdışı kuyruk öğesi */
export interface OfflineQueueItem {
  id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  table_name: string;
  payload: any;
  created_at: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'categories' | 'cards'>;
export type NewCard = Omit<Card, 'id' | 'created_at'>;
export type NewBudget = Omit<Budget, 'id' | 'created_at' | 'categories'>;

/** Supabase client database schema interface mapping */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email' | 'full_name' | 'invite_code'>;
        Update: Partial<Profile>;
      };
      joint_accounts: {
        Row: JointAccount;
        Insert: Partial<JointAccount> & Pick<JointAccount, 'user1_id' | 'name'>;
        Update: Partial<JointAccount>;
      };
      cards: {
        Row: Card;
        Insert: Partial<Card> & Pick<Card, 'joint_account_id' | 'owner_id' | 'card_name' | 'card_type' | 'last_four_digits'>;
        Update: Partial<Card>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, 'name'>;
        Update: Partial<Category>;
      };
      budgets: {
        Row: Budget;
        Insert: Partial<Budget> & Pick<Budget, 'joint_account_id' | 'category_id' | 'amount'>;
        Update: Partial<Budget>;
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction> & Pick<Transaction, 'joint_account_id' | 'entered_by' | 'category_id' | 'amount' | 'type'>;
        Update: Partial<Transaction>;
      };
      ai_analyses: {
        Row: AiAnalysis;
        Insert: Partial<AiAnalysis> & Pick<AiAnalysis, 'joint_account_id' | 'analysis_month'>;
        Update: Partial<AiAnalysis>;
      };
      offline_queue: {
        Row: OfflineQueueItem;
        Insert: Partial<OfflineQueueItem> & Pick<OfflineQueueItem, 'action' | 'table_name' | 'payload'>;
        Update: Partial<OfflineQueueItem>;
      };
    };
  };
}
