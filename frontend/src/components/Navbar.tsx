import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="KampusEvent beranda">
          <span className="brand-mark">KE</span>
          <span className="brand-text">
            Kampus<span>Event</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Navigasi utama">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Event
          </NavLink>
          {user && (
            <NavLink
              to="/my-registrations"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Registrasi Saya
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-chip" title={user.email}>
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Masuk
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
