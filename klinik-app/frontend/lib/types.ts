// ============================================================
// Auth & User
// ============================================================
export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "dokter" | "perawat";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// ============================================================
// Observasi Umum (General Observations / Patient Visits)
// ============================================================
export type PaymentMethod = "cash" | "qris" | "transfer";

export interface Observasi {
  id: number;
  tanggal: string;
  nama_pasien: string;
  harga: number;
  metode: PaymentMethod;
  setor: number;
  catatan: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  // computed fields from API
  total_berjalan?: number;
  saldo?: number;
  user?: User;
}

export interface ObservasiFormData {
  tanggal: string;
  nama_pasien: string;
  harga: number;
  metode: PaymentMethod;
  setor: number;
  catatan?: string;
}

export interface ObservasiSummary {
  total_pasien: number;
  total_biaya: number;
  total_cash: number;
  total_qris_tf: number;
  total_setor: number;
  sisa_saldo: number;
}

// ============================================================
// Cream Sales
// ============================================================
export interface Cream {
  id: number;
  tanggal: string;
  nama_pasien: string;
  produk: string;
  harga_jual: number;
  pengeluaran: number;
  metode: PaymentMethod;
  catatan: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  // computed
  saldo?: number;
  saldo_cash?: number;
  saldo_tf?: number;
  user?: User;
}

export interface CreamFormData {
  tanggal: string;
  nama_pasien: string;
  produk: string;
  harga_jual: number;
  pengeluaran: number;
  metode: PaymentMethod;
  catatan?: string;
}

export interface CreamSummary {
  jumlah_pasien: number;
  total_penjualan: number;
  total_pengeluaran: number;
  saldo: number;
  saldo_cash: number;
  saldo_tf: number;
}

// ============================================================
// Faktur (Purchase Invoices)
// ============================================================
export interface Faktur {
  id: number;
  tanggal: string;
  pbf_toko: string;
  harga: number;
  keterangan: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface FakturFormData {
  tanggal: string;
  pbf_toko: string;
  harga: number;
  keterangan?: string;
}

export interface FakturSummary {
  total_pembelian: number;
  jumlah_transaksi: number;
  rata_rata: number;
}

// ============================================================
// Setoran (Deposits)
// ============================================================
export type SetoranSumber = "observasi" | "cream" | "lainnya";

export interface Setoran {
  id: number;
  tanggal: string;
  sumber: SetoranSumber;
  jumlah: number;
  metode: PaymentMethod;
  catatan: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface SetoranFormData {
  tanggal: string;
  sumber: SetoranSumber;
  jumlah: number;
  metode: PaymentMethod;
  catatan?: string;
}

// ============================================================
// Dashboard / Analytics
// ============================================================
export interface DashboardStats {
  total_pasien_hari_ini: number;
  total_pasien_bulan_ini: number;
  total_pemasukan: number;
  total_cash: number;
  total_qris_tf: number;
  total_setoran: number;
  sisa_saldo: number;
  total_penjualan_cream: number;
  total_pengeluaran_cream: number;
  saldo_cream: number;
  total_pembelian_obat: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardCharts {
  pasien_per_bulan: ChartDataPoint[];
  pemasukan_per_bulan: ChartDataPoint[];
  cash_vs_qris: { cash: number; qris_tf: number };
  cream_per_bulan: ChartDataPoint[];
  obat_per_bulan: ChartDataPoint[];
}

// ============================================================
// Rekap (Summaries)
// ============================================================
export interface RekapMingguan {
  minggu_ke: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  observasi: ObservasiSummary;
  cream: CreamSummary;
  faktur: FakturSummary;
  setoran: number;
}

export interface RekapBulanan {
  bulan: number;
  tahun: number;
  observasi: ObservasiSummary;
  cream: CreamSummary;
  faktur: FakturSummary;
  total_setoran: number;
  minggu_detail: RekapMingguan[];
}

// ============================================================
// Aktivitas (Activity Log)
// ============================================================
export interface AktivitasLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: "create" | "update" | "delete" | "read" | "login" | "logout";
  resource: string;
  resource_id: number | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// ============================================================
// API Response Wrappers
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================
// Filters
// ============================================================
export type DateFilter = "today" | "this_week" | "this_month" | "this_year" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export interface ObservasiFilter {
  filter?: DateFilter;
  date_from?: string;
  date_to?: string;
  metode?: PaymentMethod | "";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CreamFilter {
  filter?: DateFilter;
  date_from?: string;
  date_to?: string;
  metode?: PaymentMethod | "";
  search?: string;
  page?: number;
  per_page?: number;
}

export interface FakturFilter {
  filter?: DateFilter;
  date_from?: string;
  date_to?: string;
  pbf_toko?: string;
  page?: number;
  per_page?: number;
}

export interface AktivitasFilter {
  search?: string;
  action?: string;
  resource?: string;
  page?: number;
  per_page?: number;
}
