export type InvoiceStatus = 'menunggu_pembayaran' | 'lunas' | 'dibatalkan'
export type PaymentMethod = 'tunai' | 'bpjs' | 'asuransi_swasta' | 'debit' | 'kredit'

export interface InvoiceItem {
  id: number
  invoice_id: number
  type: 'tindakan' | 'obat' | 'lainnya'
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Invoice {
  id: number
  invoice_number: string
  visit_id: number
  patient_id: number
  status: InvoiceStatus
  subtotal: number
  discount: number
  total_amount: number
  payment_method: PaymentMethod | null
  payment_amount: number | null
  payment_change: number | null
  paid_at: string | null
  notes: string | null
  paid_by?: { id: number; name: string } | null
  patient?: { id: number; name: string; medical_record_number: string; insurance_type: string; insurance_number: string | null }
  visit?: { id: number; visit_number: string; visit_date: string; status: string }
  items: InvoiceItem[]
  created_at: string
  updated_at: string
}

export interface PaymentFormData {
  payment_method: PaymentMethod
  payment_amount: number
  discount?: number
  notes?: string
}
