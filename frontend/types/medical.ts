export interface MedicalRecord {
  id: number
  visit_id: number
  doctor_id: number
  soap_subjective: string
  soap_objective: string
  soap_assessment: string
  soap_plan: string
  doctor_notes: string | null
  created_at: string
  updated_at: string
}

export interface NurseExamination {
  id: number
  visit_id: number
  nurse_id: number
  chief_complaint: string
  blood_pressure: string
  temperature: number
  pulse: number
  respiration: number
  weight: number
  height: number
  oxygen_saturation: number
  nurse_notes: string | null
  created_at: string
}
