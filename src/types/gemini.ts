/**
 * DuoBudget - Gemini AI Tip Tanımlamaları
 * Yapay zeka analiz sonuçları için interface tanımları.
 */

// ─── Ayrıştırılmış İşlem ─────────────────────────────────────────

/** PDF veya metin ayrıştırma sonucunda elde edilen işlem */
export interface ParsedTransaction {
  /** İşlem tarihi (YYYY-MM-DD formatı) */
  date: string;
  /** İşlem açıklaması */
  description: string;
  /** İşlem tutarı (pozitif sayı) */
  amount: number;
  /** İşlem türü */
  type: 'income' | 'expense';
  /** Önerilen kategori adı */
  suggestedCategory: string;
  /** Kategori eşleşme güven skoru (0-1 arası) */
  categoryConfidence: number;
  /** Orijinal ayrıştırılmamış metin satırı */
  rawLine: string;
}

// ─── Ekstre Analizi ───────────────────────────────────────────────

/** Banka ekstresi analiz sonucu */
export interface StatementAnalysis {
  /** Başarılı mı? */
  success: boolean;
  /** Hata mesajı (başarısızsa) */
  errorMessage: string | null;
  /** Ayrıştırılan işlem listesi */
  transactions: ParsedTransaction[];
  /** Analiz edilen dönem */
  period: StatementPeriod;
  /** Özet bilgiler */
  summary: StatementSummary;
  /** Ham veri kalite skoru (0-1 arası) */
  dataQualityScore: number;
  /** Ayrıştırılamayan satır sayısı */
  unparsedLineCount: number;
}

/** Ekstre dönemi */
export interface StatementPeriod {
  startDate: string;
  endDate: string;
  bankName: string | null;
  accountType: string | null;
}

/** Ekstre özet bilgileri */
export interface StatementSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  averageTransactionAmount: number;
}

// ─── Finansal Projeksiyon ─────────────────────────────────────────

/** AI tarafından oluşturulan finansal projeksiyon */
export interface FinancialProjection {
  /** Başarılı mı? */
  success: boolean;
  /** Hata mesajı */
  errorMessage: string | null;
  /** Tasarruf önerileri */
  savingSuggestions: SavingSuggestion[];
  /** Harcama uyarıları */
  spendingWarnings: SpendingWarning[];
  /** Aylık projeksiyon */
  monthlyProjection: MonthlyProjection;
  /** Genel finansal sağlık skoru (0-100) */
  healthScore: number;
  /** AI'ın genel değerlendirmesi (Türkçe) */
  overallAssessment: string;
  /** Analiz tarihi */
  analysisDate: string;
}

// ─── Tasarruf Önerisi ─────────────────────────────────────────────

/** AI tarafından tespit edilen tasarruf fırsatı */
export interface SavingSuggestion {
  /** Öneri ID'si */
  id: string;
  /** Kategori adı */
  category: string;
  /** Mevcut aylık harcama */
  currentSpending: number;
  /** Önerilen aylık harcama */
  suggestedSpending: number;
  /** Potansiyel tasarruf miktarı */
  potentialSaving: number;
  /** Öneri açıklaması (Türkçe) */
  suggestion: string;
  /** Öneri öncelik seviyesi */
  priority: 'low' | 'medium' | 'high';
  /** Uygulanabilirlik skoru (0-1) */
  feasibilityScore: number;
}

// ─── Harcama Uyarısı ──────────────────────────────────────────────

/** Anormal veya yüksek harcama uyarısı */
export interface SpendingWarning {
  /** Uyarı ID'si */
  id: string;
  /** Uyarı tipi */
  type: 'overspending' | 'unusual_activity' | 'budget_exceeded' | 'recurring_increase' | 'high_frequency';
  /** Uyarı ciddiyet derecesi */
  severity: 'info' | 'warning' | 'critical';
  /** İlgili kategori adı */
  category: string;
  /** Uyarı mesajı (Türkçe) */
  message: string;
  /** Detaylı açıklama (Türkçe) */
  details: string;
  /** İlgili tutar (varsa) */
  amount: number | null;
  /** Karşılaştırma tutarı (varsa) */
  comparisonAmount: number | null;
}

// ─── Aylık Projeksiyon ────────────────────────────────────────────

/** Gelecek ay tahmini */
export interface MonthlyProjection {
  /** Tahmini gelir */
  projectedIncome: number;
  /** Tahmini gider */
  projectedExpense: number;
  /** Tahmini tasarruf */
  projectedSaving: number;
  /** Tahmini güven aralığı (%) */
  confidenceRange: number;
  /** Kategori bazında tahminler */
  categoryProjections: CategoryProjection[];
}

/** Kategori bazında projeksiyon */
export interface CategoryProjection {
  /** Kategori adı */
  category: string;
  /** Tahmini harcama */
  projectedAmount: number;
  /** Geçen ay ile kıyaslama yüzde değişim */
  changePercentage: number;
  /** Trend yönü */
  trend: 'increasing' | 'decreasing' | 'stable';
}

// ─── API İstek/Yanıt Tipleri ─────────────────────────────────────

/** Gemini API istek yapısı */
export interface GeminiApiRequest {
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
}

/** Gemini içerik yapısı */
export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/** Gemini içerik parçası */
export interface GeminiPart {
  text: string;
}

/** Gemini üretim yapılandırması */
export interface GeminiGenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseMimeType: string;
}

/** Gemini API yanıt yapısı */
export interface GeminiApiResponse {
  candidates: GeminiCandidate[];
}

/** Gemini aday yanıtı */
export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
}

// ─── Hata Tipleri ─────────────────────────────────────────────────

/** AI servis hata durumları */
export interface AiServiceError {
  code: 'RATE_LIMITED' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  retryAfterMs: number | null;
}
