export interface Patient {
  id: number
  medical_record_number: string
  name: string
  nik: string
  birth_date: string
  birth_place: string
  gender: 'laki-laki' | 'perempuan'
  blood_type: string | null
  address: string
  phone: string
  email: string | null
  religion: string | null
  marital_status: string | null
  occupation: string | null
  education: string | null
  emergency_contact: {
    name: string
    phone: string
    relation: string
  } | null
  insurance_type: 'umum' | 'bpjs' | 'asuransi_swasta'
  insurance_number: string | null
  is_active: boolean
  age?: number
  created_at: string
  updated_at: string
}

export interface PatientFormData {
  name: string
  nik: string
  birth_date: string
  birth_place: string
  gender: 'laki-laki' | 'perempuan'
  blood_type?: string
  address: string
  phone: string
  email?: string
  religion?: string
  marital_status?: string
  occupation?: string
  education?: string
  emergency_contact?: {
    name: string
    phone: string
    relation: string
  }
  insurance_type: 'umum' | 'bpjs' | 'asuransi_swasta'
  insurance_number?: string
}
