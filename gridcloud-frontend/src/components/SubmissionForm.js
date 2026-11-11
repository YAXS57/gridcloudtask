import React, { useState, useEffect } from 'react';
import api from '../api';

function SubmissionForm() {
  const [assignments, setAssignments] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [nim, setNim] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadStatus('loading');
      try {
        const res = await api.get('/assignments');
        setAssignments(res.data);
        setLoadStatus('ok');
      } catch {
        setLoadStatus('error');
      }
    };
    fetchAssignments();
  }, []);

  const now = new Date();

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedAssignment(id);
    const task = assignments.find((t) => String(t.id) === String(id));
    setSelectedTask(task || null);
    setMsg(null);
  };

  // Tentukan apakah tugas bisa dipilih
  const getTaskStatus = (task) => {
    if (task.is_closed) return 'closed';
    const past = new Date(task.deadline) < now;
    if (past && task.deadline_mode === 'strict') return 'closed';
    if (past && task.deadline_mode === 'lenient') return 'late';
    return 'open';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!selectedAssignment || !file) {
      setMsg({ type: 'warning', text: 'Pilih tugas dan sertakan file sebelum mengirim.' });
      return;
    }

    const formData = new FormData();
    formData.append('assignment_id', selectedAssignment);
    formData.append('student_name', studentName);
    formData.append('nim', nim);
    formData.append('file', file);

    setSubmitting(true);
    try {
      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const isLate = res.data.is_late;
      const telegramNote = res.data.telegram_status ? ` (${res.data.telegram_status})` : '';

      setMsg({
        type: isLate ? 'warning' : 'success',
        text: res.data.message + telegramNote,
      });

      setStudentName('');
      setNim('');
      setFile(null);
      setSelectedAssignment('');
      setSelectedTask(null);
      const fileInput = document.getElementById('sf-file');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Gagal mengirim tugas. Coba lagi.';
      setMsg({ type: 'danger', text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gc-card">
      <div className="gc-card-header">
        <h3 className="gc-card-title">Kirim Tugas</h3>
      </div>
      <div className="gc-card-body">

        {msg && (
          <div className={`gc-alert gc-alert-${msg.type}`} role="alert" aria-live="polite">
            {msg.text}
          </div>
        )}

        {loadStatus === 'loading' && (
          <div className="gc-loading" aria-live="polite">
            <div className="gc-spinner" />
            <span>Memuat daftar tugas...</span>
          </div>
        )}

        {loadStatus === 'error' && (
          <div className="gc-error">
            <p className="gc-error-title">Gagal memuat daftar tugas</p>
            <p className="gc-error-desc">Periksa koneksi internet atau hubungi administrator aplikasi.</p>
          </div>
        )}

        {loadStatus === 'ok' && (
          <form onSubmit={handleSubmit} noValidate>

            <div className="gc-field">
              <label className="gc-label" htmlFor="sf-assignment">Pilih Tugas</label>
              <select
                id="sf-assignment"
                className="gc-input"
                value={selectedAssignment}
                onChange={handleSelectChange}
                required
              >
                <option value="">Pilih tugas yang ingin dikumpulkan</option>
                {assignments.map((task) => {
                  const status = getTaskStatus(task);
                  const deadlineLabel = new Date(task.deadline).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                  let label = task.title;
                  if (status === 'closed') label += ' (Ditutup)';
                  else if (status === 'late') label += ` (Menerima terlambat — Deadline: ${deadlineLabel})`;
                  else label += ` — Deadline: ${deadlineLabel}`;

                  return (
                    <option key={task.id} value={task.id} disabled={status === 'closed'}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <span className="gc-hint">Tugas yang sudah ditutup tidak dapat dipilih.</span>
            </div>

            {/* Peringatan terlambat — muncul saat memilih tugas mode lenient yang sudah lewat deadline */}
            {selectedTask && getTaskStatus(selectedTask) === 'late' && (
              <div
                className="gc-alert gc-alert-warning"
                role="status"
                aria-live="polite"
                style={{ marginBottom: '1rem' }}
              >
                Deadline tugas ini sudah lewat. Pengumpulan masih diterima, tetapi akan dicatat sebagai
                terlambat.
              </div>
            )}

            <div className="gc-field">
              <label className="gc-label" htmlFor="sf-name">Nama Lengkap</label>
              <input
                id="sf-name"
                type="text"
                className="gc-input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nama sesuai KTM"
                required
                autoComplete="name"
              />
            </div>

            <div className="gc-field">
              <label className="gc-label" htmlFor="sf-nim">NIM</label>
              <input
                id="sf-nim"
                type="text"
                className="gc-input"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Nomor Induk Mahasiswa"
                required
                autoComplete="off"
              />
            </div>

            <div className="gc-field">
              <label className="gc-label" htmlFor="sf-file">File Tugas</label>
              <input
                id="sf-file"
                type="file"
                className="gc-input"
                onChange={(e) => setFile(e.target.files[0])}
                required
                style={{ padding: '0.4rem 0.75rem' }}
              />
              <span className="gc-hint">Maksimum ukuran file 10 MB.</span>
            </div>

            <button
              type="submit"
              className="btn-gc-accent"
              style={{ width: '100%', padding: '0.6rem' }}
              disabled={submitting}
            >
              {submitting ? 'Mengirim...' : 'Kirim Tugas'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}

export default SubmissionForm;
