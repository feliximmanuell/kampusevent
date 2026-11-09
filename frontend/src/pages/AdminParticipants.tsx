import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import type { EventItem, Registration } from '../types';
import { formatDateTime, formatSeats } from '../utils/format';

export function AdminParticipants() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    api
      .eventParticipants(id)
      .then((response) => {
        if (!active) return;
        setEvent(response.event);
        setParticipants(response.participants);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Gagal memuat peserta');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="page-state">Memuat peserta...</div>;
  }

  return (
    <div className="container section">
      <Link to="/admin" className="back-link">
        ← Kembali ke dashboard
      </Link>

      {error && <div className="alert alert-error">{error}</div>}

      {event && (
        <>
          <div className="section-head">
            <div>
              <h1>Peserta Event</h1>
              <p className="muted">{event.title}</p>
              <p className="muted small">
                {formatDateTime(event.startsAt)} · {formatSeats(event.registeredCount, event.capacity)}
              </p>
            </div>
            <span className="pill">{participants.length} peserta</span>
          </div>

          <div className="card table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Waktu daftar</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant.id}>
                      <td>{index + 1}</td>
                      <td>{participant.user?.name ?? '-'}</td>
                      <td className="small">{participant.user?.email ?? '-'}</td>
                      <td>
                        <span className="badge badge-success">{participant.status}</span>
                      </td>
                      <td className="small">
                        {new Date(participant.createdAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-row">
                        Belum ada peserta yang mendaftar.
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
