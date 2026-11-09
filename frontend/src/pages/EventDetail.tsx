import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { EventItem, Registration } from '../types';
import { formatDateTime, formatSeats } from '../utils/format';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const eventData = await api.getEvent(id);
      setEvent(eventData);

      if (user) {
        const registrations = await api.myRegistrations();
        setRegistration(registrations.find((item) => item.eventId === id) ?? null);
      } else {
        setRegistration(null);
      }
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat detail event');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegister() {
    if (!id) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await api.registerForEvent(id);
      setNotice('Pendaftaran berhasil. Sampai jumpa di acara!');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mendaftar event');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!registration) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await api.cancelRegistration(registration.id);
      setNotice('Pendaftaran dibatalkan.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membatalkan pendaftaran');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="page-state">Memuat detail event...</div>;
  }

  if (!event) {
    return (
      <div className="container section">
        <div className="empty-state card">
          <h2>Event tidak ditemukan</h2>
          <p className="muted">{error || 'Event mungkin sudah dihapus oleh admin.'}</p>
          <Link to="/" className="btn btn-primary">
            Kembali ke daftar event
          </Link>
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const isFull = event.remainingSeats === 0;

  return (
    <div className="container section detail-layout">
      <div className="detail-main">
        <Link to="/" className="back-link">
          ← Kembali ke daftar event
        </Link>

        <div className="detail-header">
          <span className="badge">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="muted">
            Diselenggarakan oleh {event.creator?.name ?? 'Admin KampusEvent'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}

        <div className="card prose">
          <h2>Tentang event</h2>
          <p>{event.description}</p>
        </div>
      </div>

      <aside className="detail-side card">
        <h2>Informasi</h2>

        <dl className="info-list">
          <div>
            <dt>Tanggal & waktu</dt>
            <dd>{formatDateTime(event.startsAt)}</dd>
          </div>
          <div>
            <dt>Lokasi</dt>
            <dd>{event.location}</dd>
          </div>
          <div>
            <dt>Kuota</dt>
            <dd>{formatSeats(event.registeredCount, event.capacity)}</dd>
          </div>
        </dl>

        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${percentage}%` }} />
        </div>
        <p className="muted small">
          {isFull
            ? 'Kuota sudah penuh.'
            : `Tersisa ${event.remainingSeats} kursi (${percentage}% terisi).`}
        </p>

        {!user ? (
          <Link to="/login" state={{ from: `/events/${event.id}` }} className="btn btn-primary btn-block">
            Masuk untuk mendaftar
          </Link>
        ) : registration ? (
          <>
            <div className="alert alert-info">
              Kamu terdaftar pada event ini ({registration.status.toLowerCase()}).
            </div>
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={handleCancel}
              disabled={busy}
            >
              {busy ? 'Memproses...' : 'Batalkan pendaftaran'}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleRegister}
            disabled={busy || isFull}
          >
            {busy ? 'Memproses...' : isFull ? 'Kuota penuh' : 'Daftar sekarang'}
          </button>
        )}

        {user?.role === 'ADMIN' && (
          <Link to={`/admin/events/${event.id}/participants`} className="btn btn-outline btn-block">
            Lihat daftar peserta
          </Link>
        )}
      </aside>
    </div>
  );
}
