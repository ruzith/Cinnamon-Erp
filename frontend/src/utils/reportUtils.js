import { formatCurrencyStatic } from './currencyUtils';

export const generateReport = (data) => {
  return {
    ...data,
    formattedTotal: formatCurrencyStatic(data.total)
  };
}; 