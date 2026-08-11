export const formatNaira = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0.00';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('NGN', '₦');
};
