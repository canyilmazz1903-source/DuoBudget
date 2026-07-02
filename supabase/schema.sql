-- =============================================================================
-- DuoBudget - Supabase SQL Schema
-- =============================================================================
-- Bu dosya DuoBudget uygulamasının tüm veritabanı şemasını içerir.
-- Supabase SQL Editor'de çalıştırarak veritabanınızı oluşturabilirsiniz.
-- =============================================================================

-- ===========================================================================
-- EXTENSIONS
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- CUSTOM TYPES
-- ===========================================================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE card_type AS ENUM ('credit', 'debit', 'cash');
CREATE TYPE transaction_source AS ENUM ('manual', 'pdf_import');
CREATE TYPE joint_account_status AS ENUM ('pending', 'active', 'dissolved');
CREATE TYPE category_type AS ENUM ('income', 'expense');

-- ===========================================================================
-- HELPER FUNCTIONS
-- ===========================================================================

-- Generate unique 8-char hex invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := substr(md5(random()::text), 1, 8);
    SELECT EXISTS(SELECT 1 FROM profiles WHERE invite_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- ===========================================================================
-- TABLE: profiles (extends auth.users)
-- ===========================================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  salary_amount   NUMERIC(12, 2) DEFAULT 0,
  salary_day      INTEGER CHECK (salary_day >= 1 AND salary_day <= 31),
  invite_code     TEXT UNIQUE DEFAULT generate_invite_code(),
  joint_account_id UUID,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';

-- ===========================================================================
-- TABLE: joint_accounts
-- ===========================================================================
CREATE TABLE joint_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL DEFAULT 'Ortak Hesap',
  monthly_budget  NUMERIC(12, 2) DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'TRY',
  status          joint_account_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE joint_accounts IS 'Shared account linking two partners';

-- Add FK from profiles to joint_accounts (after joint_accounts is created)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_joint_account
  FOREIGN KEY (joint_account_id) REFERENCES joint_accounts(id) ON DELETE SET NULL;

-- Get all joint account IDs for the current authenticated user
-- (Defined AFTER joint_accounts table exists)
CREATE OR REPLACE FUNCTION get_my_joint_account_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM joint_accounts
  WHERE user1_id = auth.uid() OR user2_id = auth.uid();
$$;

-- ===========================================================================
-- TABLE: categories
-- ===========================================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID REFERENCES joint_accounts(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT DEFAULT '📁',
  color           TEXT DEFAULT '#6366f1',
  type            category_type NOT NULL DEFAULT 'expense',
  is_system       BOOLEAN DEFAULT FALSE,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE categories IS 'Transaction categories (system defaults + per-account custom)';

-- ===========================================================================
-- TABLE: cards
-- ===========================================================================
CREATE TABLE cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_name       TEXT NOT NULL,
  card_type       card_type NOT NULL DEFAULT 'credit',
  last_four_digits TEXT CHECK (length(last_four_digits) = 4),
  billing_day     INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
  due_day         INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  credit_limit    NUMERIC(12, 2) DEFAULT 0,
  color           TEXT DEFAULT '#3b82f6',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE cards IS 'Payment cards and cash accounts';

-- ===========================================================================
-- TABLE: transactions
-- ===========================================================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
  card_id         UUID REFERENCES cards(id) ON DELETE SET NULL,
  entered_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            transaction_type NOT NULL DEFAULT 'expense',
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description     TEXT,
  merchant        TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source          transaction_source NOT NULL DEFAULT 'manual',
  is_recurring    BOOLEAN DEFAULT FALSE,
  is_synced       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE transactions IS 'Income and expense transactions';

-- ===========================================================================
-- TABLE: budgets
-- ===========================================================================
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month           DATE NOT NULL,  -- Always YYYY-MM-01
  limit_amount    NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT uq_budget_per_category_month UNIQUE (joint_account_id, category_id, month)
);

COMMENT ON TABLE budgets IS 'Monthly budget limits per category';

-- ===========================================================================
-- TABLE: ai_analyses
-- ===========================================================================
CREATE TABLE ai_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
  analysis_month  DATE NOT NULL,
  savings_suggestions JSONB DEFAULT '[]'::jsonb,
  projection      JSONB DEFAULT '{}'::jsonb,
  warnings        JSONB DEFAULT '[]'::jsonb,
  raw_response    JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE ai_analyses IS 'AI-generated financial analyses and suggestions';

-- ===========================================================================
-- TABLE: offline_queue
-- ===========================================================================
CREATE TABLE offline_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  table_name      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  synced_at       TIMESTAMPTZ
);

COMMENT ON TABLE offline_queue IS 'Queue for offline operations pending sync';

-- ===========================================================================
-- INDEXES
-- ===========================================================================

-- profiles
CREATE INDEX idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX idx_profiles_joint_account_id ON profiles(joint_account_id);

-- joint_accounts
CREATE INDEX idx_joint_accounts_user1 ON joint_accounts(user1_id);
CREATE INDEX idx_joint_accounts_user2 ON joint_accounts(user2_id);
CREATE INDEX idx_joint_accounts_status ON joint_accounts(status);

-- categories
CREATE INDEX idx_categories_joint_account ON categories(joint_account_id);
CREATE INDEX idx_categories_type ON categories(type);

-- cards
CREATE INDEX idx_cards_joint_account ON cards(joint_account_id);
CREATE INDEX idx_cards_owner ON cards(owner_id);

-- transactions
CREATE INDEX idx_transactions_joint_account ON transactions(joint_account_id);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_entered_by ON transactions(entered_by);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date_joint ON transactions(joint_account_id, transaction_date DESC);

-- budgets
CREATE INDEX idx_budgets_joint_account ON budgets(joint_account_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ai_analyses
CREATE INDEX idx_ai_analyses_joint_account ON ai_analyses(joint_account_id);
CREATE INDEX idx_ai_analyses_month ON ai_analyses(analysis_month);

-- offline_queue
CREATE INDEX idx_offline_queue_user ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_synced ON offline_queue(synced_at);

-- ===========================================================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE joint_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- RLS POLICIES: profiles
-- ===========================================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for trigger / signup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Partners can view limited profile info (via joint account)
CREATE POLICY "profiles_select_partner"
  ON profiles FOR SELECT
  USING (
    joint_account_id IN (SELECT get_my_joint_account_ids())
  );

-- ===========================================================================
-- RLS POLICIES: joint_accounts
-- ===========================================================================

-- Members can read their joint accounts
CREATE POLICY "joint_accounts_select_member"
  ON joint_accounts FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Creator can insert a joint account
CREATE POLICY "joint_accounts_insert_creator"
  ON joint_accounts FOR INSERT
  WITH CHECK (user1_id = auth.uid());

-- Members can update their joint account
CREATE POLICY "joint_accounts_update_member"
  ON joint_accounts FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid())
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- ===========================================================================
-- RLS POLICIES: categories
-- ===========================================================================

-- Users can read system categories (joint_account_id IS NULL) or their own
CREATE POLICY "categories_select"
  ON categories FOR SELECT
  USING (
    joint_account_id IS NULL
    OR joint_account_id IN (SELECT get_my_joint_account_ids())
  );

-- Members can insert categories for their joint account
CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  WITH CHECK (
    joint_account_id IN (SELECT get_my_joint_account_ids())
  );

-- Members can update categories for their joint account
CREATE POLICY "categories_update"
  ON categories FOR UPDATE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()))
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- Members can delete non-system categories for their joint account
CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  USING (
    joint_account_id IN (SELECT get_my_joint_account_ids())
    AND is_system = FALSE
  );

-- ===========================================================================
-- RLS POLICIES: cards
-- ===========================================================================

CREATE POLICY "cards_select"
  ON cards FOR SELECT
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "cards_insert"
  ON cards FOR INSERT
  WITH CHECK (
    joint_account_id IN (SELECT get_my_joint_account_ids())
    AND owner_id = auth.uid()
  );

CREATE POLICY "cards_update"
  ON cards FOR UPDATE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()))
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "cards_delete"
  ON cards FOR DELETE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- ===========================================================================
-- RLS POLICIES: transactions
-- ===========================================================================

CREATE POLICY "transactions_select"
  ON transactions FOR SELECT
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- INSERT requires entered_by = auth.uid()
CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT
  WITH CHECK (
    joint_account_id IN (SELECT get_my_joint_account_ids())
    AND entered_by = auth.uid()
  );

CREATE POLICY "transactions_update"
  ON transactions FOR UPDATE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()))
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "transactions_delete"
  ON transactions FOR DELETE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- ===========================================================================
-- RLS POLICIES: budgets
-- ===========================================================================

CREATE POLICY "budgets_select"
  ON budgets FOR SELECT
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "budgets_insert"
  ON budgets FOR INSERT
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "budgets_update"
  ON budgets FOR UPDATE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()))
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "budgets_delete"
  ON budgets FOR DELETE
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- ===========================================================================
-- RLS POLICIES: ai_analyses
-- ===========================================================================

CREATE POLICY "ai_analyses_select"
  ON ai_analyses FOR SELECT
  USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

CREATE POLICY "ai_analyses_insert"
  ON ai_analyses FOR INSERT
  WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- ===========================================================================
-- RLS POLICIES: offline_queue
-- ===========================================================================

CREATE POLICY "offline_queue_select_own"
  ON offline_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "offline_queue_insert_own"
  ON offline_queue FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "offline_queue_update_own"
  ON offline_queue FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "offline_queue_delete_own"
  ON offline_queue FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================================================
-- TRIGGERS
-- ===========================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_joint_accounts_updated_at
  BEFORE UPDATE ON joint_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create default categories when a joint account is created
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO categories (joint_account_id, name, icon, color, type, is_system, sort_order) VALUES
    (NEW.id, 'Market',          '🛒', '#22c55e', 'expense', TRUE, 1),
    (NEW.id, 'Akaryakıt',      '⛽', '#f97316', 'expense', TRUE, 2),
    (NEW.id, 'Giyim',           '👗', '#a855f7', 'expense', TRUE, 3),
    (NEW.id, 'Restoran & Kafe', '🍽️', '#ef4444', 'expense', TRUE, 4),
    (NEW.id, 'Ulaşım',         '🚌', '#3b82f6', 'expense', TRUE, 5),
    (NEW.id, 'Faturalar',       '📄', '#eab308', 'expense', TRUE, 6),
    (NEW.id, 'Sağlık',          '🏥', '#14b8a6', 'expense', TRUE, 7),
    (NEW.id, 'Eğlence',         '🎬', '#ec4899', 'expense', TRUE, 8),
    (NEW.id, 'Eğitim',          '📚', '#6366f1', 'expense', TRUE, 9),
    (NEW.id, 'Kira',            '🏠', '#78716c', 'expense', TRUE, 10),
    (NEW.id, 'Abonelikler',     '📱', '#06b6d4', 'expense', TRUE, 11),
    (NEW.id, 'Maaş',            '💰', '#10b981', 'income',  TRUE, 12),
    (NEW.id, 'Ek Gelir',        '💵', '#84cc16', 'income',  TRUE, 13),
    (NEW.id, 'Diğer',           '📦', '#94a3b8', 'expense', TRUE, 14);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_joint_account_created
  AFTER INSERT ON joint_accounts
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- ===========================================================================
-- FUNCTION: join_partner(code TEXT)
-- Links a partner to an existing joint account via invite code
-- ===========================================================================
CREATE OR REPLACE FUNCTION join_partner(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_profile profiles%ROWTYPE;
  target_account joint_accounts%ROWTYPE;
BEGIN
  -- Find the profile with this invite code
  SELECT * INTO partner_profile
  FROM profiles
  WHERE invite_code = code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz davet kodu.');
  END IF;

  -- Cannot join your own account
  IF partner_profile.id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kendi davet kodunuzu kullanamazsınız.');
  END IF;

  -- Find the joint account where partner_profile is user1 and user2 is null
  SELECT * INTO target_account
  FROM joint_accounts
  WHERE user1_id = partner_profile.id
    AND user2_id IS NULL
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aktif bir ortak hesap bulunamadı veya zaten bir partner mevcut.');
  END IF;

  -- Check if current user already has a joint account
  IF EXISTS (
    SELECT 1 FROM joint_accounts
    WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
      AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zaten aktif bir ortak hesabınız var.');
  END IF;

  -- Link the partner
  UPDATE joint_accounts
  SET user2_id = auth.uid(),
      status = 'active',
      updated_at = now()
  WHERE id = target_account.id;

  -- Update both profiles to reference the joint account
  UPDATE profiles
  SET joint_account_id = target_account.id, updated_at = now()
  WHERE id = auth.uid();

  UPDATE profiles
  SET joint_account_id = target_account.id, updated_at = now()
  WHERE id = partner_profile.id;

  RETURN jsonb_build_object(
    'success', true,
    'joint_account_id', target_account.id,
    'partner_name', partner_profile.full_name
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_partner(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_joint_account_ids() TO authenticated;

-- ===========================================================================
-- STORAGE BUCKET FOR PDFs (run in Supabase Dashboard > Storage)
-- ===========================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('pdf-statements', 'pdf-statements', false);
--
-- CREATE POLICY "Users can upload their own PDFs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'pdf-statements'
--     AND auth.role() = 'authenticated'
--   );
--
-- CREATE POLICY "Users can read their own PDFs"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'pdf-statements'
--     AND auth.role() = 'authenticated'
--   );
