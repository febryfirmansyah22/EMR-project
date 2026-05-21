import type { Patient } from './patient'

export type VisitStatus =
  | 'terdaftar'
  | 'menunggu_pemeriksaan_awal'
  | 'menunggu_dokter'
  | 'sedang_diperiksa'
  | 'menunggu_obat'
  | 'menunggu_pembayaran'
  | 'selesai'
  | 'batal'

export interface Visit {
  id: number
  visit_number: string
  queue_number: number
  visit_date: string
  complaint: string | null
  status: VisitStatus
  notes: string | null
  patient_id: number
  poli_id: number
  doctor_id: number | null
  registered_by: number
  patient?: Pick<Patient, 'id' | 'name' | 'medical_record_number' | 'insurance_type'>
  poli?: { id: number; name: string }
  doctor?: { id: number; user: { id: number; name: string } }
  examination?: Examination | null
  medical_record?: MedicalRecord | null
  prescription?: import('./prescription').Prescription | null
  invoice?: import('./invoice').Invoice | null
  created_at: string
  updated_at: string
}

export interface VisitFormData {
  patient_id: number
  poli_id: number
  doctor_id?: number
  visit_date?: string
  complaint?: string
  notes?: string
}

export interface Examination {
  id: number
  visit_id: number
  weight: number | null
  height: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  pulse: number | null
  temperature: number | null
  respiratory_rate: number | null
  oxygen_saturation: number | null
  blood_sugar: number | null
  notes: string | null
  bmi: number | null
  bmi_category: string | null
  examined_at: string
}

export interface ExaminationFormData {
  weight?: number
  height?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  pulse?: number
  temperature?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  blood_sugar?: number
  notes?: string
}

export interface MedicalRecord {
  id: number
  visit_id: number
  doctor_id: number
  soap_subjective: string
  soap_objective: string
  soap_assessment: string
  soap_plan: string
  doctor_notes: string | null
  diagnoses?: Diagnosis[]
  actions?: RecordAction[]
  doctor?: { id: number; user: { id: number; name: string } }
  created_at: string
  updated_at: string
}

export interface Diagnosis {
  id: number
  code: string
  name: string
  pivot?: { type: 'primer' | 'sekunder' }
}

export interface RecordAction {
  id: number
  name: string
  price: number
  pivot?: { quantity: number; notes: string | null }
}

export interface MedicalRecordFormData {
  soap_subjective: string
  soap_objective: string
  soap_assessment: string
  soap_plan: string
  doctor_notes?: string
  diagnoses?: { diagnosis_id: number; type: 'primer' | 'sekunder' }[]
  actions?: { action_id: number; quantity: number; notes?: string }[]
}
