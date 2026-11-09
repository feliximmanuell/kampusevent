import { Link } from 'react-router-dom';
import type { EventItem } from '../types';
import { formatDateTime, formatSeats } from '../utils/format';

export function EventCard({ event }: { event: EventItem }) {
  const percentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const almostFull = event.remainingSeats > 0 && event.remainingSeats <= 5;
  const isFull = event.remainingSeats === 0;

  return (
    <article className="event-card">
      <div className="event-card-top">
        <span className="badge">{event.category}</span>
        {isFull ? (
          <span className="badge badge-danger">Penuh</span>
        ) : almostFull ? (
          <span className="badge badge-warning">Hampir penuh</span>
        ) : (
          <span className="badge badge-success">Tersedia</span>
        )}
      </div>

      <h3 className="event-title">
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>

      <p className="event-meta">
        <span aria-hidden="true">📅</span> {formatDateTime(event.startsAt)}
      </p>
      <p className="event-meta">
        <span aria-hidden="true">📍</span> {event.location}
      </p>

      <div className="event-card-footer">
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${percentage}%` }} />
        </div>
        <div className="event-seats">
          <span>{formatSeats(event.registeredCount, event.capacity)}</span>
          <span>{percentage}%</span>
        </div>
        <Link to={`/events/${event.id}`} className="btn btn-outline btn-block">
          Lihat Detail
        </Link>
      </div>
    </article>
  );
}
