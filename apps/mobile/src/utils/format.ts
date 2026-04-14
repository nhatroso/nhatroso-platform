export const formatCurrency = (
  amount: string | number | null | undefined,
): string => {
  if (amount === null || amount === undefined) return '0 ₫';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '--/--/----';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};
