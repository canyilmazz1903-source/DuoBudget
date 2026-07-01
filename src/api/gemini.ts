import { StatementAnalysis, FinancialProjection } from '../types/gemini';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const fetchGemini = async (prompt: string, systemInstruction?: string): Promise<any> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key bulunamadı. Lütfen .env dosyasını kontrol edin.');
  }

  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    };
  }

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API hatası: ${response.status} - ${errText}`);
  }

  const resJson = await response.json();
  const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API boş bir yanıt döndürdü.');
  }

  return JSON.parse(text);
};

export const analyzeStatement = async (rawText: string): Promise<StatementAnalysis> => {
  const systemInstruction = `Sen bir banka ekstresi analiz asistanısın. Görevin, sana verilen banka ekstresi metnindeki tüm finansal hareketleri ve işlemleri çıkarıp, bunları tam olarak belirtilen JSON şemasında döndürmektir. 
  Tüm açıklamaları, satıcıları ve analizleri Türkçe yap. Kategori önerilerini ('Market', 'Akaryakıt', 'Giyim', 'Restoran', 'Ulaşım', 'Faturalar', 'Sağlık', 'Eğlence', 'Eğitim', 'Kira', 'Abonelikler', 'Maaş', 'Ek Gelir', 'Diğer') kategorilerinden biri olacak şekilde seç.
  İşlemlerin tutarlarını pozitif sayı yap ve type alanını 'income' veya 'expense' olarak belirle.
  Yalnızca saf JSON döndür, markdown veya başka açıklama ekleme.`;

  const prompt = `Lütfen aşağıdaki banka ekstresi metnini analiz et ve işlemleri çıkar:
  
  --- EKSTRE METNİ BAŞLANGICI ---
  ${rawText}
  --- EKSTRE METNİ BİTİŞİ ---

  Lütfen aşağıdaki TypeScript şemasına uygun bir JSON objesi döndür:
  {
    "success": true,
    "errorMessage": null,
    "transactions": [
      {
        "date": "YYYY-MM-DD formatında işlem tarihi",
        "description": "İşlem açıklaması",
        "amount": 125.50 (sayısal tutar),
        "type": "income" veya "expense",
        "suggestedCategory": "Önerilen kategori adı",
        "categoryConfidence": 0.0 ile 1.0 arası güven skoru,
        "rawLine": "İşlemin alındığı ham metin satırı"
      }
    ],
    "period": {
      "startDate": "YYYY-MM-DD formatında ekstre başlangıç tarihi",
      "endDate": "YYYY-MM-DD formatında ekstre bitiş tarihi",
      "bankName": "Bankanın adı (varsa, yoksa null)",
      "accountType": "Hesap/Kart türü (kredi kartı, vadesiz vb., yoksa null)"
    },
    "summary": {
      "totalIncome": Toplam gelir tutarı,
      "totalExpense": Toplam gider tutarı,
      "netBalance": Net bakiye (gelir - gider),
      "transactionCount": Toplam işlem sayısı,
      "averageTransactionAmount": Ortalama işlem tutarı
    },
    "dataQualityScore": 0.0 ile 1.0 arası veri okunabilirlik skoru,
    "unparsedLineCount": Ayrıştırılamayan satır sayısı
  }`;

  try {
    const data = await fetchGemini(prompt, systemInstruction);
    return {
      success: true,
      errorMessage: null,
      transactions: data.transactions || [],
      period: data.period || { startDate: '', endDate: '', bankName: null, accountType: null },
      summary: data.summary || { totalIncome: 0, totalExpense: 0, netBalance: 0, transactionCount: 0, averageTransactionAmount: 0 },
      dataQualityScore: data.dataQualityScore ?? 1.0,
      unparsedLineCount: data.unparsedLineCount ?? 0,
    };
  } catch (error: any) {
    console.error('analyzeStatement Error:', error);
    return {
      success: false,
      errorMessage: error.message || 'Ekstre analizi sırasında bilinmeyen bir hata oluştu.',
      transactions: [],
      period: { startDate: '', endDate: '', bankName: null, accountType: null },
      summary: { totalIncome: 0, totalExpense: 0, netBalance: 0, transactionCount: 0, averageTransactionAmount: 0 },
      dataQualityScore: 0,
      unparsedLineCount: 0,
    };
  }
};

export const getFinancialProjection = async (
  transactions: any[],
  budgets: any[] = []
): Promise<FinancialProjection> => {
  const systemInstruction = `Sen çiftlerin finansal danışmanlığını yapan bir yapay zekasın. Çiftlerin harcama alışkanlıklarını analiz edip, bütçe aşım durumlarını inceleyerek Türkçe dilinde tasarruf önerileri, harcama uyarıları ve gelecek ay projeksiyonu oluşturmalısın.
  Yalnızca saf JSON döndür, markdown veya başka açıklama ekleme.`;

  const txData = transactions.map((t) => ({
    date: t.transaction_date,
    amount: t.amount,
    type: t.type,
    category: t.categories?.name || t.category_id,
    description: t.description,
    merchant: t.merchant,
  }));

  const budgetData = budgets.map((b) => ({
    category: b.categories?.name,
    limit: b.limit_amount,
  }));

  const prompt = `Aşağıdaki finansal verileri incele:
  Son İşlemler:
  ${JSON.stringify(txData)}

  Kategori Limitleri:
  ${JSON.stringify(budgetData)}

  Lütfen bu verilere göre aşağıdaki TypeScript şemasına uygun bir JSON objesi döndür:
  {
    "success": true,
    "errorMessage": null,
    "savingSuggestions": [
      {
        "id": "benzersiz bir id",
        "category": "Kategori adı",
        "currentSpending": Mevcut aylık harcama tutarı,
        "suggestedSpending": Önerilen harcama sınırı,
        "potentialSaving": Tasarruf edilebilecek miktar,
        "suggestion": "Tasarruf için detaylı Türkçe açıklama ve aksiyon planı"
      }
    ],
    "spendingWarnings": [
      {
        "id": "benzersiz bir id",
        "category": "Kategori adı",
        "severity": "low" | "medium" | "high",
        "warning": "Harcama artışı veya limit aşımı ile ilgili detaylı Türkçe uyarı mesajı",
        "amountExceeded": Aşılan veya aşılması beklenen tutar
      }
    ],
    "monthlyProjection": {
      "expectedIncome": Gelecek ay beklenen gelir tutarı,
      "expectedExpense": Gelecek ay beklenen gider tutarı,
      "predictedSavings": Beklenen tasarruf tutarı,
      "confidenceScore": 0 ile 100 arası projeksiyon güven skoru,
      "reasoning": "Gelecek aya dair harcama tahminlerinin gerekçesi (Türkçe)"
    },
    "healthScore": 0 ile 100 arası çift finansal sağlık puanı,
    "overallAssessment": "Çiftlerin genel harcama ve bütçe durumuna dair detaylı finansal koçluk değerlendirmesi (Türkçe)",
    "analysisDate": "Analiz tarihi (YYYY-MM-DD)"
  }`;

  try {
    const data = await fetchGemini(prompt, systemInstruction);
    return {
      success: true,
      errorMessage: null,
      savingSuggestions: data.savingSuggestions || [],
      spendingWarnings: data.spendingWarnings || [],
      monthlyProjection: data.monthlyProjection || { expectedIncome: 0, expectedExpense: 0, predictedSavings: 0, confidenceScore: 0, reasoning: '' },
      healthScore: data.healthScore ?? 50,
      overallAssessment: data.overallAssessment || '',
      analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
    };
  } catch (error: any) {
    console.error('getFinancialProjection Error:', error);
    return {
      success: false,
      errorMessage: error.message || 'Finansal projeksiyon üretilirken bir hata oluştu.',
      savingSuggestions: [],
      spendingWarnings: [],
      monthlyProjection: {
        projectedIncome: 0,
        projectedExpense: 0,
        projectedSaving: 0,
        confidenceRange: 0,
        categoryProjections: [],
      },
      healthScore: 0,
      overallAssessment: 'Projeksiyon yüklenirken bir hata oluştu.',
      analysisDate: new Date().toISOString().split('T')[0],
    };
  }
};
