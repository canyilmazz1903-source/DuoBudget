# 🗄️ DuoBudget - Supabase Kurulum Rehberi

Bu rehber, DuoBudget uygulamasının backend'ini Supabase üzerinde adım adım kurmanızı sağlar.

---

## 📋 İçindekiler

1. [Supabase Projesi Oluşturma](#1-supabase-projesi-oluşturma)
2. [Veritabanı Şemasını Çalıştırma](#2-veritabanı-şemasını-çalıştırma)
3. [Row Level Security (RLS) Kontrolü](#3-row-level-security-rls-kontrolü)
4. [API Anahtarlarını Alma](#4-api-anahtarlarını-alma)
5. [Authentication Ayarları](#5-authentication-ayarları)
6. [Storage Bucket Oluşturma](#6-storage-bucket-oluşturma)
7. [Edge Functions Kurulumu](#7-edge-functions-kurulumu)
8. [Edge Function Deploy Etme](#8-edge-function-deploy-etme)
9. [Test ve Doğrulama](#9-test-ve-doğrulama)

---

## 1. Supabase Projesi Oluşturma

### Adım 1: Hesap Oluşturma
1. [supabase.com](https://supabase.com) adresine gidin
2. **"Start your project"** butonuna tıklayın
3. GitHub hesabınızla giriş yapın

<!-- 📸 Ekran Görüntüsü: Supabase ana sayfası - "Start your project" butonu -->

### Adım 2: Yeni Proje Oluşturma
1. **Organization** seçin veya yeni bir organizasyon oluşturun
2. Aşağıdaki bilgileri doldurun:

| Alan | Değer |
|------|-------|
| **Project Name** | `DuoBudget` |
| **Database Password** | Güçlü bir şifre (not alın!) |
| **Region** | `Central EU (Frankfurt)` — Türkiye'ye en yakın |
| **Pricing Plan** | Free tier yeterli başlangıç için |

3. **"Create new project"** butonuna tıklayın
4. Projenin oluşturulmasını bekleyin (1-2 dakika)

<!-- 📸 Ekran Görüntüsü: "New Project" formu doldurulmuş hali -->

> [!IMPORTANT]
> Database Password'ü güvenli bir yere kaydedin. Daha sonra bu şifreye ihtiyacınız olacak.

---

## 2. Veritabanı Şemasını Çalıştırma

### Adım 1: SQL Editor'ü Açma
1. Sol menüden **"SQL Editor"** seçeneğine tıklayın
2. **"New query"** butonuna tıklayın

<!-- 📸 Ekran Görüntüsü: SQL Editor arayüzü -->

### Adım 2: Şemayı Kopyalama ve Çalıştırma

Aşağıdaki SQL kodunun tamamını kopyalayıp SQL Editor'e yapıştırın ve **"Run"** butonuna tıklayın.

> [!TIP]
> SQL dosyasını projenin `supabase/schema.sql` dosyasında da bulabilirsiniz.

<details>
<summary>📄 Tam SQL Şemasını Göster (Tıklayın)</summary>

```sql
-- =============================================================================
-- DuoBudget - Supabase SQL Schema
-- =============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CUSTOM TYPES
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE card_type AS ENUM ('credit', 'debit', 'cash');
CREATE TYPE transaction_source AS ENUM ('manual', 'pdf_import');
CREATE TYPE joint_account_status AS ENUM ('pending', 'active', 'dissolved');
CREATE TYPE category_type AS ENUM ('income', 'expense');

-- HELPER FUNCTIONS

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

-- TABLE: profiles
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

-- TABLE: joint_accounts
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

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_joint_account
  FOREIGN KEY (joint_account_id) REFERENCES joint_accounts(id) ON DELETE SET NULL;

-- TABLE: categories
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

-- TABLE: cards
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

-- TABLE: transactions
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

-- TABLE: budgets
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joint_account_id UUID NOT NULL REFERENCES joint_accounts(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month           DATE NOT NULL,
  limit_amount    NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_budget_per_category_month UNIQUE (joint_account_id, category_id, month)
);

-- TABLE: ai_analyses
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

-- TABLE: offline_queue
CREATE TABLE offline_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  table_name      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  synced_at       TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX idx_profiles_joint_account_id ON profiles(joint_account_id);
CREATE INDEX idx_joint_accounts_user1 ON joint_accounts(user1_id);
CREATE INDEX idx_joint_accounts_user2 ON joint_accounts(user2_id);
CREATE INDEX idx_joint_accounts_status ON joint_accounts(status);
CREATE INDEX idx_categories_joint_account ON categories(joint_account_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_cards_joint_account ON cards(joint_account_id);
CREATE INDEX idx_cards_owner ON cards(owner_id);
CREATE INDEX idx_transactions_joint_account ON transactions(joint_account_id);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_entered_by ON transactions(entered_by);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date_joint ON transactions(joint_account_id, transaction_date DESC);
CREATE INDEX idx_budgets_joint_account ON budgets(joint_account_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_month ON budgets(month);
CREATE INDEX idx_ai_analyses_joint_account ON ai_analyses(joint_account_id);
CREATE INDEX idx_ai_analyses_month ON ai_analyses(analysis_month);
CREATE INDEX idx_offline_queue_user ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_synced ON offline_queue(synced_at);

-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE joint_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_select_partner" ON profiles FOR SELECT USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- RLS POLICIES: joint_accounts
CREATE POLICY "joint_accounts_select_member" ON joint_accounts FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "joint_accounts_insert_creator" ON joint_accounts FOR INSERT WITH CHECK (user1_id = auth.uid());
CREATE POLICY "joint_accounts_update_member" ON joint_accounts FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid()) WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS POLICIES: categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (joint_account_id IS NULL OR joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (joint_account_id IN (SELECT get_my_joint_account_ids())) WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (joint_account_id IN (SELECT get_my_joint_account_ids()) AND is_system = FALSE);

-- RLS POLICIES: cards
CREATE POLICY "cards_select" ON cards FOR SELECT USING (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "cards_insert" ON cards FOR INSERT WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()) AND owner_id = auth.uid());
CREATE POLICY "cards_update" ON cards FOR UPDATE USING (joint_account_id IN (SELECT get_my_joint_account_ids())) WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "cards_delete" ON cards FOR DELETE USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- RLS POLICIES: transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()) AND entered_by = auth.uid());
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (joint_account_id IN (SELECT get_my_joint_account_ids())) WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- RLS POLICIES: budgets
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (joint_account_id IN (SELECT get_my_joint_account_ids())) WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- RLS POLICIES: ai_analyses
CREATE POLICY "ai_analyses_select" ON ai_analyses FOR SELECT USING (joint_account_id IN (SELECT get_my_joint_account_ids()));
CREATE POLICY "ai_analyses_insert" ON ai_analyses FOR INSERT WITH CHECK (joint_account_id IN (SELECT get_my_joint_account_ids()));

-- RLS POLICIES: offline_queue
CREATE POLICY "offline_queue_select_own" ON offline_queue FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "offline_queue_insert_own" ON offline_queue FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "offline_queue_update_own" ON offline_queue FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "offline_queue_delete_own" ON offline_queue FOR DELETE USING (user_id = auth.uid());

-- TRIGGERS: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_joint_accounts_updated_at BEFORE UPDATE ON joint_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- TRIGGER: Auto-create default categories
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO categories (joint_account_id, name, icon, color, type, is_system, sort_order) VALUES
    (NEW.id, 'Market', '🛒', '#22c55e', 'expense', TRUE, 1),
    (NEW.id, 'Akaryakıt', '⛽', '#f97316', 'expense', TRUE, 2),
    (NEW.id, 'Giyim', '👗', '#a855f7', 'expense', TRUE, 3),
    (NEW.id, 'Restoran & Kafe', '🍽️', '#ef4444', 'expense', TRUE, 4),
    (NEW.id, 'Ulaşım', '🚌', '#3b82f6', 'expense', TRUE, 5),
    (NEW.id, 'Faturalar', '📄', '#eab308', 'expense', TRUE, 6),
    (NEW.id, 'Sağlık', '🏥', '#14b8a6', 'expense', TRUE, 7),
    (NEW.id, 'Eğlence', '🎬', '#ec4899', 'expense', TRUE, 8),
    (NEW.id, 'Eğitim', '📚', '#6366f1', 'expense', TRUE, 9),
    (NEW.id, 'Kira', '🏠', '#78716c', 'expense', TRUE, 10),
    (NEW.id, 'Abonelikler', '📱', '#06b6d4', 'expense', TRUE, 11),
    (NEW.id, 'Maaş', '💰', '#10b981', 'income', TRUE, 12),
    (NEW.id, 'Ek Gelir', '💵', '#84cc16', 'income', TRUE, 13),
    (NEW.id, 'Diğer', '📦', '#94a3b8', 'expense', TRUE, 14);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_joint_account_created AFTER INSERT ON joint_accounts FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- FUNCTION: join_partner
CREATE OR REPLACE FUNCTION join_partner(code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  partner_profile profiles%ROWTYPE;
  target_account joint_accounts%ROWTYPE;
BEGIN
  SELECT * INTO partner_profile FROM profiles WHERE invite_code = code;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Geçersiz davet kodu.'); END IF;
  IF partner_profile.id = auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'Kendi davet kodunuzu kullanamazsınız.'); END IF;
  SELECT * INTO target_account FROM joint_accounts WHERE user1_id = partner_profile.id AND user2_id IS NULL AND status = 'pending';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Aktif bir ortak hesap bulunamadı.'); END IF;
  IF EXISTS (SELECT 1 FROM joint_accounts WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zaten aktif bir ortak hesabınız var.');
  END IF;
  UPDATE joint_accounts SET user2_id = auth.uid(), status = 'active', updated_at = now() WHERE id = target_account.id;
  UPDATE profiles SET joint_account_id = target_account.id, updated_at = now() WHERE id = auth.uid();
  UPDATE profiles SET joint_account_id = target_account.id, updated_at = now() WHERE id = partner_profile.id;
  RETURN jsonb_build_object('success', true, 'joint_account_id', target_account.id, 'partner_name', partner_profile.full_name);
END; $$;

GRANT EXECUTE ON FUNCTION join_partner(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_joint_account_ids() TO authenticated;
```

</details>

### Adım 3: Sonuçları Doğrulama
1. Sol menüden **"Table Editor"** seçeneğine gidin
2. Aşağıdaki tabloların oluşturulduğunu doğrulayın:

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri |
| `joint_accounts` | Ortak hesaplar |
| `categories` | Gelir/gider kategorileri |
| `cards` | Kredi/banka kartları |
| `transactions` | İşlemler |
| `budgets` | Aylık bütçe limitleri |
| `ai_analyses` | AI analiz sonuçları |
| `offline_queue` | Offline senkronizasyon kuyruğu |

<!-- 📸 Ekran Görüntüsü: Table Editor'de tüm tablolar listeleniyor -->

> [!NOTE]
> SQL çalıştırıldıktan sonra tüm tablolar, indexler, RLS politikaları, triggerlar ve fonksiyonlar otomatik olarak oluşturulur.

---

## 3. Row Level Security (RLS) Kontrolü

SQL şeması RLS politikalarını otomatik olarak oluşturur. Kontrol etmek için:

1. Sol menüden **"Authentication"** → **"Policies"** seçeneğine gidin
2. Her tablonun yanında **"RLS enabled"** yazdığını doğrulayın
3. Her tablo için politikaların listelendiğini kontrol edin

<!-- 📸 Ekran Görüntüsü: Authentication > Policies sayfası, RLS enabled gösteriliyor -->

### RLS Politika Özeti

| Tablo | Politikalar |
|-------|-------------|
| `profiles` | Kendi profilini okuma/güncelleme + partner sınırlı görüntüleme |
| `joint_accounts` | Üye okuma/güncelleme, oluşturucu ekleme |
| `categories` | Sistem varsayılanları + üye erişimi |
| `cards` | Üye erişimi, sahip ekleme |
| `transactions` | Üye erişimi, `entered_by = auth.uid()` zorunlu |
| `budgets` | Üye erişimi |
| `ai_analyses` | Üye okuma/ekleme |
| `offline_queue` | Sadece kendi kayıtları |

> [!WARNING]
> RLS'yi hiçbir tabloda devre dışı bırakmayın! Bu, kullanıcıların birbirlerinin verilerini görmesine neden olur.

---

## 4. API Anahtarlarını Alma

1. Sol menüden **"Project Settings"** (⚙️ dişli ikonu) seçeneğine tıklayın
2. **"API"** sekmesine gidin
3. Aşağıdaki değerleri kopyalayın:

| Alan | Nerede Kullanılıyor | Açıklama |
|------|---------------------|----------|
| **Project URL** | `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` formatında |
| **anon (public) key** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | RLS ile korunan public anahtar |

<!-- 📸 Ekran Görüntüsü: Project Settings > API sayfası, URL ve anon key gösteriliyor -->

4. Projenin kök dizinindeki `.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

5. `.env` dosyasını açın ve değerleri yapıştırın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

> [!CAUTION]
> `.env` dosyasını asla git'e commit etmeyin! `.gitignore` dosyasında zaten hariç tutulmuştur.

---

## 5. Authentication Ayarları

### Email/Password Kimlik Doğrulama

1. Sol menüden **"Authentication"** → **"Providers"** seçeneğine gidin
2. **"Email"** provider'ın etkin olduğunu doğrulayın (varsayılan olarak etkindir)
3. Aşağıdaki ayarları yapılandırın:

| Ayar | Değer | Açıklama |
|------|-------|----------|
| **Enable Email Signup** | ✅ Etkin | Kullanıcıların kayıt olmasına izin ver |
| **Confirm Email** | ✅ Etkin | E-posta doğrulaması zorunlu |
| **Secure Email Change** | ✅ Etkin | E-posta değişikliği için doğrulama |
| **Double Confirm Email Changes** | ❌ Devre dışı | Opsiyonel |

<!-- 📸 Ekran Görüntüsü: Authentication > Providers > Email ayarları -->

### Email Şablonlarını Özelleştirme (Opsiyonel)

1. **"Authentication"** → **"Email Templates"** sekmesine gidin
2. **Confirm Signup** şablonunu Türkçe olarak düzenleyin:

```html
<h2>DuoBudget'a Hoş Geldiniz!</h2>
<p>Hesabınızı doğrulamak için aşağıdaki linke tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Hesabımı Doğrula</a></p>
```

### Site URL Ayarı

1. **"Authentication"** → **"URL Configuration"** seçeneğine gidin
2. **Site URL** alanına uygulamanızın deep link URL'ini girin:
   - Geliştirme: `exp://localhost:8081`
   - Prodüksiyon: `duobudget://` (custom scheme)

---

## 6. Storage Bucket Oluşturma

PDF ekstreleri için bir Storage bucket oluşturun:

### Adım 1: Bucket Oluşturma
1. Sol menüden **"Storage"** seçeneğine gidin
2. **"New bucket"** butonuna tıklayın
3. Ayarları yapılandırın:

| Alan | Değer |
|------|-------|
| **Name** | `pdf-statements` |
| **Public bucket** | ❌ Hayır (özel) |
| **Allowed MIME types** | `application/pdf` |
| **File size limit** | `10MB` |

<!-- 📸 Ekran Görüntüsü: Storage > New Bucket formu -->

### Adım 2: Storage Politikaları
1. Oluşturulan bucket'a tıklayın
2. **"Policies"** sekmesine gidin
3. Aşağıdaki politikaları ekleyin:

**Upload politikası (INSERT):**
```sql
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-statements'
    AND auth.role() = 'authenticated'
  );
```

**Okuma politikası (SELECT):**
```sql
CREATE POLICY "Users can read their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdf-statements'
    AND auth.role() = 'authenticated'
  );
```

> [!TIP]
> Bu politikaları SQL Editor'de de çalıştırabilirsiniz.

---

## 7. Edge Functions Kurulumu

### Gereksinimler

- [Supabase CLI](https://supabase.com/docs/guides/cli) yüklü olmalı
- [Deno](https://deno.land/) yüklü olmalı (CLI otomatik yükler)

### Adım 1: Supabase CLI Kurulumu

```bash
# npm ile
npm install -g supabase

# veya Homebrew ile (macOS)
brew install supabase/tap/supabase
```

### Adım 2: Giriş Yapma

```bash
supabase login
```

Tarayıcınızda açılan sayfada Supabase hesabınızla giriş yapın.

### Adım 3: Projeyi Bağlama

```bash
# Proje dizininde
supabase init   # Eğer henüz init edilmediyse
supabase link --project-ref YOUR_PROJECT_REF
```

> [!NOTE]
> `YOUR_PROJECT_REF` değerini Supabase Dashboard'daki **Project Settings** > **General** sayfasından bulabilirsiniz.

---

## 8. Edge Function Deploy Etme

### PDF İşleme Fonksiyonunu Deploy Etme

```bash
# Proje kök dizininde
supabase functions deploy process-pdf --no-verify-jwt
```

> [!IMPORTANT]
> `--no-verify-jwt` flag'ini kullanıyoruz çünkü JWT doğrulamasını fonksiyon içinde kendimiz yapıyoruz. Bu, daha ayrıntılı hata mesajları vermemizi sağlar.

### Test Etme

```bash
# Fonksiyonu test edin
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-pdf' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"pdf_base64": "JVBERi0xLjQK..."}'
```

### Logları İzleme

```bash
supabase functions logs process-pdf --tail
```

---

## 9. Test ve Doğrulama

### Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] SQL şeması başarıyla çalıştırıldı
- [ ] 8 tablo oluşturuldu (Table Editor'de görünüyor)
- [ ] RLS tüm tablolarda etkin
- [ ] API URL ve anon key `.env` dosyasına eklendi
- [ ] Email authentication yapılandırıldı
- [ ] `pdf-statements` Storage bucket'ı oluşturuldu
- [ ] Storage politikaları eklendi
- [ ] Supabase CLI kuruldu ve giriş yapıldı
- [ ] `process-pdf` Edge Function deploy edildi
- [ ] Edge Function test edildi

### Hızlı Test: Kullanıcı Kaydı

Supabase Dashboard'dan test kullanıcısı oluşturun:

1. **"Authentication"** → **"Users"** sekmesine gidin
2. **"Add user"** → **"Create new user"** seçeneğine tıklayın
3. E-posta ve şifre girin
4. **"Table Editor"** → **"profiles"** tablosunu kontrol edin
5. Yeni kullanıcı için otomatik profil oluşturulduğunu doğrulayın

<!-- 📸 Ekran Görüntüsü: Authentication > Users - yeni kullanıcı oluşturulmuş -->

> [!TIP]
> Otomatik profil oluşturma çalışıyorsa, `handle_new_user()` trigger'ı doğru şekilde kurulmuş demektir. 🎉

---

## 🆘 Sorun Giderme

### Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|------|-------|
| `permission denied for schema public` | SQL Editor'de `GRANT` ifadelerini tekrar çalıştırın |
| `relation "auth.users" does not exist` | SQL'i Supabase Dashboard SQL Editor'de çalıştırdığınızdan emin olun (yerel değil) |
| `duplicate key value violates unique constraint` | Tabloları zaten oluşturmuşsunuzdur, önce `DROP TABLE` ile silin |
| RLS politikası çalışmıyor | `get_my_joint_account_ids()` fonksiyonunun `SECURITY DEFINER` olduğunu doğrulayın |
| Edge Function 401 hatası | Authorization header'ında geçerli bir Bearer token gönderin |

### Yardım Kaynakları

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub](https://github.com/supabase/supabase)
