import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventCard } from './EventCard';
import type { EventItem } from '../types';

const event: EventItem = {
  id: 'evt-1',
  title: 'Workshop Docker & CI/CD',
  description: 'Workshop praktik langsung.',
  category: 'Workshop',
  location: 'Lab Komputer 3',
  startsAt: '2026-11-14T02:00:00.000Z',
  capacity: 40,
  createdById: 'admin-1',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  registeredCount: 10,
  remainingSeats: 30,
};

describe('EventCard', () => {
  it('menampilkan informasi utama event', () => {
    render(
      <MemoryRouter>
        <EventCard event={event} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Workshop Docker & CI/CD')).toBeInTheDocument();
    expect(screen.getByText(/Lab Komputer 3/)).toBeInTheDocument();
    expect(screen.getByText('10 dari 40 peserta')).toBeInTheDocument();
    expect(screen.getByText('Tersedia')).toBeInTheDocument();
  });

  it('menandai event yang sudah penuh', () => {
    render(
      <MemoryRouter>
        <EventCard event={{ ...event, registeredCount: 40, remainingSeats: 0 }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Penuh')).toBeInTheDocument();
  });
});
