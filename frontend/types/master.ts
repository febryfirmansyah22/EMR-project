export interface Poli {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface Doctor {
  id: number
  user_id: number
  poli_id: number
  license_number: string | null
  specialization: string | null
  is_active: boolean
  user?: { id: number; name: string; email: string }
  poli?: { id: number; name: string }
}

export interface Medicine {
  id: number
  name: string
  generic_name: string | null
  category: string | null
  unit: string
  price: number
  stock: number
  min_stock: number
  description: string | null
  is_active: boolean
}

export interface MedicalAction {
  id: number
  name: string
  category: string | null
  price: number
  is_active: boolean
}

export interface Diagnosis {
  id: number
  code: string
  name: string
  category: string | null
  is_active: boolean
}

export interface StockMovement {
  id: number
  medicine_id: number
  prescription_id: number | null
  type: 'masuk' | 'keluar' | 'penyesuaian'
  quantity: number
  stock_before: number
  stock_after: number
  notes: string | null
  created_by?: { id: number; name: string; role: string }
  prescription?: { id: number; prescription_number: string }
  created_at: string
}
