export const useCurrencyFormat = () => {
  return (amount: number, currency: string = 'USD') => {
    if (amount === null || amount === undefined || amount === 0) {
      return getCurrencySymbol(currency) + formatZero(currency);
    }
    const rounded = Math.round(amount / 100) * 100;
    switch (currency) {
      case 'KHR':
      case '៛':
      case 'REL':
        return '៛' + Number(rounded).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

      case 'JPY':
      case '¥':
        return '¥' + Number(rounded).toLocaleString('ja-JP', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

      case 'CN¥':
        return 'CN¥' + Number(amount).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

      case 'USD':
      case '$':
      default:
        return '$' + Number(amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
    }
  };
};

// Helper: Get currency symbol for zero handling
const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'KHR':
    case 'REL':
    case '៛':
      return '៛';
    case 'JPY':
    case '¥':
      return '¥';
    case 'CN¥':
      return 'CN¥';
    case 'USD':
    case '$':
    default:
      return '$';
  }
};

// Helper: Format zero value correctly
const formatZero = (currency: string): string => {
  switch (currency) {
    case 'KHR':
    case 'REL':
    case '៛':
    case 'JPY':
    case '¥':
      return '0';
    case 'CN¥':
    case 'USD':
    case '$':
    default:
      return '0.00';
  }
};
