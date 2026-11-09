# Naskah Video (12–13 menit)

Video wajib memperlihatkan **implementasi deploy dengan container** dan **penjelasan CI/CD**. Naskah ini membagi waktu, menentukan siapa berbicara, dan menyebutkan apa yang harus tampil di layar.

Durasi target: **12 menit 30 detik** (batas tugas 5–15 menit).

---

## Sebelum merekam — checklist

**Perangkat & layanan**

- [ ] Docker Desktop berjalan (`docker version` berhasil).
- [ ] `docker compose ps` menunjukkan 3 container `healthy` (+ tunnel bila dipakai).
- [ ] Runner GitHub berstatus **Idle** (Settings → Actions → Runners).
- [ ] URL tunnel aktif dan aplikasi bisa dibuka.
- [ ] Sudah login ke GitHub di browser, tab **Actions** dan **Packages** terbuka.
- [ ] Akun demo tersedia: `admin@kampus.ac.id / Admin123!`, `budi@kampus.ac.id / Mahasiswa123!`.

**Pengaturan rekaman**

- [ ] Resolusi 1920×1080, font terminal minimal 16 pt.
- [ ] Notifikasi Windows dimatikan (Focus Assist).
- [ ] Bookmark bar disembunyikan agar rapi.
- [ ] Mikrofon diuji 10 detik.
- [ ] Data event sudah ada (seed), minimal 4 event.
- [ ] Satu rilis `v1.0.0` sudah pernah sukses (agar demo CD tidak menunggu lama).

**Jangan tampilkan di layar**

- File `.env` yang berisi password asli.
- Halaman GitHub Secrets.
- Token ngrok/runner.

---

## Struktur waktu

| Waktu | Segmen | Penanggung jawab |
|---|---|---|
| 00:00–00:50 | Pembuka & perkenalan | Anggota 5 (Dokumentasi) |
| 00:50–02:30 | Demo aplikasi | Anggota 3 (Frontend) |
| 02:30–04:00 | Arsitektur 3 container | Anggota 1 (DevOps Lead) |
| 04:00–06:00 | Bedah Dockerfile & Compose | Anggota 2 (Backend) + Anggota 4 (DB) |
| 06:00–07:15 | Menjalankan container | Anggota 1 |
| 07:15–09:15 | CI (GitHub Actions) | Anggota 1 + Anggota 4 |
| 09:15–11:15 | CD & rollback | Anggota 1 |
| 11:15–12:30 | Penutup, kendala, pembelajaran | Semua / Anggota 5 |

---

## Segmen 1 — Pembuka (00:00–00:50)

**Layar:** halaman utama aplikasi, lalu slide judul berisi nama aplikasi dan anggota.

**Poin bicara:**

- Salam dan perkenalan kelompok.
- Nama aplikasi: **KampusEvent**.
- Tujuan: memenuhi tugas UTS DevOps — deploy aplikasi berbasis container dengan CI/CD.
- Sebutkan pembagian peran singkat.

**Contoh kalimat:**

> "Kami kelompok 5. Aplikasi yang kami bangun adalah KampusEvent, platform manajemen dan registrasi event kampus. Aplikasi ini terdiri dari tiga container: frontend React, backend Express, dan database PostgreSQL. Seluruh proses build dan deploy dijalankan otomatis dengan GitHub Actions."

---

## Segmen 2 — Demo aplikasi (00:50–02:30)

**Layar:** browser ke URL aplikasi.

**Langkah yang diperlihatkan:**

1. Halaman daftar event — tunjukkan kartu event, kuota, filter, dan pencarian.
2. Login sebagai mahasiswa (`budi@kampus.ac.id`).
3. Buka satu event → **Daftar sekarang** → tunjukkan pesan sukses dan kuota bertambah.
4. Buka **Registrasi Saya** → tunjukkan data registrasi.
5. Logout, login sebagai admin.
6. **Dashboard** → tunjukkan statistik.
7. **Buat Event** → isi form singkat → simpan → event muncul di tabel.
8. Buka **Peserta** pada event → tunjukkan daftar peserta.

**Poin bicara:**

- Jelaskan perbedaan peran mahasiswa dan admin.
- Sebutkan bahwa data tersimpan di PostgreSQL dan tetap ada setelah container dibuat ulang.

---

## Segmen 3 — Arsitektur (02:30–04:00)

**Layar:** `docs/ARSITEKTUR.md` (diagram Mermaid dirender) atau slide.

**Poin bicara:**

1. Tiga container wajib: `frontend`, `backend`, `db`.
2. Browser hanya berkomunikasi dengan Nginx; Nginx mem-proxy `/api` ke backend → satu origin, tanpa CORS.
3. Dua network:
   - `edge`: frontend + backend,
   - `data`: backend + db, `internal: true` sehingga database tidak bisa diakses dari internet.
4. Volume `kampusevent-pgdata` untuk persistensi.
5. Healthcheck berantai: db → backend → frontend, dengan `depends_on: service_healthy`.
6. Container keempat opsional: tunnel untuk akses publik.

**Tips visual:** buka `docker network ls` dan `docker volume ls` di terminal, tunjukkan nama network/volume milik project.

---

## Segmen 4 — Bedah Dockerfile & Compose (04:00–06:00)

**Layar:** file `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `frontend/nginx.conf`.

**Poin bicara backend:**

- Multi-stage: `deps` → `build` → `runtime`.
- `prisma generate` dan kompilasi TypeScript.
- Runtime hanya berisi dependency produksi.
- `USER node` → non-root.
- Entrypoint menjalankan `prisma migrate deploy` lalu aplikasi.
- Healthcheck memakai `fetch` bawaan Node 20.

**Poin bicara frontend:**

- Stage build Vite menghasilkan aset statis.
- Stage runtime memakai `nginx-unprivileged` (non-root, port 8080).
- `docker-compose.yml` memetakan `${APP_PORT}:8080`.

**Poin bicara Nginx:**

- `location /api/` → proxy ke `backend:3000`.
- `try_files ... /index.html` untuk SPA.
- Cache panjang untuk `/assets/`.

**Poin bicara Compose:**

- `image:` + `build:` → lokal memakai `--build`, server memakai `pull`.
- `.env` interpolation untuk kredensial.
- `restart: unless-stopped`, `mem_limit`, rotasi log.
- `depends_on` dengan kondisi sehat.

---

## Segmen 5 — Menjalankan container (06:00–07:15)

**Layar:** terminal di folder project.

```powershell
docker compose down
docker compose up -d --build
docker compose ps
docker compose logs --tail=40 backend
```

**Poin bicara:**

- Tunjukkan proses build dua image dan pull image PostgreSQL.
- Setelah selesai, tunjukkan **3 container healthy**.
- Tunjukkan port hanya frontend yang terbuka (`0.0.0.0:80->8080`), backend dan db tanpa port host.
- Buka `http://localhost` → aplikasi tetap berjalan dan data lama masih ada (bukti volume).

**Kalimat kunci:**

> "Perhatikan bahwa hanya container frontend yang mengekspos port ke host. Backend dan database hanya bisa diakses melalui network internal Docker."

---

## Segmen 6 — CI (07:15–09:15)

**Layar:** VS Code, terminal, lalu browser GitHub Actions.

1. Tunjukkan `.github/workflows/ci.yml` sekilas: job `backend-test`, `frontend-test`, `docker-validate`, `build-push`, `security-scan`.
2. Lakukan perubahan kecil, misalnya ubah teks di `frontend/src/pages/EventList.tsx`.
3. Commit & push:

```powershell
git add .
git commit -m "docs: perbarui teks hero"
git push origin main
```

4. Buka **Actions → CI**.
5. Tunjukkan:
   - job backend test dengan **service container PostgreSQL**,
   - job frontend test & build,
   - validasi compose + Hadolint,
   - build & push image multi-arch,
   - hasil Trivy.
6. Buka **Packages** → tunjukkan image `kampusevent-frontend` dan `kampusevent-backend` dengan tag `sha` dan `latest`.

**Poin bicara:**

- CI berjalan di runner GitHub (`ubuntu-latest`), bukan di laptop.
- Integration test memakai database sungguhan (service container).
- Image disimpan di GHCR agar host deploy tinggal menarik.

---

## Segmen 7 — CD & rollback (09:15–11:15)

**Layar:** terminal + GitHub Actions + browser aplikasi.

1. Tunjukkan `cd.yml` sekilas: trigger tag, build rilis, deploy di self-hosted runner, smoke test.
2. Tunjukkan runner **Idle** di Settings → Actions → Runners.
3. Buat tag:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

4. Buka **Actions → CD**.
5. Tunjukkan:
   - build image rilis (tag `v1.0.0`, `1.0`, `latest`),
   - job deploy berjalan di runner `kampusevent`,
   - langkah menulis `.env`, `docker compose pull`, `up -d`, smoke test hijau.
6. Buka aplikasi dari URL tunnel → tunjukkan perubahan teks dari segmen CI sudah live.
7. Demonstrasi rollback:

**Actions → CD → Run workflow** → `image_tag` = versi sebelumnya → jalankan.

8. Setelah selesai, refresh aplikasi → tunjukkan versi lama kembali.
9. Tunjukkan `docker compose ps` dan `docker compose logs --tail=20 backend`.

**Poin bicara:**

- Deploy tidak menyalin file aplikasi; host hanya menarik image dari registry.
- `docker compose up -d` hanya membuat ulang container yang berubah, database tetap hidup.
- Smoke test membuat deploy gagal otomatis bila aplikasi tidak sehat.
- Rollback cukup mengganti tag image.

---

## Segmen 8 — Penutup (11:15–12:30)

**Layar:** slide ringkasan / halaman aplikasi.

**Poin bicara:**

- Ringkasan yang sudah dicapai:
  - 3 container (frontend, backend, database) + tunnel,
  - CI: test, validasi, build, push, scan,
  - CD: rilis otomatis, smoke test, rollback.
- Kendala yang dihadapi dan solusinya, misalnya:
  - port 80 bentrok → `APP_PORT`,
  - runner harus interaktif agar bisa mengakses Docker Desktop,
  - URL tunnel berubah → memakai domain statis ngrok.
- Pembelajaran: pentingnya healthcheck, urutan start, dan pemisahan network.
- Ucapan terima kasih dan penutup.

---

## Perintah cadangan (cheat sheet)

```powershell
# Status & kesehatan
docker compose ps
docker compose logs -f --tail=100 backend

# Deploy ulang manual
docker compose pull
docker compose up -d --remove-orphans

# Seed ulang data demo
docker compose exec backend node prisma/seed.js

# Rilis
git tag v1.1.0
git push origin v1.1.0

# Rollback manual
$env:IMAGE_TAG = "v1.0.0"
docker compose pull
docker compose up -d
```

---

## Setelah merekam

- [ ] Durasi 5–15 menit.
- [ ] Ketiga container terlihat di layar.
- [ ] CI dan CD terlihat berjalan (bukan hanya slide).
- [ ] URL aplikasi terlihat jelas.
- [ ] Tidak ada password/token yang terbaca.
- [ ] Video diunggah (YouTube unlisted / Google Drive) dan **link dimasukkan ke laporan**.
