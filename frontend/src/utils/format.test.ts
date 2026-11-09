import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatSeats, initials, toDateTimeLocalValue } from './format';

describe('utils format', () => {
  it('memformat tanggal dalam bahasa Indonesia dan zona waktu Jakarta', () => {
    const iso = '2026-11-14T02:00:00.000Z'; // 09.00 WIB
    expect(formatDate(iso)).toBe('Sabtu, 14 November 2026');
    expect(formatDateTime(iso)).toContain('09.00 WIB');
  });

  it('memformat jumlah kursi', () => {
    expect(formatSeats(12, 40)).toBe('12 dari 40 peserta');
  });

  it('mengambil inisial dari nama', () => {
    expect(initials('Budi Santoso')).toBe('BS');
    expect(initials('Sari')).toBe('S');
    expect(initials('  ')).toBe('');
  });

  it('mengubah ISO date menjadi nilai input datetime-local', () => {
    expect(toDateTimeLocalValue('2026-11-14T02:00:00.000Z')).toBe('2026-11-14T09:00');
  });
});
