import React, { useState } from 'react';
import api from '../api';

function AssignmentForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineMode, setDeadlineMode] = useState('strict');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!title || !description || !lecturerId || !deadline) {
      setMsg({ type: 'warning', text: 'Semua field wajib diisi termasuk deadline.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/assignments', {
        title,
        description,
        lecturer_id: lecturerId,
        deadline,
        deadline_mode: deadlineMode,
      });

      setMsg({ type: 'success', text: 'Tugas berhasil dibuat.' });
      setTitle('');
      setDescription('');
      setDeadline('');
      setDeadlineMode('strict');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Gagal membuat tugas. Coba lagi.';
      setMsg({ type: 'danger', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gc-card">
      <div className="gc-card-header">
        <h3 className="gc-card-title">Buat Tugas Baru</h3>
      </div>
      <div className="gc-card-body">

        {msg && (
          <div className={`gc-alert gc-alert-${msg.type}`} role="alert" aria-live="polite">
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <div className="gc-field">
            <label className="gc-label" htmlFor="af-lecturer-id">
              ID Dosen (Telegram Chat ID)
            </label>
            <input
              id="af-lecturer-id"
              type="text"
              inputMode="numeric"
              className="gc-input"
              value={lecturerId}
              onChange={(e) => setLecturerId(e.target.value)}
              placeholder="Contoh: 5298808777"
              required
              autoComplete="off"
            />
            <span className="gc-hint">Telegram Chat ID yang akan menerima notifikasi.</span>
          </div>

          <div className="gc-field">
            <label className="gc-label" htmlFor="af-deadline">
              Batas Waktu Pengumpulan
            </label>
            <input
              id="af-deadline"
              type="datetime-local"
              className="gc-input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="gc-field">
            <label className="gc-label" htmlFor="af-deadline-mode">
              Mode Deadline
            </label>
            <select
              id="af-deadline-mode"
              className="gc-input"
              value={deadlineMode}
              onChange={(e) => setDeadlineMode(e.target.value)}
            >
              <option value="strict">Tutup otomatis saat deadline lewat</option>
              <option value="lenient">Tetap terima, tapi ditandai terlambat</option>
            </select>
            <span className="gc-hint">
              {deadlineMode === 'strict'
                ? 'Mahasiswa tidak bisa mengumpulkan setelah deadline.'
                : 'Mahasiswa masih bisa mengumpulkan setelah deadline, pengumpulan akan diberi catatan terlambat.'}
            </span>
          </div>

          <div className="gc-field">
            <label className="gc-label" htmlFor="af-title">
              Judul Tugas
            </label>
            <input
              id="af-title"
              type="text"
              className="gc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemrograman Web Lanjut"
              required
            />
          </div>

          <div className="gc-field">
            <label className="gc-label" htmlFor="af-description">
              Deskripsi
            </label>
            <textarea
              id="af-description"
              className="gc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail tugas di sini..."
              required
            />
          </div>

          <button
            type="submit"
            className="btn-gc-primary"
            style={{ width: '100%', padding: '0.6rem' }}
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Buat dan Simpan Tugas'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AssignmentForm;
