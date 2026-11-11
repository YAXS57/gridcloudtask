# GridCloud — Panduan Deployment Netlify + Railway

## Arsitektur

- `gridcloud-frontend/`: React 19 + Create React App, deploy ke Netlify.
- `gridcloud-backend/`: Laravel 12 / PHP 8.2+, deploy ke Railway.
- PostgreSQL: Railway Database.
- File upload: Railway Volume yang dipasang ke `/app/storage/app/private/uploads`.
- Telegram: token disimpan sebagai Railway Variable.

## 1. Push repository

Pastikan kedua folder `gridcloud-frontend` dan `gridcloud-backend` berada di root repository GitHub. Jangan commit file `.env`, token Telegram, atau kredensial database.

## 2. Deploy PostgreSQL

1. Buat project di Railway.
2. Tambahkan service PostgreSQL.
3. Catat host, port, database, username, dan password dari Variables service PostgreSQL.

## 3. Deploy Laravel backend

1. Tambahkan service dari repository GitHub yang sama.
2. Atur Root Directory ke `/gridcloud-backend`.
3. Railway akan membaca `railway.json`; build menggunakan Railpack dan start memakai `bash ./start.sh`.
4. Tambahkan Variables berikut pada service backend:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_KEY=` hasil `php artisan key:generate --show` (jalankan lokal pada folder backend; salin hasilnya sebagai Railway Variable)
   - `APP_URL=https://<domain-backend-railway>`
   - `APP_TIMEZONE=Asia/Jakarta`
   - `DB_CONNECTION=pgsql`
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` dari service PostgreSQL
   - `DB_SSLMODE=prefer`
   - `SESSION_DRIVER=file`
   - `CACHE_STORE=file`
   - `QUEUE_CONNECTION=sync`
   - `FILESYSTEM_DISK=local`
   - `FRONTEND_URL=https://<domain-frontend-netlify>`
   - `LECTURER_PASSWORD=<password-dosen-kuat-dan-unik>`
   - `LECTURER_TOKEN_TTL=43200`
   - `TELEGRAM_BOT_TOKEN=<token-bot>` (jika notifikasi Telegram dipakai)
5. Pada Settings → Networking, generate domain publik.
6. Pada service backend, tambahkan Railway Volume dengan mount path **`/app/storage/app/private/uploads`**.
7. Pastikan service hanya menjalankan satu replica jika menggunakan satu volume.
8. Deploy. `start.sh` menyiapkan direktori volume, menjalankan `php artisan migrate --force`, cache konfigurasi, lalu menjalankan Laravel pada `$PORT`.

**Penting:** Railway Variables PostgreSQL biasanya tersedia sebagai `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`. Masukkan nilainya ke nama variabel `DB_*` di backend (gunakan Railway Reference Variables bila tersedia). Jangan gunakan `DATABASE_URL` kecuali konfigurasi aplikasi memang disiapkan untuk membaca URL tersebut.

## 4. Deploy React frontend

1. Tambahkan site di Netlify → Import from Git.
2. Pilih repository.
3. Biarkan konfigurasi build mengikuti `netlify.toml` di root repository (base directory `gridcloud-frontend`). Jika mengisi manual: Base directory `gridcloud-frontend`, Build command `npm run build`, Publish directory `build`.
4. Tambahkan environment variable:
   - `REACT_APP_API_URL=https://<domain-backend-railway>`
5. Netlify memakai Node.js 20 sesuai `.nvmrc`.
6. Deploy ulang setelah mengubah environment variable.

`netlify.toml` di root repository menetapkan base directory frontend, build command, publish directory, dan fallback SPA.

## 5. Uji

- Buka `https://<domain-backend-railway>/up`; hasil yang diharapkan adalah status sehat.
- Buka `https://<domain-backend-railway>/api/assignments`; hasil awal seharusnya array JSON kosong.
- Buka domain Netlify; pastikan daftar tugas dapat dimuat.
- Uji buat tugas, upload file, unduh file, dan notifikasi Telegram.
- Periksa log Railway jika migration, koneksi database, atau upload gagal.

## 6. Keamanan autentikasi dosen

Password dosen tidak lagi ditanam di frontend. Login diverifikasi backend melalui `LECTURER_PASSWORD`; backend menerbitkan bearer token bertanda tangan HMAC yang kedaluwarsa sesuai `LECTURER_TOKEN_TTL` (default 12 jam). Endpoint pembuatan, pengubahan, penghapusan, penutupan tugas, dan daftar pengumpulan dilindungi middleware `lecturer.auth`. Endpoint login dibatasi 5 percobaan per menit per alamat IP.

Wajib mengatur `LECTURER_PASSWORD` sebagai password kuat dan unik di Railway Variables. Jangan gunakan kembali password `admin`. Token disimpan di localStorage browser; gunakan HTTPS (domain Netlify dan Railway default menyediakan HTTPS). Untuk kebutuhan keamanan yang lebih tinggi, pertimbangkan Laravel Sanctum dengan token yang dapat dicabut dan audit akses dosen.

## Catatan volume

Volume hanya menyimpan file yang berada di `/app/storage/app/private/uploads`. Database tetap berada di PostgreSQL. Jangan menghapus atau mengganti volume setelah ada file pengumpulan penting. Backup volume dan database secara terpisah.
