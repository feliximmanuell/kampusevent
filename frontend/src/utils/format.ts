const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Mengubah ISO date menjadi "Senin, 14 November 2026" (zona waktu Asia/Jakarta). */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const parts = getJakartaParts(date);

  return `${DAY_NAMES[parts.day]}, ${parts.date} ${MONTH_NAMES[parts.month - 1]} ${parts.year}`;
}

/** Mengubah ISO date menjadi "Senin, 14 November 2026 pukul 09.00 WIB". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const parts = getJakartaParts(date);
  const time = `${String(parts.hour).padStart(2, '0')}.${String(parts.minute).padStart(2, '0')}`;

  return `${formatDate(iso)} pukul ${time} WIB`;
}

export function formatSeats(registered: number, capacity: number): string {
  return `${registered} dari ${capacity} peserta`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const parts = getJakartaParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.date).padStart(
    2,
    '0',
  )}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

function getJakartaParts(date: Date) {
  // Intl dengan timeZone Asia/Jakarta supaya hasil konsisten
  // meskipun browser/server berada di zona waktu berbeda.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const weekdayShort = lookup('weekday');
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(lookup('year')),
    month: Number(lookup('month')),
    date: Number(lookup('day')),
    hour: Number(lookup('hour')) % 24,
    minute: Number(lookup('minute')),
    day: weekdayMap[weekdayShort] ?? 0,
  };
}
