# Product Requirements Document
# OMARA EMR
## Electronic Medical Record System untuk Klinik

**Versi:** 1.0
**Status:** Draft
**Produk:** OMARA EMR
**Kategori:** Sistem Rekam Medis Elektronik Klinik
**Target Pengguna:** Klinik umum, klinik pratama, praktik dokter, dan fasilitas rawat jalan

---

## 1. Ringkasan Produk

**OMARA EMR** adalah sistem rekam medis elektronik berbasis web yang dirancang untuk membantu klinik mengelola data pasien, pendaftaran, antrean, pemeriksaan dokter, resep, farmasi, pembayaran, dan laporan operasional secara digital.

Sistem ini bertujuan menggantikan proses manual berbasis kertas dengan sistem yang lebih cepat, aman, rapi, dan mudah dilacak.

Produk ini cocok digunakan oleh:
- Klinik umum
- Klinik pratama
- Praktik dokter mandiri
- Klinik rawat jalan
- Klinik perusahaan
- Klinik keluarga

---

## 2. Latar Belakang

Banyak klinik masih menghadapi masalah dalam pengelolaan rekam medis dan operasional harian:

1. Data pasien masih dicatat secara manual.
2. Berkas rekam medis sulit dicari saat pasien kontrol ulang.
3. Riwayat diagnosis dan obat tidak terdokumentasi dengan baik.
4. Risiko kehilangan atau kerusakan dokumen tinggi.
5. Data antarunit klinik tidak terintegrasi.
6. Laporan kunjungan, obat, diagnosis, dan pendapatan masih dibuat manual.
7. Kontrol akses terhadap data pasien belum optimal.

---

## 3. Tujuan Produk

1. Mempercepat proses pendaftaran pasien.
2. Mempermudah pencarian data pasien lama.
3. Membantu dokter mencatat pemeriksaan secara sistematis.
4. Menyimpan riwayat medis pasien secara digital.
5. Mengintegrasikan alur kerja admin, perawat, dokter, farmasi, dan kasir.
6. Mengurangi penggunaan kertas.
7. Membantu klinik membuat laporan operasional secara otomatis.
8. Meningkatkan keamanan dan keterlacakan akses data pasien.
9. Menyiapkan fondasi integrasi dengan sistem kesehatan nasional di masa depan.

---

## 4. Target Pengguna

| Role | Kebutuhan Utama |
|---|---|
| Super Admin | Mengelola seluruh sistem, user, role, master data, dan audit log |
| Admin Klinik | Mengelola data pasien, pendaftaran, antrean, dan jadwal kunjungan |
| Perawat | Mencatat keluhan awal dan tanda vital pasien |
| Dokter | Melihat riwayat medis, mencatat SOAP, diagnosis, tindakan, dan resep |
| Farmasi | Melihat resep, menyiapkan obat, dan mengelola stok |
| Kasir | Membuat tagihan dan mencatat pembayaran |
| Owner/Kepala Klinik | Melihat laporan kunjungan, pelayanan, obat, dan pendapatan |

---

## 5. Ruang Lingkup Produk

### 5.1 In Scope (MVP)

1. Login dan manajemen role
2. Master data pasien
3. Pendaftaran kunjungan pasien
4. Antrean pasien
5. Pemeriksaan awal oleh perawat
6. Pemeriksaan dokter
7. Catatan SOAP
8. Diagnosis dan tindakan
9. Resep elektronik
10. Farmasi dan stok obat dasar
11. Kasir dan pembayaran
12. Laporan kunjungan
13. Laporan diagnosis
14. Laporan obat
15. Laporan pendapatan
16. Audit log
17. Backup data
18. Export PDF dan Excel

### 5.2 Out of Scope untuk MVP

1. Rawat inap
2. Bridging BPJS
3. Integrasi laboratorium eksternal
4. Integrasi radiologi
5. Telemedicine
6. Mobile app pasien
7. AI diagnosis
8. Sistem akuntansi lengkap
9. Integrasi SATUSEHAT penuh
10. Integrasi pembayaran otomatis

---

## 6. Fitur Utama

### 6.1 Authentication dan Role Management

**Role Pengguna:**
1. Super Admin
2. Admin Klinik
3. Perawat
4. Dokter
5. Farmasi
6. Kasir
7. Owner/Kepala Klinik

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| AUTH-001 | User dapat login menggunakan username/email dan password |
| AUTH-002 | Password wajib disimpan dalam bentuk terenkripsi |
| AUTH-003 | Sistem mendukung reset password |
| AUTH-004 | Sistem membatasi akses menu berdasarkan role |
| AUTH-005 | Sistem mencatat aktivitas login dan logout |
| AUTH-006 | Super Admin dapat membuat, mengubah, menonaktifkan, dan menghapus user |

**Acceptance Criteria:**
- User hanya dapat mengakses menu sesuai role
- User nonaktif tidak dapat login
- Sistem mencatat aktivitas login, logout, tambah data, ubah data, dan hapus data
- Password tidak tampil dalam bentuk teks asli di database

---

### 6.2 Modul Data Pasien

**Data Minimal Pasien:**

| Field | Keterangan |
|---|---|
| Nomor Rekam Medis | Nomor unik pasien |
| NIK | Nomor Induk Kependudukan |
| Nama Lengkap | Nama sesuai identitas |
| Jenis Kelamin | Laki-laki atau perempuan |
| Tanggal Lahir | Digunakan untuk menghitung usia |
| Alamat | Alamat domisili pasien |
| Nomor HP | Kontak pasien |
| Kontak Darurat | Kontak keluarga atau wali |
| Alergi | Riwayat alergi obat atau makanan |
| Riwayat Penyakit | Riwayat penyakit penting |
| Jenis Penjamin | Umum, asuransi, perusahaan, atau lainnya |

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| PAS-001 | Admin dapat menambah data pasien baru |
| PAS-002 | Sistem membuat nomor rekam medis otomatis |
| PAS-003 | Admin dapat mencari pasien berdasarkan nama, NIK, nomor RM, atau nomor HP |
| PAS-004 | Sistem mencegah duplikasi data berdasarkan NIK atau nomor RM |
| PAS-005 | Admin dapat mengubah data pasien |
| PAS-006 | Riwayat kunjungan pasien dapat dilihat dari profil pasien |

**Acceptance Criteria:**
- Admin dapat membuat data pasien baru dalam maksimal 2 menit
- Data pasien lama dapat ditemukan dalam maksimal 5 detik
- Sistem menampilkan peringatan jika NIK sudah terdaftar
- Setiap pasien memiliki nomor rekam medis unik

---

### 6.3 Modul Pendaftaran dan Antrean

**Status Antrean:**
1. Terdaftar
2. Menunggu pemeriksaan awal
3. Menunggu dokter
4. Sedang diperiksa
5. Menunggu obat
6. Menunggu pembayaran
7. Selesai
8. Batal

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| REG-001 | Admin dapat mendaftarkan pasien baru atau pasien lama |
| REG-002 | Admin dapat memilih poli atau layanan |
| REG-003 | Admin dapat memilih dokter tujuan |
| REG-004 | Sistem membuat nomor antrean otomatis |
| REG-005 | Sistem menampilkan daftar antrean berdasarkan status |
| REG-006 | Status antrean dapat diperbarui sesuai alur layanan |
| REG-007 | Dokter hanya melihat pasien yang masuk antreannya |

---

### 6.4 Modul Pemeriksaan Awal Perawat

**Data Pemeriksaan Awal:**

| Data | Keterangan |
|---|---|
| Keluhan Utama | Keluhan awal pasien |
| Tekanan Darah | Contoh: 120/80 mmHg |
| Suhu Tubuh | Dalam derajat Celsius |
| Nadi | Kali per menit |
| Respirasi | Kali per menit |
| Berat Badan | Dalam kilogram |
| Tinggi Badan | Dalam sentimeter |
| Saturasi Oksigen | Dalam persen |
| Catatan Perawat | Catatan tambahan |

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| NUR-001 | Perawat dapat input keluhan awal |
| NUR-002 | Perawat dapat input tanda vital |
| NUR-003 | Data pemeriksaan awal tampil di halaman dokter |
| NUR-004 | Sistem menyimpan riwayat tanda vital per kunjungan |
| NUR-005 | Sistem memberi indikator jika nilai tanda vital tidak normal |

---

### 6.5 Modul Pemeriksaan Dokter

**Format SOAP:**

| Komponen | Keterangan |
|---|---|
| Subjective | Keluhan pasien dan riwayat subjektif |
| Objective | Pemeriksaan fisik dan data objektif |
| Assessment | Diagnosis kerja atau diagnosis akhir |
| Plan | Terapi, tindakan, resep, edukasi, kontrol, atau rujukan |

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| DOC-001 | Dokter dapat melihat data pasien dan riwayat kunjungan |
| DOC-002 | Dokter dapat melihat hasil pemeriksaan awal |
| DOC-003 | Dokter dapat mencatat SOAP |
| DOC-004 | Dokter dapat memilih diagnosis |
| DOC-005 | Dokter dapat memilih tindakan |
| DOC-006 | Dokter dapat membuat resep elektronik |
| DOC-007 | Dokter dapat membuat surat sakit |
| DOC-008 | Dokter dapat membuat surat rujukan |
| DOC-009 | Sistem menyimpan nama dokter dan waktu pemeriksaan |

**Acceptance Criteria:**
- Catatan SOAP tersimpan per kunjungan
- Dokter dapat melihat riwayat medis pasien secara kronologis
- Catatan dokter tidak dapat diubah oleh role lain
- Setiap perubahan catatan medis wajib tercatat dalam audit log

---

### 6.6 Modul Diagnosis dan Tindakan

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| DX-001 | Sistem menyediakan master diagnosis |
| DX-002 | Dokter dapat mencari diagnosis berdasarkan kode atau nama |
| DX-003 | Dokter dapat memilih lebih dari satu diagnosis |
| ACT-001 | Sistem menyediakan master tindakan |
| ACT-002 | Setiap tindakan dapat memiliki tarif |
| ACT-003 | Tindakan yang dipilih otomatis masuk ke tagihan |

---

### 6.7 Modul Resep Elektronik

**Data Resep:**

| Data | Keterangan |
|---|---|
| Nama Obat | Dipilih dari master obat |
| Dosis | Contoh: 500 mg |
| Aturan Pakai | Contoh: 3x1 sesudah makan |
| Jumlah | Jumlah obat |
| Satuan | Tablet, kapsul, botol, sachet |
| Catatan | Catatan tambahan |

**Status Resep:**
1. Menunggu
2. Diproses
3. Selesai
4. Dibatalkan

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| RX-001 | Dokter dapat memilih obat dari master obat |
| RX-002 | Sistem menampilkan stok obat |
| RX-003 | Sistem memberi peringatan jika stok kosong |
| RX-004 | Resep terkirim ke dashboard farmasi |
| RX-005 | Farmasi dapat mengubah status resep |
| RX-006 | Stok obat berkurang setelah obat diserahkan |

---

### 6.8 Modul Farmasi dan Stok Obat

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| PHA-001 | Farmasi dapat menambah data obat |
| PHA-002 | Farmasi dapat mengubah data obat |
| PHA-003 | Sistem mencatat stok masuk |
| PHA-004 | Sistem mencatat stok keluar |
| PHA-005 | Sistem memberi peringatan stok minimum |
| PHA-006 | Sistem mencatat tanggal kedaluwarsa obat |
| PHA-007 | Sistem menampilkan daftar obat hampir habis |
| PHA-008 | Sistem menampilkan daftar obat kedaluwarsa |

---

### 6.9 Modul Kasir dan Pembayaran

**Komponen Tagihan:**

| Komponen | Keterangan |
|---|---|
| Administrasi | Biaya pendaftaran atau administrasi |
| Konsultasi | Biaya dokter |
| Tindakan | Biaya tindakan medis |
| Obat | Biaya obat |
| Diskon | Potongan jika ada |
| Total | Total akhir pembayaran |

**Metode Pembayaran:**
1. Tunai
2. Transfer bank
3. QRIS
4. Asuransi
5. Perusahaan
6. Piutang

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| PAY-001 | Sistem membuat tagihan otomatis |
| PAY-002 | Tagihan mencakup konsultasi, tindakan, obat, dan biaya tambahan |
| PAY-003 | Kasir dapat memilih metode pembayaran |
| PAY-004 | Kasir dapat mencetak invoice atau kuitansi |
| PAY-005 | Status pembayaran dapat berupa belum bayar, sebagian, atau lunas |
| PAY-006 | Status kunjungan berubah menjadi selesai setelah pembayaran lunas |

---

### 6.10 Modul Laporan

**Jenis Laporan MVP:**
1. Laporan kunjungan harian
2. Laporan kunjungan mingguan
3. Laporan kunjungan bulanan
4. Laporan pasien baru dan pasien lama
5. Laporan diagnosis terbanyak
6. Laporan tindakan terbanyak
7. Laporan pemakaian obat
8. Laporan stok obat
9. Laporan pendapatan
10. Laporan dokter
11. Laporan kasir

**Functional Requirements:**

| Kode | Requirement |
|---|---|
| REP-001 | Laporan dapat difilter berdasarkan tanggal |
| REP-002 | Laporan dapat difilter berdasarkan dokter |
| REP-003 | Laporan dapat diekspor ke Excel |
| REP-004 | Laporan dapat diekspor ke PDF |
| REP-005 | Owner dapat melihat dashboard ringkasan |
| REP-006 | Owner tidak dapat mengubah data medis |

---

## 7. Struktur Menu

1. Dashboard
2. Pendaftaran
3. Antrean
4. Data Pasien
5. Pemeriksaan Awal
6. Pemeriksaan Dokter
7. Resep
8. Farmasi
9. Kasir
10. Laporan
11. Master Data (Dokter, Perawat, Poli, Diagnosis, Tindakan, Obat, Tarif)
12. User Management
13. Audit Log
14. Pengaturan Klinik
15. Backup Data

---

## 8. User Flow Utama

### 8.1 Flow Pasien Baru

```
Pasien datang
    ↓
Admin input data pasien baru
    ↓
Sistem membuat nomor rekam medis
    ↓
Admin membuat kunjungan
    ↓
Pasien masuk antrean
    ↓
Perawat input pemeriksaan awal
    ↓
Dokter melakukan pemeriksaan
    ↓
Dokter input SOAP, diagnosis, tindakan, dan resep
    ↓
Farmasi menyiapkan obat
    ↓
Kasir membuat tagihan
    ↓
Pasien melakukan pembayaran
    ↓
Kunjungan selesai
```

### 8.2 Flow Pasien Lama

```
Pasien datang
    ↓
Admin cari data pasien (nama / NIK / nomor RM)
    ↓
Admin membuat kunjungan baru
    ↓
[Lanjut ke alur yang sama dari step antrean]
```
