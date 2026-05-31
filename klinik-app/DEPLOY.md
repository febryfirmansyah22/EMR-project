# Deploy Guide — Klinik App ke VPS Sumopod

## Prasyarat
- VPS Ubuntu 22.04/24.04
- Domain sudah pointing ke IP VPS (A record)
- Akses SSH ke VPS (root atau sudo user)

---

## Langkah 1 — Pointing Domain

Di DNS manager domain kamu, tambahkan A record:

```
Type: A
Name: klinik        (atau @ jika mau root domain)
Value: IP_VPS_KAMU
TTL: 300
```

Tunggu 1–5 menit sampai propagasi DNS selesai. Cek dengan:
```bash
nslookup klinik.elzahrawimedikacihaurbeuti.com
```

---

## Langkah 2 — Clone Repo di VPS

SSH ke VPS lalu:

```bash
ssh root@IP_VPS

# Install git jika belum ada
apt-get update && apt-get install -y git

# Clone repo
git clone https://github.com/febryfirmansyah22/EMR-project.git
cd EMR-project/klinik-app
```

---

## Langkah 3 — Buat File .env

```bash
cp .env.prod.example .env
nano .env
```

Isi nilai berikut:
```env
DOMAIN=klinik.namadomain.com      # ← domain kamu yang sebenarnya
DB_DATABASE=klinik_db
DB_USERNAME=klinik_user
DB_PASSWORD=PasswordKuatKamu123!  # ← ganti dengan password kuat
CERTBOT_EMAIL=email@kamu.com      # ← email untuk notifikasi SSL
```

---

## Langkah 4 — Jalankan Deploy Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

Script ini otomatis:
1. Install Docker (jika belum ada)
2. Konfigurasi nginx dengan domain kamu
3. Request SSL certificate dari Let's Encrypt
4. Build semua Docker containers
5. Jalankan database migrations + seeder
6. Setup auto-renew SSL via cron

**Estimasi waktu: 5–10 menit** (tergantung kecepatan internet VPS)

---

## Langkah 5 — Akses Aplikasi

Buka browser: `https://klinik.namadomain.com`

Login pertama:
- Email: `admin@klinik.com`
- Password: `admin123`

**⚠️ Segera ganti password setelah login pertama!**

---

## Perintah Berguna

```bash
# Lihat status containers
docker compose -f docker-compose.prod.yml ps

# Lihat logs real-time
docker compose -f docker-compose.prod.yml logs -f

# Lihat logs spesifik service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart semua
docker compose -f docker-compose.prod.yml restart

# Stop semua
docker compose -f docker-compose.prod.yml down

# Update app (setelah git push)
./update.sh

# Masuk ke container Laravel
docker compose -f docker-compose.prod.yml exec app bash

# Jalankan artisan command
docker compose -f docker-compose.prod.yml exec app php artisan <command>

# Backup database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U klinik_user klinik_db > backup_$(date +%Y%m%d).sql
```

---

## Struktur Containers

| Container | Deskripsi | Port Internal |
|---|---|---|
| klinik_nginx | Reverse proxy + SSL termination | 80, 443 |
| klinik_app | Laravel API (PHP-FPM) | 9000 |
| klinik_frontend | Next.js frontend | 3000 |
| klinik_postgres | PostgreSQL 16 | 5432 |

---

## Troubleshooting

**SSL tidak bisa di-generate:**
- Pastikan domain sudah pointing ke IP VPS
- Pastikan port 80 tidak diblok firewall
- Cek: `curl http://klinik.elzahrawimedikacihaurbeuti.com`

**Container app tidak start:**
```bash
docker compose -f docker-compose.prod.yml logs app
```

**Database connection error:**
- Pastikan `DB_PASSWORD` di `.env` sama dengan yang di `backend/.env`
- Cek: `docker compose -f docker-compose.prod.yml exec postgres psql -U klinik_user -d klinik_db`

**502 Bad Gateway:**
- Next.js mungkin belum selesai build
- Tunggu 1–2 menit lalu refresh
- Cek: `docker compose -f docker-compose.prod.yml logs frontend`
