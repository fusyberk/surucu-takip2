export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function getDaysUntilExam(examDateISO: string, fromISO: string = getTodayISO()): number | null {
  if (!examDateISO) return null;
  const [ey, em, ed] = examDateISO.split('-').map(Number);
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  if (!ey || !em || !ed || !fy || !fm || !fd) return null;
  const examUTC = Date.UTC(ey, em - 1, ed);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  return Math.round((examUTC - fromUTC) / (1000 * 60 * 60 * 24));
}

export function formatExamCountdown(days: number | null): string {
  if (days === null) return 'Belirlenmedi';
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days > 1) return `${days} gün kaldı`;
  if (days === -1) return 'Dün';
  return `${Math.abs(days)} gün önce`;
}

const TURKISH_MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

const TURKISH_MONTHS_LONG = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const TURKISH_WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TURKISH_WEEKDAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function formatTurkishDate(isoDate: string, style: 'short' | 'long' | 'full' = 'short'): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  const monthIdx = Math.max(0, Math.min(11, m - 1));
  const weekdayIdx = dateObj.getDay();

  if (style === 'full') {
    return `${d} ${TURKISH_MONTHS_LONG[monthIdx]} ${y}, ${TURKISH_WEEKDAYS_LONG[weekdayIdx]}`;
  }
  if (style === 'long') {
    return `${d} ${TURKISH_MONTHS_LONG[monthIdx]} ${y}`;
  }
  return `${d} ${TURKISH_MONTHS_SHORT[monthIdx]} ${y}`;
}

export function getWeekdayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  return TURKISH_WEEKDAYS_SHORT[dateObj.getDay()] ?? '';
}

export function getWeekdayLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  return TURKISH_WEEKDAYS_LONG[dateObj.getDay()] ?? '';
}

export function getMondayOfWeekISO(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const day = dateObj.getDay(); // 0 = Pazar, 1 = Pazartesi ... 6 = Cumartesi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDaysISO(isoDate, diffToMonday);
}

export function getDayNumber(isoDate: string): string {
  const parts = isoDate.split('-');
  return String(Number(parts[2] || '1'));
}

export function getWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  let normalized = digits;
  if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = `9${normalized}`;
  } else if (normalized.length === 10 && normalized.startsWith('5')) {
    normalized = `90${normalized}`;
  }
  return `https://wa.me/${normalized}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  if (digits.length === 12 && digits.startsWith('90')) {
    const local = `0${digits.slice(2)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 9)} ${local.slice(9, 11)}`;
  }
  return phone.trim();
}
