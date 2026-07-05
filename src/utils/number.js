export function parseDecimal(value) {
  if (typeof value !== 'string') return Number(value);
  return Number(value.trim().replace(',', '.'));
}
