export function sanitizePersonName(value) {
  return value
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

export function sanitizeProvince(value) {
  return value
    .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 60);
}

export function sanitizePhone(value) {
  const cleaned = value
    .replace(/[^\d+\s()-]/g, '')
    .replace(/(?!^)\+/g, '')
    .replace(/\s{2,}/g, ' ');

  return cleaned.slice(0, 24);
}

export function sanitizeAddress(value) {
  return value.replace(/\s{2,}/g, ' ').slice(0, 140);
}

export function sanitizeNotes(value) {
  return value.slice(0, 300);
}

export function getPhoneDigits(value) {
  return value.replace(/\D/g, '');
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
