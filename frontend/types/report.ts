export interface DashboardData {
  today: {
    visits_total: number
    visits_by_status: Record<string, number>
    new_patients: number
    revenue: number
  }
  month: {
    visits_total: number
    new_patients: number
    revenue: number
  }
  pending: {
    prescriptions: number
    invoices: number
  }
  alerts: {
    low_stock_count: number
    low_stock_medicines: {
      id: number
      name: string
      stock: number
      min_stock: number
      unit: string
    }[]
  }
  top_polis_today: { id: number; name: string; total: number }[]
  last_7_days: { date: string; revenue: number; visits: number }[]
}

export interface RevenueSummary {
  total_invoices: number
  total_revenue: number
  total_discount: number
  avg_revenue: number
}

export interface RevenueReport {
  filters: { date_from: string; date_to: string; group_by: string }
  summary: RevenueSummary
  by_payment_method: { payment_method: string; count: number; revenue: number }[]
  breakdown: { period: string; invoices: number; revenue: number; discount: number }[]
}

export interface MedicinesReportSummary {
  total: number
  active: number
  low_stock: number
  out_stock: number
}

export interface MedicinesReport {
  summary: MedicinesReportSummary
  medicines: {
    id: number
    name: string
    generic_name: string | null
    category: string | null
    unit: string
    stock: number
    min_stock: number
    price: number
    is_active: boolean
    stock_status: 'normal' | 'menipis' | 'habis'
  }[]
}
