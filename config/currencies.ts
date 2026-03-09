export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
] as const;

export type SupportedCurrencyCode = (typeof currencies)[number]['code'];

export function normalizeCurrencyCode(currency: string | null | undefined): SupportedCurrencyCode {
  const normalizedCurrency = currency?.toUpperCase();
  return currencies.some((option) => option.code === normalizedCurrency)
    ? (normalizedCurrency as SupportedCurrencyCode)
    : 'USD';
}

export function languageToLocale(language: string | null | undefined) {
  switch (language?.toLowerCase()) {
    case 'es':
      return 'es-ES';
    case 'ua':
      return 'uk-UA';
    default:
      return 'en-US';
  }
}

export function formatCurrencyAmount(
  amount: number,
  currency: string | null | undefined,
  language: string | null | undefined,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(languageToLocale(language), {
    style: 'currency',
    currency: normalizeCurrencyCode(currency),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}
