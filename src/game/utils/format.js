const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

export const integer = (value) => number.format(value || 0);
export const money = (value, compact = false) => {
  const absolute = Math.abs(value || 0);
  const amount = compact && absolute >= 1000000 ? `${(absolute / 1000000).toFixed(2)}m` : compact && absolute >= 10000 ? `${(absolute / 1000).toFixed(0)}k` : number.format(absolute);
  return `${value < 0 ? '−' : ''}€${amount}`;
};
export const percent = (value) => `${Math.round((value || 0) * 100)}%`;
export const asset = (path) => `${import.meta.env?.BASE_URL || '/'}assets/${path}`;
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const gameDate = (day) => {
  const date = new Date(Date.UTC(2026, 9, 26 + day));
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
};
