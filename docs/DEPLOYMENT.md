# Panduan Deployment

Panduan ini menjelaskan cara menjalankan KampusEvent dari nol: memasang Docker, deploy pertama, akses publik, sampai memasang self-hosted runner agar CD berjalan otomatis.

Target deployment: **host Docker lokal (laptop/PC)**. Tidak diperlukan VPS, kartu kredit, atau akun cloud.

---

## 0. Prasyarat

| Kebutuhan | Rekomendasi |
|---|---|
| OS | Windows 11 64-bit (bisa juga macOS/Linux) |
| RAM | minimal 8 GB (disarankan 16 GB) |
| Disk | ± 5 GB kosong untuk Docker + image |
| Virtualisasi | aktif di BIOS/UEFI |
| Akses | Administrator (untuk memasang WSL2 & Docker Desktop) |
| Akun | GitHub |

Cek cepat di PowerShell:

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, OsVersion
(Get-CimInstance Win32_ComputerSystem).HypervisorPresent
```

---

## 1. Memasang WSL2

Buka **PowerShell sebagai Administrator**:

```powershell
wsl --install
```

Restart komputer bila diminta. Setelah restart:

```powershell
wsl --version
wsl --set-default-version 2
```

Jika `wsl --version` menampilkan versi, lanjut ke langkah berikutnya.

> Jika perintah gagal karena virtualisasi nonaktif, aktifkan **SVM Mode / AMD-V** (AMD) atau **Intel VT-x** di BIOS.

---

## 2. Memasang Docker Desktop

1. Unduh dari <https://www.docker.com/products/docker-desktop/>.
2. Jalankan installer, pilih **Use WSL 2 instead of Hyper-V**.
3. Setelah selesai, buka Docker Desktop dan tunggu sampai status **Engine running**.
4. Verifikasi di PowerShell:

```powershell
docker version
docker compose version
docker run --rm hello-world
```

Ketiga perintah harus berhasil. Jika `docker` tidak dikenali, tutup dan buka ulang terminal.

Pengaturan yang disarankan di Docker Desktop:

- **Settings → General → Start Docker Desktop when you sign in** (opsional).
- **Settings → Resources → WSL Integration** aktif untuk distro default.
- **Settings → Resources → Memory** minimal 4 GB.

---

## 3. Menyiapkan project

```powershell
cd "D:\Kuliah\Sem 7\Devops\UTS"

# salin konfigurasi
Copy-Item .env.example .env
notepad .env
```

Isi minimal yang harus diganti:

```dotenv
POSTGRES_PASSWORD=PasswordKuat123
DATABASE_URL=postgresql://kampusevent:PasswordKuat123@db:5432/kampusevent?schema=public
JWT_SECRET=<string acak minimal 32 karakter>
GHCR_OWNER=username-github-kalian
APP_PORT=80
```

Membuat string acak di PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

> Gunakan password **alfanumerik** agar `DATABASE_URL` tetap valid. Jika memakai karakter khusus, encode dengan URL encoding.

---

## 4. Deploy pertama (lokal)

```powershell
docker compose up -d --build
docker compose ps
```

Tunggu hingga ketiga container berstatus `healthy` (biasanya 30–60 detik karena migrasi + seed).

Buka <http://localhost> (atau `http://localhost:8080` bila `APP_PORT=8080`).

Periksa log bila ada masalah:

```powershell
docker compose logs -f --tail=100 backend
docker compose logs -f --tail=100 frontend
```

Contoh status yang benar:

```
NAME                  STATUS                    PORTS
kampusevent-backend   Up (healthy)              3000/tcp
kampusevent-db        Up (healthy)              5432/tcp
kampusevent-frontend  Up (healthy)              0.0.0.0:80->8080/tcp
```

---

## 5. Memberi akses publik (tunnel)

Aplikasi di laptop tidak dapat diakses dosen/pengguna lain hanya dengan `localhost`. Tunnel membuat koneksi keluar dari laptop ke internet, sehingga **tidak perlu membuka port router**.

### Opsi A — ngrok dengan domain statis (disarankan)

URL tetap sama setiap restart, cocok untuk link di laporan dan video.

1. Daftar gratis di <https://dashboard.ngrok.com/signup>.
2. Salin **Authtoken** dari halaman *Getting Started*.
3. Buka menu **Domains** → **Create Domain** (paket gratis menyediakan satu domain statis). Catat domain yang diberikan, misalnya `https://kampusevent-xxxx.ngrok-free.app`.
4. Isi `.env`:

```dotenv
COMPOSE_PROFILES=tunnel-static
NGROK_AUTHTOKEN=token-dari-dashboard
NGROK_URL=https://kampusevent-xxxx.ngrok-free.app
```

5. Jalankan:

```powershell
docker compose up -d
docker compose logs ngrok --tail=50
```

6. Buka domain tersebut. Pada kunjungan pertama ngrok menampilkan halaman peringatan gratis — klik **Visit Site**.

### Opsi B — ngrok URL acak

```dotenv
COMPOSE_PROFILES=tunnel
NGROK_AUTHTOKEN=token-dari-dashboard
```

URL acak terlihat di `docker compose logs ngrok` atau dashboard lokal <http://localhost:4040>.

### Opsi C — Cloudflare Quick Tunnel (tanpa akun)

```dotenv
COMPOSE_PROFILES=tunnel-cf
```

```powershell
docker compose up -d
docker compose logs cloudflared | Select-String "trycloudflare.com"
```

URL berbentuk `https://xxxx.trycloudflare.com` dan **berubah setiap container dijalankan ulang**. Cocok untuk rekaman video, kurang cocok untuk link jangka panjang.

> Tunnel adalah container terpisah, jadi penggunaan container tetap terlihat: `docker compose ps` menampilkan 4 container saat tunnel aktif.

---

## 6. Menyiapkan self-hosted runner

Runner inilah yang menjalankan job **CD** langsung di laptop.

### 6.1 Membuat repository GitHub

1. Buat repository baru, misalnya `kampusevent` (disarankan **public**).
2. Dari folder project:

```powershell
git init
git add .
git commit -m "feat: KampusEvent dengan Docker Compose dan CI/CD"
git branch -M main
git remote add origin https://github.com/<username>/kampusevent.git
git push -u origin main
```

Tunggu workflow **CI** selesai dan hijau.

### 6.2 Mendaftarkan runner

1. Buka repository → **Settings → Actions → Runners → New self-hosted runner**.
2. Pilih **Windows / x64**. Salin perintah yang ditampilkan (versi runner bisa berbeda).

Contoh (ganti `<VERSI>` dan `<TOKEN>`):

```powershell
mkdir C:\actions-runner-kampusevent
cd C:\actions-runner-kampusevent
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v<VERSI>/actions-runner-win-x64-<VERSI>.zip -OutFile runner.zip
Expand-Archive -Path runner.zip -DestinationPath .
.\config.cmd --url https://github.com/<username>/kampusevent --token <TOKEN> --name kampusevent-laptop --labels kampusevent --work _work
```

3. Jalankan runner:

```powershell
.\run.cmd
```

Biarkan jendela ini terbuka. Pastikan Docker Desktop sudah berjalan.

4. Di GitHub, runner harus muncul dengan label `self-hosted`, `Windows`, `X64`, dan `kampusevent`, status **Idle**.

> Jalankan runner secara interaktif (bukan sebagai Windows Service) agar dapat mengakses Docker Desktop milik user yang sedang login. Jika ingin sebagai service, instal dengan akun user yang sama: `.\svc.cmd install`.

### 6.3 Mengisi secrets & variables

**Settings → Secrets and variables → Actions**.

Secrets:

| Nama | Nilai |
|---|---|
| `POSTGRES_PASSWORD` | password database produksi |
| `JWT_SECRET` | string acak 32+ karakter |
| `NGROK_AUTHTOKEN` | token ngrok (opsional) |

Variables:

| Nama | Nilai contoh |
|---|---|
| `APP_PORT` | `80` |
| `COMPOSE_PROFILES` | `tunnel-static` |
| `NGROK_URL` | `https://kampusevent-xxxx.ngrok-free.app` |
| `POSTGRES_DB` | `kampusevent` |
| `POSTGRES_USER` | `kampusevent` |

Opsional: **Settings → Environments → New environment `production`** dan tambahkan *required reviewers* bila ingin deploy butuh persetujuan manual.

---

## 7. Deploy otomatis (CD)

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Alur yang terjadi:

1. Workflow **CD → Build image rilis** membuat image `v1.0.0`, `1.0`, `sha`, dan `latest`.
2. Workflow **CD → Deploy** berjalan di runner laptop:
   - menulis `.env` dari secrets,
   - `docker compose pull`,
   - `docker compose up -d`,
   - smoke test `http://localhost/healthz`.
3. Aplikasi dapat diakses melalui URL tunnel.

Setelah itu, setiap ada perubahan yang ingin dirilis cukup membuat tag baru (`v1.1.0`, `v1.2.0`, dst).

---

## 8. Rollback

**Actions → CD → Run workflow**, isi `image_tag` dengan versi sebelumnya (mis. `v0.9.0` atau sha pendek), lalu jalankan.

Atau secara manual di laptop:

```powershell
$env:IMAGE_TAG = "v0.9.0"
docker compose pull
docker compose up -d
```

Data di volume `kampusevent-pgdata` tidak terhapus.

---

## 9. Perintah operasional

```powershell
docker compose ps                        # status & health
docker compose logs -f --tail=100        # log semua service
docker compose logs -f backend           # log backend saja
docker compose restart backend           # restart satu service
docker compose exec db psql -U kampusevent -d kampusevent   # masuk ke psql
docker compose exec backend node prisma/seed.js              # seed ulang
.\scripts\smoke-test.ps1                 # cek kesehatan aplikasi
.\scripts\backup-db.ps1                  # backup database ke folder backups/
docker compose down                      # stop (data aman)
docker compose down -v                   # stop + hapus data (reset total)
```

---

## 10. Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| `docker: command not found` | Docker Desktop belum jalan | Buka Docker Desktop, tunggu *Engine running* |
| `port is already allocated` | Port 80 dipakai aplikasi lain | Set `APP_PORT=8080`, up ulang |
| Backend `unhealthy` | Password DB tidak cocok dengan volume lama | `docker compose down -v` lalu up ulang |
| `P1001: Can't reach database server` | Backend start sebelum DB siap | Pastikan healthcheck DB aktif; tunggu lalu `docker compose restart backend` |
| Frontend 502 saat `/api` | Backend belum sehat | `docker compose ps`; restart backend |
| Runner offline | `run.cmd` tertutup / PC restart | Jalankan `run.cmd` lagi |
| Deploy gagal `unauthorized` | `.env`/secret salah, image private | Cek secret; pastikan package GHCR dapat dibaca `GITHUB_TOKEN` |
| Smoke test gagal | Container belum siap dalam 90 detik | Cek `docker compose logs`; deploy ulang |
| Tunnel tidak muncul | Profile belum diisi | Pastikan `COMPOSE_PROFILES` dan token benar |
| Halaman ngrok peringatan | Kebijakan free tier | Klik **Visit Site**; untuk demo bisa pakai Cloudflare Quick Tunnel |

---

## 11. Alternatif: deploy ke VPS

Pipeline saat ini memakai self-hosted runner. Bila nanti tersedia VPS, CD dapat diubah tanpa menyentuh aplikasi:

1. Buat job `deploy` dengan `runs-on: ubuntu-latest`.
2. Gunakan `appleboy/ssh-action` (atau `ssh` biasa) untuk:
   - menyalin `docker-compose.yml` dan `.env`,
   - `docker login ghcr.io`,
   - `docker compose pull && docker compose up -d`.
3. Tambahkan secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`.

Container, image, dan compose yang sama dipakai, sehingga tidak ada perubahan pada aplikasi.
