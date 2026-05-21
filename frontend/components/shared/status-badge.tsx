import { cn } from '@/lib/utils'

/* ─── Visit status ─── */
const VISIT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  terdaftar:                 { label: 'Terdaftar',        bg: '#e8edff', text: '#0052CC' },
  menunggu_pemeriksaan_awal: { label: 'Menunggu Perawat', bg: '#FFF0B3', text: '#FF8B00' },
  menunggu_dokter:           { label: 'Menunggu Dokter',  bg: '#FFF0B3', text: '#FF8B00' },
  sedang_diperiksa:          { label: 'Diperiksa',        bg: '#DEEBFF', text: '#0052CC' },
  menunggu_obat:             { label: 'Menunggu Obat',    bg: '#EAE6FF', text: '#6554C0' },
  menunggu_pembayaran:       { label: 'Menunggu Bayar',   bg: '#FFF0B3', text: '#FF8B00' },
  selesai:                   { label: 'Selesai',          bg: '#E3FCEF', text: '#006644' },
  batal:                     { label: 'Batal',            bg: '#FFEBE6', text: '#BF2600' },
}

/* ─── Prescription status ─── */
const PRESCRIPTION_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  menunggu:   { label: 'Menunggu',   bg: '#FFF0B3', text: '#FF8B00' },
  diproses:   { label: 'Diproses',   bg: '#DEEBFF', text: '#0052CC' },
  selesai:    { label: 'Selesai',    bg: '#E3FCEF', text: '#006644' },
  dibatalkan: { label: 'Dibatalkan', bg: '#FFEBE6', text: '#BF2600' },
}

/* ─── Invoice status ─── */
const INVOICE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  menunggu_pembayaran: { label: 'Belum Lunas', bg: '#FFF0B3', text: '#FF8B00' },
  lunas:               { label: 'Lunas',       bg: '#E3FCEF', text: '#006644' },
  dibatalkan:          { label: 'Dibatalkan',  bg: '#FFEBE6', text: '#BF2600' },
}

/* ─── Stock status ─── */
const STOCK_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  normal:  { label: 'Normal',  bg: '#E3FCEF', text: '#006644' },
  menipis: { label: 'Menipis', bg: '#FFF0B3', text: '#FF8B00' },
  habis:   { label: 'Habis',   bg: '#FFEBE6', text: '#BF2600' },
}

type StatusType = 'visit' | 'prescription' | 'invoice' | 'stock'

interface StatusBadgeProps {
  status: string
  type?: StatusType
  className?: string
}

export function StatusBadge({ status, type = 'visit', className }: StatusBadgeProps) {
  const config = {
    visit:        VISIT_STATUS_CONFIG,
    prescription: PRESCRIPTION_STATUS_CONFIG,
    invoice:      INVOICE_STATUS_CONFIG,
    stock:        STOCK_STATUS_CONFIG,
  }[type]

  const { label, bg, text } = config[status] ?? {
    label: status,
    bg: '#f1f3ff',
    text: '#434654',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide leading-4',
        className
      )}
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}
