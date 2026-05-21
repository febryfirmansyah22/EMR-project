# OMARA EMR — Claude Code Context

## Tentang Proyek
OMARA EMR adalah sistem rekam medis elektronik berbasis web untuk klinik umum, klinik pratama, dan praktik dokter. Menggantikan proses manual dengan sistem digital yang cepat, aman, dan mudah dilacak.

**PRD Lengkap:** `docs/PRD.md`

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 11 |
| Frontend | Next.js 14 (App Router) |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Queue | Redis + Laravel Horizon |
| Storage | MinIO (self-hosted) |
| Auth | JWT + Refresh Token |
| Styling | Tailwind CSS |
| API | RESTful JSON API |

---

## Struktur Direktori

```
omara-emr/
├── backend/          # Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Middleware/
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
├── frontend/         # Next.js 14
│   ├── app/
│   ├── components/
│   └── lib/
└── docs/
    ├── PRD.md
    ├── ERD.md
    └── API.md
```

---

## Role Pengguna

| Role | Akses Utama |
|---|---|
| super_admin | Semua fitur + audit log + user management |
| admin_klinik | Pasien, pendaftaran, antrean |
| perawat | Pemeriksaan awal |
| dokter | SOAP, diagnosis, tindakan, resep |
| farmasi | Resep, stok obat |
| kasir | Tagihan, pembayaran |
| owner | Laporan (read-only) |

---

## ⚠️ ATURAN WAJIB — JANGAN PERNAH DILANGGAR

### Security
1. **Semua endpoint wajib middleware auth** — tidak ada endpoint publik kecuali login
2. **Semua input wajib divalidasi** menggunakan Laravel Form Request
3. **Parameterized query wajib** — tidak boleh raw query string concatenation
4. **Tidak boleh ada secret/credential di dalam kode** — semua pakai `.env`
5. **File `.env` tidak boleh di-commit ke git**
6. **Password wajib di-hash** menggunakan bcrypt minimum cost 12
7. **HTTPS wajib** di semua environment selain local

### Enkripsi Data Sensitif
Kolom berikut **wajib dienkripsi** di database menggunakan Laravel Encryption:
- `patients.nik`
- `patients.phone`
- `patients.emergency_contact`
- `patients.address`
- `medical_records.soap_subjective`
- `medical_records.soap_objective`
- `medical_records.soap_assessment`
- `medical_records.soap_plan`
- `medical_records.doctor_notes`

### Audit Log — WAJIB di Setiap CRUD
Setiap create, update, delete **wajib** mencatat ke tabel `audit_logs`:
```
- user_id, user_name, user_role
- action (create/read/update/delete)
- resource (nama model/tabel)
- resource_id
- old_data (JSON, untuk update/delete)
- new_data (JSON, untuk create/update)
- ip_address
- user_agent
- timestamp
```
Tabel `audit_logs` **tidak boleh bisa diedit atau dihapus** oleh siapapun.

---

## Urutan Pengembangan (Ikuti Urutan Ini)

```
[1] Setup & Infrastruktur
    ├── Inisialisasi Laravel + Next.js
    ├── Konfigurasi PostgreSQL + Redis
    └── Setup .env dan struktur folder

[2] Fondasi Security (SELESAIKAN DULU SEBELUM FITUR BISNIS)
    ├── Migration: tabel users, roles, permissions
    ├── Migration: tabel audit_logs
    ├── Authentication (login, logout, refresh token)
    ├── RBAC middleware
    ├── Enkripsi helper/service
    └── Audit log middleware (otomatis log semua request)

[3] Master Data
    ├── Poli, Dokter, Perawat
    ├── Diagnosis (ICD-10 dasar)
    ├── Tindakan + tarif
    └── Obat + satuan

[4] Modul Pasien
    ├── CRUD data pasien
    └── Nomor rekam medis otomatis

[5] Pendaftaran & Antrean
    ├── Kunjungan pasien
    └── Status antrean

[6] Pemeriksaan
    ├── Pemeriksaan awal perawat
    └── SOAP dokter

[7] Resep & Farmasi
    ├── Resep elektronik
    └── Stok obat

[8] Kasir & Pembayaran
    ├── Tagihan otomatis
    └── Invoice PDF

[9] Laporan
    └── Dashboard + export Excel/PDF
```

---

## Konvensi Kode

### Laravel (Backend)
- Gunakan **Service Layer** — logic bisnis di `app/Services/`, bukan di Controller
- Controller hanya handle request/response
- Gunakan **Policy** untuk otorisasi per resource
- Nama migration: `create_[nama_tabel]_table`
- Semua response API menggunakan format:
```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

### Next.js (Frontend)
- Gunakan App Router
- Server Components untuk fetch data
- Client Components hanya jika perlu interaktivitas
- Semua API call melalui `/lib/api.ts`
- Token disimpan di httpOnly cookie — bukan localStorage

---

## Status Saat Ini

**Fase:** SELESAI — Backend API + Frontend lengkap
**Sedang Dikerjakan:** —
**Selesai:**
- [x] Setup infrastruktur (Laravel 13, Next.js 14, docker-compose, jwt-auth, shadcn/ui)
- [x] Fondasi security (JWT auth, RBAC middleware, AuditLog immutable, migration, seeder super_admin)
- [x] Master data (Poli, Dokter, Diagnosis ICD-10, Tindakan, Obat — 25 endpoint tested)
- [x] Modul pasien (CRUD + enkripsi NIK/phone/address/emergency_contact + auto no. RM + audit log)
- [x] Pendaftaran & antrean (kunjungan, nomor antrean per poli/hari, 8 status, transisi RBAC, board antrean)
- [x] Pemeriksaan (vital signs perawat + SOAP dokter terenkripsi + diagnosis/tindakan pivot)
- [x] Resep & farmasi (resep elektronik, antrian farmasi, dispensing otomatis, stock movement, price snapshot)
- [x] Kasir & pembayaran (invoice auto-generate, diskon, kembalian, BPJS, visit auto-selesai)
- [x] Laporan (dashboard metrics, laporan kunjungan/pendapatan/stok, export CSV)
- [x] Frontend Next.js (19 halaman: login, dashboard, pasien, kunjungan, farmasi, kasir, laporan, master data)

**Catatan Fase 1:**
- Laravel yang terinstall adalah v13 (latest 2026), bukan v11 — lebih baru, support lebih panjang
- PHP 8.3 + ekstensi: openssl, pdo_pgsql, mbstring, zip, curl, fileinfo, intl, sodium aktif
- PHPRC env var di-set ke path WinGet PHP agar php.ini dibaca dengan benar
- JWT secret sudah di-generate di backend/.env
- Semua route API di-prefix /api/v1

**Catatan Fase 3:**
- Base Controller perlu extend `Illuminate\Routing\Controller` dan use `AuthorizesRequests` (Laravel 13 tidak include otomatis)
- DiagnosisRequest gunakan `Rule::unique()->ignore($id)` bukan string interpolation (PostgreSQL strict bigint)
- Kolom `category` ditambah ke `diagnoses` via alter migration terpisah (tidak fresh migrate)
- 25 endpoint master data tested dan passing: polis, doctors, diagnoses, actions, medicines

**Catatan Fase 4:**
- Enkripsi kolom sensitif pakai Laravel `encrypted` cast: NIK, phone, address, emergency_contact
- `emergency_contact` pakai `encrypted:array` cast — otomatis serialize JSON + encrypt
- Nomor RM format: RM-YYYY-NNNNN, generated dengan `lockForUpdate()` anti race condition
- Destroy pasien = deactivate (is_active=false), bukan hard delete — data historis terjaga
- `ForceJsonResponse` middleware ditambah ke api group agar validasi error selalu return JSON (bukan HTML redirect)
- Search via nama/no. RM/email saja — NIK tidak bisa dicari langsung karena dienkripsi

**Catatan Fase 5:**
- Visit number format: KNJ-YYYYMMDD-NNNNN (global per hari)
- Queue number: integer per poli per hari, lockForUpdate untuk anti race condition
- PostgreSQL tidak izinkan `lockForUpdate()` + `max()` — pakai `orderByDesc + first()` sebagai gantinya
- 8 status kunjungan sesuai frontend constants, transisi divalidasi di Model (`canTransitionTo`)
- Route `GET /visits/queue-today` harus didaftarkan SEBELUM `apiResource` agar tidak ditimpa param `{visit}`
- Policy `updateStatus` berbeda per role: perawat, dokter, farmasi, kasir hanya bisa transisi di lane-nya

**Catatan Fase 6:**
- 4 tabel: examinations, medical_records, record_diagnoses (pivot), record_actions (pivot)
- SOAP dienkripsi dengan `encrypted` cast — raw DB = ciphertext base64, model mendekripsi otomatis
- Audit log SOAP hanya menyimpan flag `has_subjective/objective/assessment/plan` — isi SOAP tidak disimpan ulang sebagai plaintext di log
- `User::doctor()` HasOne ditambahkan agar `auth()->user()->doctor` bisa diakses di MedicalRecordService
- Auto-advance status: exam perawat → `menunggu_dokter`; SOAP dokter → `sedang_diperiksa` (dari menunggu_dokter)
- `sessions` table tidak ada (Laravel 13 default) — tidak mempengaruhi JWT auth tapi bisa terlog sebagai error

**Catatan Fase 7:**
- Migration order penting — `prescription_items` memiliki FK ke `prescriptions`, jadi harus urutan timestamp berbeda (bukan sama)
- `syncItems()` pakai strategi delete-all + recreate (bukan upsert) — lebih simpel untuk data pivot seperti ini
- Stock dispensing atomik: validasi semua item dulu → kurangi stok → catat StockMovement, semua dalam 1 transaction
- Auto-advance visit ke `menunggu_pembayaran` hanya jika visit sedang `menunggu_obat` saat resep selesai
- Price snapshot di `unit_price` & `subtotal` item resep — histori tagihan tidak terpengaruh perubahan harga master

**Catatan Fase 9:**
- Laporan tidak pakai model-based Policy — pakai `Gate::define` karena tidak ada resource tunggal yang dilindungi
- `view-dashboard`: semua role aktif; `view-reports`: super_admin, admin_klinik, kasir, owner; `export-reports`: super_admin, admin_klinik, owner
- Export CSV native PHP (tidak perlu maatwebsite/excel) — response Content-Type: text/csv + Content-Disposition attachment
- Route `visits/export` harus didaftarkan SEBELUM `visits` agar tidak dianggap route `visits/{id}`
- Dashboard `last_7_days` dihitung with `subDays()` loop — ringan karena hanya 7 query kecil
- Revenue grouping pakai PostgreSQL `TO_CHAR(paid_at, 'YYYY-MM-DD')` / `YYYY-MM` — tidak bisa pakai SQLite
- Stok menipis ditentukan: `stock <= min_stock` (bukan `stock < min_stock`) — sama dengan logika frontend alert

**Catatan Fase 8:**
- Invoice auto-dibuat saat VisitService mengubah status ke `menunggu_pembayaran` — tidak perlu endpoint create manual
- InvoiceService diinjeksi ke VisitService lewat constructor (dependency injection Laravel)
- Invoice idempotent: `createForVisit()` cek dulu apakah sudah ada, hindari duplikat
- Item invoice diambil dari: `record_actions` (tindakan) + `prescription_items` di resep `selesai` (obat)
- BPJS/asuransi: validasi `payment_amount >= total` hanya berlaku untuk tunai/debit/kredit — BPJS boleh 0
- Diskon bisa diberikan saat pembayaran, bukan saat invoice dibuat — fleksibel untuk kasir
- Visit auto-advance ke `selesai` saat invoice `lunas` — menggunakan `Visit::STATUS_MENUNGGU_PEMBAYARAN` check

**Catatan Fase Frontend:**
- shadcn v4 dengan style `base-nova` menggunakan `@base-ui/react` primitives (bukan @radix-ui)
- Auth state dikelola via TanStack Query hook `useAuth()` — tidak ada Zustand store terpisah
- Token disimpan di cookie `auth_token` (js-cookie), dibaca oleh middleware.ts untuk route protection
- Export CSV menggunakan `fetch()` + `createObjectURL()` dengan Bearer token di header — tidak via window.open (tidak bisa kirim auth header)
- `types/medical.ts` file lama masih ada tapi tidak digunakan — field names berbeda dengan backend final (gunakan `types/visit.ts`)
- `lib/constants.ts` sempat ada duplicate `export type Role` — sudah dihapus
- Prescription creation: `/kunjungan/[id]/resep/baru` (hanya dokter saat status `sedang_diperiksa`)
- Visit detail page (`/kunjungan/[id]`) menggunakan role-based tab visibility: Info, Pemeriksaan, SOAP, Resep, Tagihan
- Status transition buttons di visit detail berubah kontekstual sesuai role + status saat ini
- Dispensing resep dilakukan di `/farmasi/[id]` via `POST /prescriptions/{id}/dispense`

---

## Keputusan Arsitektur

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-05-20 | Backend Laravel 13 (bukan 11) | Latest stable Mei 2026, support lebih panjang |
| 2026-05-20 | Frontend Next.js 14.2 | SSR untuk performa, App Router untuk struktur |
| 2026-05-20 | PostgreSQL via Docker | ACID compliance penting untuk data medis |
| 2026-05-20 | JWT via php-open-source-saver/jwt-auth | Fork aktif yang support Laravel 13 |
| 2026-05-20 | Redis via predis/predis | Cache + Queue driver, tanpa ekstensi PHP native |
| 2026-05-20 | MinIO via flysystem-aws-s3-v3 | Self-hosted S3-compatible storage |
| 2026-05-20 | Semua route API prefix /api/v1 | Versioning API untuk backward compat |

---

## Catatan Compliance

- UU Kesehatan No. 17 Tahun 2023
- UU PDP (Perlindungan Data Pribadi) No. 27 Tahun 2022
- Permenkes tentang Rekam Medis Elektronik
- Data pasien tidak boleh keluar dari server tanpa enkripsi
