import { describe, expect, it } from 'vitest';
import { formatSeats, initials, toDateTimeLocalValue } from './format';

describe('utils format - kasus tambahan', () => {
  it('menampilkan jumlah kursi saat masih kosong', () => {
    expect(formatSeats(0, 40)).toBe('0 dari 40 peserta');
  });

  it('mengambil maksimal dua inisial dari nama panjang', () => {
    expect(initials('Budi Santoso Putra')).toBe('BS');
  });

  it('mengubah waktu UTC dini hari menjadi tanggal berikutnya di WIB', () => {
    expect(toDateTimeLocalValue('2026-01-01T17:30:00.000Z')).toBe('2026-01-02T00:30');
  });
});
