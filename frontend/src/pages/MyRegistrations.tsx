import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { Registration } from '../types';
import { formatDateTime } from '../utils/format';

export function MyRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.myRegistrations();
      setRegistrations(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat registrasi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCancel(id: string) {
    if (!window.confirm('Batalkan pendaftaran pada event ini?')) return;

    try {
      await api.cancelRegistration(id);
      setNotice('Pendaftaran berhasil dibatalkan.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membatalkan pendaftaran');
    }
  }

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <h1>Registrasi Saya</h1>
          <p className="muted">Semua event yang sudah kamu daftarkan.</p>
        </div>
        <span className="pill">{registrations.length} registrasi</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? (
        <div className="page-state">Memuat registrasi...</div>
      ) : registrations.length === 0 ? (
        <div className="empty-state card">
          <h3>Belum ada registrasi</h3>
          <p className="muted">Telusuri event yang tersedia dan daftar pada event favoritmu.</p>
          <Link to="/" className="btn btn-primary">
            Lihat daftar event
          </Link>
        </div>
      ) : (
        <div className="stack">
          {registrations.map((registration) => (
            <article key={registration.id} className="card registration-row">
              <div>
                <span className="badge">{registration.event.category}</span>
                <h3>
                  <Link to={`/events/${registration.eventId}`}>{registration.event.title}</Link>
                </h3>
                <p className="muted small">
                  {formatDateTime(registration.event.startsAt)} · {registration.event.location}
                </p>
                <p className="muted small">
                  Terdaftar pada {new Date(registration.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="registration-actions">
                <span className="badge badge-success">{registration.status}</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancel(registration.id)}
                >
                  Batalkan
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
