import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { EventCard } from '../components/EventCard';
import type { EventItem } from '../types';
import { useAuth } from '../context/AuthContext';

export function EventList() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .listEvents({ search, category })
        .then((response) => {
          if (!active) return;
          setEvents(response.events);
          setCategories(response.categories);
          setError('');
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar event');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category]);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">Platform Event Kampus</p>
            <h1>Temukan event yang cocok untukmu.</h1>
            <p className="hero-text">
              Seminar, workshop, kompetisi, dan career talk dari seluruh fakultas — lengkap dengan
              kuota dan pendaftaran real-time.
            </p>
            {!user && (
              <div className="hero-actions">
                <a href="#daftar-event" className="btn btn-primary">
                  Lihat Event
                </a>
                <Link to="/register" className="btn btn-outline">
                  Buat Akun
                </Link>
              </div>
            )}
          </div>
          <div className="hero-panel">
            <p className="hero-panel-label">Status layanan</p>
            <p className="hero-panel-value">Aktif</p>
            <p className="hero-panel-note">
              3 container berjalan: frontend, backend, dan database PostgreSQL.
            </p>
          </div>
        </div>
      </section>

      <section className="container section" id="daftar-event">
        <div className="section-head">
          <div>
            <h2>Daftar Event</h2>
            <p className="muted">Gunakan pencarian atau filter kategori untuk menemukan event.</p>
          </div>
          <span className="pill">{events.length} event</span>
        </div>

        <div className="filters">
          <label className="field field-inline">
            <span className="sr-only">Cari event</span>
            <input
              type="search"
              className="input"
              placeholder="Cari judul, lokasi, atau deskripsi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field field-inline">
            <span className="sr-only">Filter kategori</span>
            <select
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Semua kategori</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="page-state">Memuat event...</div>
        ) : events.length === 0 ? (
          <div className="empty-state card">
            <h3>Tidak ada event yang cocok</h3>
            <p className="muted">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
