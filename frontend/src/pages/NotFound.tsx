import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container section">
      <div className="empty-state card">
        <h1>404</h1>
        <p className="muted">Halaman yang kamu cari tidak ditemukan.</p>
        <Link to="/" className="btn btn-primary">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
