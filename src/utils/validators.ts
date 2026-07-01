/**
 * Simple email validation.
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return 'E-posta adresi gereklidir';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Geçerli bir e-posta adresi giriniz';
  return null;
};

/**
 * Validates password strength (min 6 characters).
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Şifre gereklidir';
  if (password.length < 6) return 'Şifre en az 6 karakter olmalıdır';
  return null;
};

/**
 * Validates invite code formatting (8 characters hex or alphanumeric).
 */
export const validateInviteCode = (code: string): string | null => {
  if (!code) return 'Davet kodu gereklidir';
  if (code.trim().length !== 8) return 'Davet kodu tam olarak 8 karakter olmalıdır';
  return null;
};

/**
 * Validates manual transaction inputs.
 */
export const validateTransaction = (tx: {
  amount: number;
  description: string;
  category_id: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!tx.amount || tx.amount <= 0) {
    errors.amount = 'Tutar sıfırdan büyük olmalıdır';
  }
  if (!tx.description || tx.description.trim().length === 0) {
    errors.description = 'Açıklama gereklidir';
  }
  if (!tx.category_id) {
    errors.category_id = 'Lütfen bir kategori seçin';
  }

  return errors;
};

/**
 * Validates card inputs.
 */
export const validateCard = (card: {
  card_name: string;
  last_four_digits?: string;
  billing_day?: number;
  due_day?: number;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!card.card_name || card.card_name.trim().length === 0) {
    errors.card_name = 'Kart adı gereklidir';
  }
  
  if (card.last_four_digits && !/^\d{4}$/.test(card.last_four_digits)) {
    errors.last_four_digits = 'Son 4 hane 4 basamaklı bir sayı olmalıdır';
  }

  if (card.billing_day !== undefined && (card.billing_day < 1 || card.billing_day > 31)) {
    errors.billing_day = 'Hesap kesim günü 1-31 arasında olmalıdır';
  }

  if (card.due_day !== undefined && (card.due_day < 1 || card.due_day > 31)) {
    errors.due_day = 'Son ödeme günü 1-31 arasında olmalıdır';
  }

  return errors;
};
