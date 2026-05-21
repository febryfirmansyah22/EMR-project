export const ROLES = {
  SUPER_ADMIN:  'super_admin',
  ADMIN_KLINIK: 'admin_klinik',
  PERAWAT:      'perawat',
  DOKTER:       'dokter',
  FARMASI:      'farmasi',
  KASIR:        'kasir',
  OWNER:        'owner',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const QUEUE_STATUS = {
  TERDAFTAR:          'terdaftar',
  MENUNGGU_AWAL:      'menunggu_pemeriksaan_awal',
  MENUNGGU_DOKTER:    'menunggu_dokter',
  SEDANG_DIPERIKSA:   'sedang_diperiksa',
  MENUNGGU_OBAT:      'menunggu_obat',
  MENUNGGU_PEMBAYARAN:'menunggu_pembayaran',
  SELESAI:            'selesai',
  BATAL:              'batal',
} as const

export const PRESCRIPTION_STATUS = {
  MENUNGGU:   'menunggu',
  DIPROSES:   'diproses',
  SELESAI:    'selesai',
  DIBATALKAN: 'dibatalkan',
} as const

export const PAYMENT_METHOD = {
  TUNAI:           'tunai',
  BPJS:            'bpjs',
  ASURANSI_SWASTA: 'asuransi_swasta',
  DEBIT:           'debit',
  KREDIT:          'kredit',
} as const

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  tunai:           'Tunai',
  bpjs:            'BPJS',
  asuransi_swasta: 'Asuransi Swasta',
  debit:           'Debit',
  kredit:          'Kartu Kredit',
}

export const INVOICE_STATUS = {
  MENUNGGU:   'menunggu_pembayaran',
  LUNAS:      'lunas',
  DIBATALKAN: 'dibatalkan',
} as const

export const QUEUE_STATUS_LABEL: Record<string, string> = {
  terdaftar:                 'Terdaftar',
  menunggu_pemeriksaan_awal: 'Menunggu Perawat',
  menunggu_dokter:           'Menunggu Dokter',
  sedang_diperiksa:          'Sedang Diperiksa',
  menunggu_obat:             'Menunggu Obat',
  menunggu_pembayaran:       'Menunggu Bayar',
  selesai:                   'Selesai',
  batal:                     'Batal',
}

export const PRESCRIPTION_STATUS_LABEL: Record<string, string> = {
  menunggu:   'Menunggu',
  diproses:   'Diproses',
  selesai:    'Selesai',
  dibatalkan: 'Dibatalkan',
}
