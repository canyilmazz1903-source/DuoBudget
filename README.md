# 💰 DuoBudget

**Çiftler için ortak bütçe yönetim uygulaması.**

DuoBudget, çiftlerin gelir ve giderlerini birlikte takip etmelerini, bütçe hedefleri belirlemelerini ve AI destekli finansal analizlerle tasarruf önerileri almalarını sağlayan bir mobil uygulamadır.

---

## ✨ Özellikler

- 👫 **Ortak Hesap** — Davet koduyla partnerinizi ekleyin, harcamaları birlikte yönetin
- 💳 **Kart Yönetimi** — Kredi kartı, banka kartı ve nakit hesaplarını takip edin
- 📊 **Bütçe Takibi** — Kategori bazlı aylık bütçe limitleri belirleyin
- 📱 **PDF Ekstre İçe Aktarma** — Banka ekstrelerinizi PDF olarak yükleyin, otomatik ayrıştırın
- 🤖 **AI Analiz** — Google Gemini ile tasarruf önerileri, harcama projeksiyonları ve uyarılar alın
- 🔄 **Offline Destek** — İnternet olmadan işlem ekleyin, bağlantı geldiğinde otomatik senkronize edin
- 🇹🇷 **Türkçe** — Tamamen Türkçe arayüz ve varsayılan kategoriler

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React Native + Expo (Managed Workflow) |
| **Navigasyon** | Expo Router (file-based routing) |
| **State** | Zustand + React Query (TanStack Query) |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions + Storage) |
| **AI** | Google Gemini API |
| **PDF İşleme** | Supabase Edge Function + unpdf |
| **CI/CD** | Codemagic |
| **Dil** | TypeScript |

---

## 🚀 Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) veya [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (Edge Functions için)
- iOS Simulator (macOS) veya Android Emulator

### 1. Repoyu Klonlayın

```bash
git clone https://github.com/your-username/DuoBudget.git
cd DuoBudget
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

```bash
cp .env.example .env
```

`.env` dosyasını açın ve Supabase ile Gemini API anahtarlarınızı girin:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Supabase Backend'i Kurun

Detaylı kurulum rehberi için: [📖 docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

Kısa özet:
1. [supabase.com](https://supabase.com) üzerinde yeni proje oluşturun
2. `supabase/schema.sql` dosyasını SQL Editor'de çalıştırın
3. API URL ve anon key'i `.env` dosyasına ekleyin
4. Edge Function'ı deploy edin: `supabase functions deploy process-pdf`

### 5. Uygulamayı Başlatın

```bash
# Expo geliştirme sunucusunu başlatın
npx expo start

# veya doğrudan platformda
npx expo start --ios       # iOS Simulator
npx expo start --android   # Android Emulator
```

---

## 📁 Proje Yapısı

```
DuoBudget/
├── app/                      # Expo Router sayfaları
│   ├── (auth)/               # Kimlik doğrulama ekranları
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/               # Ana tab navigasyonu
│   │   ├── index.tsx         # Dashboard
│   │   ├── transactions.tsx  # İşlemler
│   │   ├── budget.tsx        # Bütçe
│   │   ├── ai.tsx            # AI Analiz
│   │   └── settings.tsx      # Ayarlar
│   ├── _layout.tsx           # Root layout
│   └── +not-found.tsx
├── components/               # Yeniden kullanılabilir UI bileşenleri
│   ├── ui/                   # Temel UI (Button, Input, Card...)
│   ├── charts/               # Grafik bileşenleri
│   └── forms/                # Form bileşenleri
├── hooks/                    # Custom React hooks
├── lib/                      # Yardımcı kütüphaneler
│   ├── supabase.ts           # Supabase client
│   ├── gemini.ts             # Gemini API client
│   └── storage.ts            # AsyncStorage helpers
├── services/                 # API servisleri
│   ├── auth.service.ts
│   ├── transaction.service.ts
│   ├── budget.service.ts
│   └── pdf.service.ts
├── store/                    # Zustand state management
│   ├── auth.store.ts
│   ├── transaction.store.ts
│   └── offline.store.ts
├── types/                    # TypeScript tip tanımları
│   ├── database.types.ts     # Supabase generated types
│   └── index.ts
├── constants/                # Sabitler (renkler, tema...)
├── utils/                    # Yardımcı fonksiyonlar
├── assets/                   # Görseller, fontlar
├── supabase/                 # Supabase yapılandırması
│   ├── schema.sql            # Veritabanı şeması
│   └── functions/            # Edge Functions
│       └── process-pdf/
│           └── index.ts
├── docs/                     # Dokümantasyon
│   └── SUPABASE_SETUP.md     # Supabase kurulum rehberi
├── codemagic.yaml            # CI/CD yapılandırması
├── .env.example              # Ortam değişkenleri şablonu
├── .gitignore
├── app.json                  # Expo yapılandırması
├── tsconfig.json             # TypeScript yapılandırması
├── package.json
└── README.md
```

---

## 📜 Kullanılabilir Scriptler

| Script | Açıklama |
|--------|----------|
| `npx expo start` | Expo geliştirme sunucusunu başlatır |
| `npx expo start --ios` | iOS Simulator'da çalıştırır |
| `npx expo start --android` | Android Emulator'da çalıştırır |
| `npx tsc --noEmit` | TypeScript tip kontrolü |
| `npx eslint .` | ESLint ile kod kontrolü |
| `npm test` | Testleri çalıştırır |
| `npx expo prebuild` | Native proje dosyalarını oluşturur |
| `supabase functions deploy process-pdf` | PDF Edge Function'ı deploy eder |
| `supabase functions serve` | Edge Function'ları lokal olarak çalıştırır |

---

## ⚙️ CI/CD (Codemagic)

Proje, [Codemagic](https://codemagic.io) ile CI/CD pipeline'ı kullanır.

### Workflow'lar

| Workflow | Tetikleyici | Açıklama |
|----------|-------------|----------|
| `ios-release` | `v*` tag push | iOS build → TestFlight |
| `android-release` | `v*` tag push | Android build → Google Play Internal |
| `develop` | Pull Request | Lint + TypeCheck kontrolü |

### Codemagic Kurulumu

1. [codemagic.io](https://codemagic.io) üzerinde hesap oluşturun
2. GitHub reponuzu bağlayın
3. `codemagic.yaml` otomatik algılanacaktır
4. **Environment Variables** bölümünde aşağıdaki grupları oluşturun:

| Grup | Değişkenler |
|------|-------------|
| `supabase` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `gemini` | `EXPO_PUBLIC_GEMINI_API_KEY` |
| `app_store` | `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_PRIVATE_KEY` |
| `google_play` | `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` |
| `signing` | `CM_CERTIFICATE`, `CM_CERTIFICATE_PASSWORD`, `CM_PROVISIONING_PROFILE` |
| `notifications` | `SLACK_WEBHOOK_URL`, `BUILD_NOTIFICATION_EMAIL` |

5. iOS Code Signing için **Apple Developer** sertifika ve provisioning profile yükleyin
6. Android için **keystore** dosyasını Codemagic'e yükleyin

### Release Oluşturma

```bash
# Yeni versiyon tag'i oluşturun
git tag v1.0.0
git push origin v1.0.0
# → Codemagic otomatik olarak iOS ve Android build'lerini başlatır
```

---

## 🗄️ Supabase Yapılandırması

Detaylı kurulum rehberi: [📖 docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri (auth.users extension) |
| `joint_accounts` | Çiftlerin ortak hesapları |
| `categories` | Gelir/gider kategorileri (Türkçe varsayılanlar) |
| `cards` | Kredi kartı, banka kartı, nakit |
| `transactions` | Gelir ve gider işlemleri |
| `budgets` | Kategori bazlı aylık bütçe limitleri |
| `ai_analyses` | AI analiz sonuçları (Gemini) |
| `offline_queue` | Offline işlem kuyruğu |

### Önemli Fonksiyonlar

- `generate_invite_code()` — 8 karakterli benzersiz davet kodu oluşturur
- `join_partner(code)` — Davet koduyla partner bağlar
- `get_my_joint_account_ids()` — RLS helper, kullanıcının ortak hesap ID'lerini döner

---

## 🤝 Katkıda Bulunma

### Geliştirme Akışı

1. `main` branch'inden yeni bir feature branch oluşturun:
   ```bash
   git checkout -b feature/yeni-ozellik
   ```

2. Değişikliklerinizi yapın ve commit edin:
   ```bash
   git add .
   git commit -m "feat: yeni özellik açıklaması"
   ```

3. Pull Request oluşturun → `develop` workflow'u otomatik çalışır

### Commit Mesajı Kuralları

[Conventional Commits](https://www.conventionalcommits.org/) standardını kullanıyoruz:

| Prefix | Açıklama |
|--------|----------|
| `feat:` | Yeni özellik |
| `fix:` | Hata düzeltme |
| `docs:` | Dokümantasyon değişikliği |
| `style:` | Kod formatı (işlevsel değişiklik yok) |
| `refactor:` | Kod yeniden düzenleme |
| `test:` | Test ekleme/düzeltme |
| `chore:` | Build, CI/CD, bağımlılık güncellemesi |

### Kod Standartları

- TypeScript strict mode
- ESLint kurallarına uyum
- Tüm yeni bileşenler için TypeScript tipleri zorunlu
- PR açmadan önce `npx tsc --noEmit` ve `npx eslint .` çalıştırın

---

## 📄 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

---

## 📞 İletişim

Sorularınız için bir [GitHub Issue](https://github.com/your-username/DuoBudget/issues) açabilirsiniz.
