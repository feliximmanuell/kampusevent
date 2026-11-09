import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: string;
}

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(state?.from ?? (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    }
  }, [user, navigate, state?.from]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const destination = state?.from ?? (loggedUser.role === 'ADMIN' ? '/admin' : '/');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  return (
    <div className="auth-layout">
      <section className="auth-card card">
        <h1>Masuk ke KampusEvent</h1>
        <p className="muted">Kelola dan ikuti event kampus dengan mudah.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@kampus.ac.id"
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="demo-box">
          <p className="demo-title">Akun demo</p>
          <div className="demo-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillDemo('admin@kampus.ac.id', 'Admin123!')}
            >
              Isi akun admin
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillDemo('budi@kampus.ac.id', 'Mahasiswa123!')}
            >
              Isi akun mahasiswa
            </button>
          </div>
        </div>

        <p className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>
      </section>

      <aside className="auth-aside">
        <h2>Satu tempat untuk semua event kampus.</h2>
        <ul>
          <li>Seminar, workshop, dan kompetisi dalam satu daftar.</li>
          <li>Pendaftaran instan dengan batas kuota otomatis.</li>
          <li>Pantau peserta dan statistik dari dashboard admin.</li>
        </ul>
      </aside>
    </div>
  );
}
