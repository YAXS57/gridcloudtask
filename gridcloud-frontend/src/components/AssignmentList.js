import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

function Spinner() {
  return (
    <div className="gc-loading" aria-live="polite" aria-label="Memuat data...">
      <div className="gc-spinner" />
      <span>Memuat tugas...</span>
    </div>
  );
}

function Modal({ children, onClose, labelId, size = 'gc-modal-md' }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="gc-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`gc-modal ${size}`} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

// Badge status pengumpulan tugas
function StatusBadge({ task }) {
  if (task.is_closed) {
    return <span className="gc-badge gc-badge-danger" style={{ marginLeft: '0.5rem' }}>Ditutup paksa</span>;
  }
  const past = new Date(task.deadline) <= new Date();
  if (past && task.deadline_mode === 'strict') {
    return <span className="gc-badge gc-badge-muted" style={{ marginLeft: '0.5rem' }}>Tutup otomatis</span>;
  }
  if (past && task.deadline_mode === 'lenient') {
    return <span className="gc-badge" style={{ marginLeft: '0.5rem', background: '#fff3e0', color: '#e65100', borderRadius: 'var(--radius-badge)', padding: '0.2em 0.55em', fontSize: '0.72rem', fontWeight: 600 }}>Menerima terlambat</span>;
  }
  return null;
}

function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [msg, setMsg] = useState(null);

  // Modal pengumpulan
  const [showSubModal, setShowSubModal] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [submissionList, setSubmissionList] = useState([]);

  // Modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editId, setEditId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editLecturerId, setEditLecturerId] = useState('');
  const [editDeadlineMode, setEditDeadlineMode] = useState('strict');

  const fetchAssignments = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
      setLoadStatus('ok');
    } catch {
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleDownload = async (submission) => {
    try {
      const response = await api.get(`/submissions/${submission.id}/download`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = String(submission.file_path || 'submission').split('/').pop();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setMsg({ type: 'danger', text: 'Gagal mengunduh file pengumpulan.' });
    }
  };

  const handleDelete = (id, title) => {
    setMsg({ type: 'confirm', id, text: `Hapus tugas "${title}"? Semua pengumpulan ikut dihapus.` });
  };

  const confirmDelete = async (id) => {
    setMsg(null);
    try {
      await api.delete(`/assignments/${id}`);
      setMsg({ type: 'success', text: 'Tugas berhasil dihapus.' });
      fetchAssignments();
    } catch {
      setMsg({ type: 'danger', text: 'Gagal menghapus tugas. Coba lagi.' });
    }
  };

  const handleClose = async (id, title) => {
    setMsg({ type: 'confirmClose', id, text: `Tutup pengumpulan "${title}"? Mahasiswa tidak bisa mengirim tugas lagi.` });
  };

  const confirmClose = async (id) => {
    setMsg(null);
    try {
      await api.patch(`/assignments/${id}/close`);
      setMsg({ type: 'success', text: 'Pengumpulan tugas ditutup.' });
      fetchAssignments();
    } catch {
      setMsg({ type: 'danger', text: 'Gagal menutup tugas. Coba lagi.' });
    }
  };

  const handleReopen = async (id) => {
    try {
      await api.patch(`/assignments/${id}/reopen`);
      setMsg({ type: 'success', text: 'Pengumpulan tugas dibuka kembali.' });
      fetchAssignments();
    } catch {
      setMsg({ type: 'danger', text: 'Gagal membuka kembali tugas. Coba lagi.' });
    }
  };

  const handleViewSubmissions = async (id, title) => {
    setSubmissionList([]);
    setSubError(null);
    setSubLoading(true);
    setSelectedTitle(title);
    setShowSubModal(true);
    try {
      const res = await api.get(`/assignments/${id}/submissions`);
      setSubmissionList(res.data.submissions || []);
    } catch {
      setSubError('Gagal memuat data pengumpulan. Coba tutup dan buka kembali.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleEditClick = (task) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditLecturerId(task.lecturer_id);
    setEditDeadlineMode(task.deadline_mode || 'strict');
    const d = new Date(task.deadline);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditDeadline(d.toISOString().slice(0, 16));
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/assignments/${editId}`, {
        title: editTitle,
        description: editDesc,
        deadline: editDeadline,
        lecturer_id: editLecturerId,
        deadline_mode: editDeadlineMode,
      });
      setMsg({ type: 'success', text: 'Tugas berhasil diperbarui.' });
      setShowEditModal(false);
      fetchAssignments();
    } catch {
      setMsg({ type: 'danger', text: 'Gagal memperbarui tugas. Coba lagi.' });
    } finally {
      setEditLoading(false);
    }
  };

  const now = new Date();
  const activeTasks = assignments.filter((t) => !t.is_closed && new Date(t.deadline) > now);
  const lateTasks   = assignments.filter((t) => !t.is_closed && t.deadline_mode === 'lenient' && new Date(t.deadline) <= now);
  const closedTasks = assignments.filter((t) => t.is_closed || (t.deadline_mode === 'strict' && new Date(t.deadline) <= now));

  const formatDeadline = (str) =>
    new Date(str).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const TaskTable = ({ data }) => (
    <table className="gc-table" aria-label="Daftar tugas">
      <thead>
        <tr>
          <th scope="col">Judul</th>
          <th scope="col">Deadline</th>
          <th scope="col">Status</th>
          <th scope="col" style={{ width: '220px' }}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.map((task) => {
          const past = new Date(task.deadline) <= now;
          return (
            <tr key={task.id}>
              <td>
                <span style={{ fontWeight: 600 }}>{task.title}</span>
                <StatusBadge task={task} />
              </td>
              <td>
                <span className={past ? 'gc-deadline-past' : 'gc-deadline-active'}>
                  {formatDeadline(task.deadline)}
                </span>
              </td>
              <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {task.is_closed
                  ? 'Ditutup paksa'
                  : task.deadline_mode === 'lenient'
                    ? 'Menerima terlambat'
                    : 'Tutup otomatis'}
              </td>
              <td>
                <div className="gc-table-actions">
                  <button
                    className="btn-gc-ghost"
                    onClick={() => handleEditClick(task)}
                    aria-label={`Edit tugas ${task.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-gc-ghost"
                    onClick={() => handleViewSubmissions(task.id, task.title)}
                    aria-label={`Lihat pengumpulan ${task.title}`}
                  >
                    Pengumpulan
                  </button>
                  {task.is_closed ? (
                    <button
                      className="btn-gc-ghost"
                      onClick={() => handleReopen(task.id)}
                      aria-label={`Buka kembali ${task.title}`}
                    >
                      Buka
                    </button>
                  ) : (
                    <button
                      className="btn-gc-danger"
                      onClick={() => handleClose(task.id, task.title)}
                      aria-label={`Tutup paksa ${task.title}`}
                    >
                      Tutup
                    </button>
                  )}
                  <button
                    className="btn-gc-danger"
                    onClick={() => handleDelete(task.id, task.title)}
                    aria-label={`Hapus tugas ${task.title}`}
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div>
      {/* Pesan feedback */}
      {msg && msg.type !== 'confirm' && msg.type !== 'confirmClose' && (
        <div
          className={`gc-alert gc-alert-${msg.type}`}
          role="alert"
          aria-live="polite"
          style={{ marginBottom: '1rem' }}
        >
          {msg.text}
          <button
            onClick={() => setMsg(null)}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: 'inherit' }}
            aria-label="Tutup pesan"
          >
            &times;
          </button>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {msg && msg.type === 'confirm' && (
        <div
          className="gc-alert gc-alert-warning"
          role="alertdialog"
          aria-live="assertive"
          style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
        >
          <span>{msg.text}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-gc-ghost" onClick={() => setMsg(null)}>Batal</button>
            <button className="btn-gc-danger" onClick={() => confirmDelete(msg.id)}>Ya, Hapus</button>
          </div>
        </div>
      )}

      {/* Konfirmasi tutup paksa */}
      {msg && msg.type === 'confirmClose' && (
        <div
          className="gc-alert gc-alert-warning"
          role="alertdialog"
          aria-live="assertive"
          style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
        >
          <span>{msg.text}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-gc-ghost" onClick={() => setMsg(null)}>Batal</button>
            <button className="btn-gc-danger" onClick={() => confirmClose(msg.id)}>Ya, Tutup</button>
          </div>
        </div>
      )}

      {/* Card: Tugas Aktif */}
      <div className="gc-card" style={{ marginBottom: '1.25rem' }}>
        <div className="gc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="gc-card-title">Tugas Aktif</h3>
          <button className="btn-gc-ghost" onClick={fetchAssignments} aria-label="Muat ulang">
            Muat Ulang
          </button>
        </div>
        <div style={{ padding: 0 }}>
          {loadStatus === 'loading' && <Spinner />}
          {loadStatus === 'error' && (
            <div className="gc-error">
              <p className="gc-error-title">Gagal memuat tugas</p>
              <p className="gc-error-desc">Periksa koneksi ke server lalu coba muat ulang.</p>
              <button className="btn-gc-ghost" style={{ marginTop: '0.5rem' }} onClick={fetchAssignments}>Coba Lagi</button>
            </div>
          )}
          {loadStatus === 'ok' && activeTasks.length === 0 && (
            <div className="gc-empty">
              <p className="gc-empty-title">Belum ada tugas aktif</p>
              <p className="gc-empty-desc">Buat tugas baru lewat form di sebelah kiri.</p>
            </div>
          )}
          {loadStatus === 'ok' && activeTasks.length > 0 && <TaskTable data={activeTasks} />}
        </div>
      </div>

      {/* Card: Menerima Terlambat */}
      {loadStatus === 'ok' && lateTasks.length > 0 && (
        <div className="gc-card" style={{ marginBottom: '1.25rem' }}>
          <div className="gc-card-header">
            <h3 className="gc-card-title">Menerima Pengumpulan Terlambat</h3>
          </div>
          <div style={{ padding: 0 }}>
            <TaskTable data={lateTasks} />
          </div>
        </div>
      )}

      {/* Card: Riwayat / Ditutup */}
      <div className="gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title">Riwayat dan Tutup</h3>
        </div>
        <div style={{ padding: 0 }}>
          {loadStatus === 'loading' && <Spinner />}
          {loadStatus === 'ok' && closedTasks.length === 0 && (
            <div className="gc-empty">
              <p className="gc-empty-title">Belum ada riwayat</p>
              <p className="gc-empty-desc">Tugas yang ditutup atau melewati deadline akan muncul di sini.</p>
            </div>
          )}
          {loadStatus === 'ok' && closedTasks.length > 0 && <TaskTable data={closedTasks} />}
        </div>
      </div>

      {/* Modal: Lihat Pengumpulan */}
      {showSubModal && (
        <Modal onClose={() => setShowSubModal(false)} labelId="sub-modal-title" size="gc-modal-lg">
          <div className="gc-modal-header">
            <h2 className="gc-modal-title" id="sub-modal-title">Pengumpulan: {selectedTitle}</h2>
            <button className="gc-modal-close" onClick={() => setShowSubModal(false)} aria-label="Tutup">&times;</button>
          </div>
          <div className="gc-modal-body">
            {subLoading && <Spinner />}
            {subError && (
              <div className="gc-error">
                <p className="gc-error-title">Gagal memuat data</p>
                <p className="gc-error-desc">{subError}</p>
              </div>
            )}
            {!subLoading && !subError && submissionList.length === 0 && (
              <div className="gc-empty">
                <p className="gc-empty-title">Belum ada yang mengumpulkan</p>
                <p className="gc-empty-desc">Mahasiswa yang mengumpulkan akan muncul di sini.</p>
              </div>
            )}
            {!subLoading && !subError && submissionList.length > 0 && (
              <table className="gc-table" aria-label={`Pengumpulan ${selectedTitle}`}>
                <thead>
                  <tr>
                    <th scope="col">Nama</th>
                    <th scope="col">NIM</th>
                    <th scope="col">Waktu Kirim</th>
                    <th scope="col">Status</th>
                    <th scope="col">File</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionList.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.student_name}</td>
                      <td>{sub.nim}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(sub.created_at).toLocaleString('id-ID')}
                      </td>
                      <td>
                        {sub.is_late
                          ? <span className="gc-badge gc-badge-danger">Terlambat</span>
                          : <span className="gc-badge" style={{ background: '#edfaf5', color: '#0a4a3a', borderRadius: 'var(--radius-badge)', padding: '0.2em 0.55em', fontSize: '0.72rem', fontWeight: 600 }}>Tepat waktu</span>
                        }
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDownload(sub)}
                          className="btn-gc-ghost"
                          aria-label={`Unduh file dari ${sub.student_name}`}
                        >
                          Unduh
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Edit Tugas */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} labelId="edit-modal-title" size="gc-modal-md">
          <div className="gc-modal-header">
            <h2 className="gc-modal-title" id="edit-modal-title">Edit Tugas</h2>
            <button className="gc-modal-close" onClick={() => setShowEditModal(false)} aria-label="Tutup">&times;</button>
          </div>
          <form onSubmit={handleUpdateSubmit}>
            <div className="gc-modal-body">
              <div className="gc-field">
                <label className="gc-label" htmlFor="edit-title">Judul Tugas</label>
                <input id="edit-title" type="text" className="gc-input" value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="gc-field">
                <label className="gc-label" htmlFor="edit-deadline">Batas Waktu</label>
                <input id="edit-deadline" type="datetime-local" className="gc-input" value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)} required />
              </div>
              <div className="gc-field">
                <label className="gc-label" htmlFor="edit-deadline-mode">Mode Deadline</label>
                <select id="edit-deadline-mode" className="gc-input" value={editDeadlineMode}
                  onChange={(e) => setEditDeadlineMode(e.target.value)}>
                  <option value="strict">Tutup otomatis saat deadline lewat</option>
                  <option value="lenient">Tetap terima, tapi ditandai terlambat</option>
                </select>
              </div>
              <div className="gc-field">
                <label className="gc-label" htmlFor="edit-lecturer">ID Dosen</label>
                <input id="edit-lecturer" type="text" className="gc-input" value={editLecturerId}
                  onChange={(e) => setEditLecturerId(e.target.value)} required />
              </div>
              <div className="gc-field" style={{ marginBottom: 0 }}>
                <label className="gc-label" htmlFor="edit-desc">Deskripsi</label>
                <textarea id="edit-desc" className="gc-input" value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)} required />
              </div>
            </div>
            <div className="gc-modal-footer">
              <button type="button" className="btn-gc-ghost" onClick={() => setShowEditModal(false)}>Batal</button>
              <button type="submit" className="btn-gc-primary" disabled={editLoading}>
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AssignmentList;
