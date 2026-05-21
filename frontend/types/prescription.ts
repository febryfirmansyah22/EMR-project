export type PrescriptionStatus = 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan'

export interface PrescriptionItem {
  id: number
  prescription_id: number
  medicine_id: number
  quantity: number
  dosage: string
  instructions: string | null
  notes: string | null
  unit_price: number
  subtotal: number
  medicine?: { id: number; name: string; unit: string; stock: number }
}

export interface Prescription {
  id: number
  prescription_number: string
  visit_id: number
  doctor_id: number
  status: PrescriptionStatus
  notes: string | null
  pharmacist_notes: string | null
  dispensed_at: string | null
  dispensed_by?: { id: number; name: string } | null
  doctor?: { id: number; user: { id: number; name: string } }
  visit?: {
    id: number
    visit_number: string
    visit_date: string
    patient_id: number
    status: string
    patient?: { id: number; name: string; medical_record_number: string }
  }
  items: PrescriptionItem[]
  created_at: string
  updated_at: string
}

export interface PrescriptionItemFormData {
  medicine_id: number
  quantity: number
  dosage: string
  instructions?: string
  notes?: string
}

export interface PrescriptionFormData {
  notes?: string
  items: PrescriptionItemFormData[]
}
