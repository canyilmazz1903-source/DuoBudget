/**
 * Formats a numeric amount to Turkish Lira currency format (e.g. ₺1.250,00).
 */
export const formatMoney = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '₺0,00';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Formats date string to Turkish format (e.g. 30 Haziran 2026 or 30.06.2026).
 */
export const formatDate = (dateStr: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (format === 'long') {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formats date to a relative string (e.g. Bugün, Dün, 3 gün önce).
 */
export const formatRelativeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Bugün';
  } else if (diffDays === 1) {
    return 'Dün';
  } else if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} gün önce`;
  } else {
    return formatDate(dateStr, 'long');
  }
};

/**
 * Truncates string content.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
