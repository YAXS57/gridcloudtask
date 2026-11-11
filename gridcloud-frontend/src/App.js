import React, { useState } from 'react';
import api from './api';
import './index.css';
import AssignmentForm from './components/AssignmentForm';
import SubmissionForm from './components/SubmissionForm';
import AssignmentList from './components/AssignmentList';

function App() {
  const [currentView, setCurrentView] = useState('home');

  // Login state untuk panel dosen
  const [showLogin, setShowLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const goHome = () => {
    window.localStorage.removeItem('gridcloud_lecturer_token');
    setCurrentView('home');
    setLoginError('');
    setPasswordInput('');
  };

  const handleDosenClick = () => {
    setShowLogin(true);
    setPasswordInput('');
    setLoginError('');
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    try {
      const response = await api.post('/lecturer/login', { password: passwordInput });
      window.localStorage.setItem('gridcloud_lecturer_token', response.data.token);
      setShowLogin(false);
      setCurrentView('dosen');
      setPasswordInput('');
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Login gagal. Periksa koneksi backend.');
    }
  };

  const handleLoginKeyDown = (e) => {
    if (e.key === 'Enter') handleLoginSubmit();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface-subtle)' }}>

      {/* Navbar */}
      <nav className="gc-navbar" role="banner">
        <span
          className="gc-navbar-brand"
          onClick={goHome}
          onKeyDown={(e) => e.key === 'Enter' && goHome()}
          tabIndex={0}
          role="link"
          aria-label="Ke halaman utama"
        >
          GridCloud Task App
        </span>
        {currentView !== 'home' && (
          <button className="gc-nav-back" onClick={goHome} aria-label="Kembali ke menu utama">
            Kembali
          </button>
        )}
      </nav>

      {/* Home — pilih peran */}
      {currentView === 'home' && (
        <div className="gc-page gc-home" role="main">
          <h1 className="gc-home-title">Masuk sebagai</h1>
          <div className="gc-role-grid" role="list">

            <div
              className="gc-role-card gc-role-card-dosen"
              role="listitem button"
              tabIndex={0}
              onClick={handleDosenClick}
              onKeyDown={(e) => e.key === 'Enter' && handleDosenClick()}
              aria-label="Masuk sebagai Dosen, membutuhkan password"
            >
              <span className="gc-role-card-label">Staf pengajar</span>
              <h2 className="gc-role-card-title">Dosen</h2>
              <p className="gc-role-card-desc">Buat dan kelola tugas. Lihat siapa yang sudah mengumpulkan.</p>
              <button
                className="btn-gc-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                tabIndex={-1}
                aria-hidden="true"
              >
                Masuk dengan Password
              </button>
            </div>

            <div
              className="gc-role-card gc-role-card-mhs"
              role="listitem button"
              tabIndex={0}
              onClick={() => setCurrentView('mahasiswa')}
              onKeyDown={(e) => e.key === 'Enter' && setCurrentView('mahasiswa')}
              aria-label="Masuk sebagai Mahasiswa"
            >
              <span className="gc-role-card-label">Peserta kuliah</span>
              <h2 className="gc-role-card-title">Mahasiswa</h2>
              <p className="gc-role-card-desc">Pilih tugas dan kumpulkan file sebelum deadline.</p>
              <button
                className="btn-gc-accent"
                style={{ marginTop: '1rem', width: '100%' }}
                tabIndex={-1}
                aria-hidden="true"
              >
                Lihat Tugas
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Panel Dosen */}
      {currentView === 'dosen' && (
        <main className="gc-page" role="main">
          <div className="gc-panel-header">
            <h2>Panel Dosen</h2>
            <p>Buat tugas baru atau kelola tugas yang sudah ada.</p>
          </div>
          <div className="gc-two-col">
            <AssignmentForm />
            <AssignmentList />
          </div>
        </main>
      )}

      {/* Panel Mahasiswa */}
      {currentView === 'mahasiswa' && (
        <main className="gc-page-narrow" role="main">
          <div className="gc-panel-header">
            <h2>Pengumpulan Tugas</h2>
            <p>Pilih tugas, isi data, dan upload file sebelum deadline.</p>
          </div>
          <SubmissionForm />
        </main>
      )}

      {/* Modal login dosen */}
      {showLogin && (
        <div
          className="gc-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowLogin(false)}
        >
          <div className="gc-modal gc-modal-sm">
            <div className="gc-modal-header">
              <h2 className="gc-modal-title" id="login-modal-title">Akses Dosen</h2>
              <button
                className="gc-modal-close"
                onClick={() => setShowLogin(false)}
                aria-label="Tutup dialog"
              >
                &times;
              </button>
            </div>
            <form className="gc-login-box" onSubmit={handleLoginSubmit}>
              <div className="gc-field">
                <label className="gc-label" htmlFor="dosen-password">
                  Password
                </label>
                <input
                  id="dosen-password"
                  type="password"
                  className="gc-input"
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={handleLoginKeyDown}
                  autoFocus
                  autoComplete="current-password"
                />
                {loginError && (
                  <div className="gc-hint" style={{ color: 'var(--color-danger)', marginTop: '0.4rem' }} role="alert">
                    {loginError}
                  </div>
                )}
              </div>
              <div className="gc-modal-footer" style={{ padding: '0', border: 'none', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-gc-ghost"
                  onClick={() => setShowLogin(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-gc-primary">
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="gc-footer">
        GridCloud Task App &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}

export default App;
