import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { EventItem, Stats } from '../types';
import { formatDateTime, formatSeats, toDateTimeLocalValue } from '../utils/format';

const CATEGORY_OPTIONS = ['Seminar', 'Workshop', 'Kompetisi', 'Karier', 'Lainnya'];

interface FormState {
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  capacity: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  category: 'Seminar',
  location: '',
  startsAt: '',
  capacity: '50',
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, eventsData] = await Promise.all([api.stats(), api.listEvents()]);
      setStats(statsData);
      setEvents(eventsData.events);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setNotice('');
  }

  function startEdit(event: EventItem) {
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      startsAt: toDateTimeLocalValue(event.startsAt),
      capacity: String(event.capacity),
    });
    setEditingId(event.id);
    setShowForm(true);
    setNotice('');
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const startsAt = new Date(form.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        throw new Error('Tanggal dan waktu event tidak valid');
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        startsAt: startsAt.toISOString(),
        capacity: Number(form.capacity),
      };

      if (editingId) {
        await api.updateEvent(editingId, payload);
        setNotice('Event berhasil diperbarui.');
      } else {
        await api.createEvent(payload);
        setNotice('Event baru berhasil dibuat.');
      }

      resetForm();
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal menyimpan event');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: EventItem) {
    if (!window.confirm(`Hapus event "${event.title}"? Semua registrasi terkait juga akan dihapus.`)) {
      return;
    }

    try {
      await api.deleteEvent(event.id);
      setNotice('Event berhasil dihapus.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus event');
    }
  }

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <h1>Dashboard Admin</h1>
          <p className="muted">Pantau statistik dan kelola seluruh event kampus.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          + Buat Event
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading && !stats ? (
        <div className="page-state">Memuat dashboard...</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="card stat-card">
              <span className="stat-label">Total event</span>
              <strong className="stat-value">{stats?.totalEvents ?? 0}</strong>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Event mendatang</span>
              <strong className="stat-value">{stats?.upcomingEvents ?? 0}</strong>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Mahasiswa terdaftar</span>
              <strong className="stat-value">{stats?.totalStudents ?? 0}</strong>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Total registrasi</span>
              <strong className="stat-value">{stats?.totalRegistrations ?? 0}</strong>
            </div>
          </div>

          {stats && stats.byCategory.length > 0 && (
            <div className="card category-summary">
              <h2>Event per kategori</h2>
              <div className="chip-row">
                {stats.byCategory.map((item) => (
                  <span key={item.category} className="pill">
                    {item.category}: {item.total}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showForm && (
            <div className="card form-card">
              <h2>{editingId ? 'Edit event' : 'Buat event baru'}</h2>

              <form className="form" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Judul event</span>
                  <input
                    className="input"
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                    minLength={3}
                  />
                </label>

                <label className="field">
                  <span>Deskripsi</span>
                  <textarea
                    className="input"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    required
                    minLength={10}
                  />
                </label>

                <div className="form-row">
                  <label className="field">
                    <span>Kategori</span>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Kapasitas</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={10000}
                      value={form.capacity}
                      onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="field">
                    <span>Lokasi</span>
                    <input
                      className="input"
                      type="text"
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      required
                      minLength={3}
                    />
                  </label>

                  <label className="field">
                    <span>Tanggal & waktu</span>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Buat event'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={resetForm}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card table-card">
            <div className="table-head">
              <h2>Semua event</h2>
              <span className="pill">{events.length} event</span>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Kategori</th>
                    <th>Jadwal</th>
                    <th>Peserta</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <Link to={`/events/${event.id}`}>{event.title}</Link>
                        <div className="muted small">{event.location}</div>
                      </td>
                      <td>
                        <span className="badge">{event.category}</span>
                      </td>
                      <td className="small">{formatDateTime(event.startsAt)}</td>
                      <td className="small">
                        {formatSeats(event.registeredCount, event.capacity)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            to={`/admin/events/${event.id}/participants`}
                            className="btn btn-ghost btn-sm"
                          >
                            Peserta
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => startEdit(event)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(event)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-row">
                        Belum ada event. Klik "Buat Event" untuk menambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
