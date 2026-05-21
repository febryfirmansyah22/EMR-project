'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Cookies from 'js-cookie'
import type { Poli } from '@/types/master'
import type { Visit } from '@/types/visit'
import type { ApiResponse } from '@/types/api'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'terdaftar',                 label: 'Terdaftar' },
  { value: 'menunggu_pemeriksaan_awal', label: 'Menunggu Perawat' },
  { value: 'menunggu_dokter',           label: 'Menunggu Dokter' },
  { value: 'sedang_diperiksa',          label: 'Diperiksa' },
  { value: 'menunggu_obat',             label: 'Menunggu Obat' },
  { value: 'menunggu_pembayaran',       label: 'Menunggu Bayar' },
  { value: 'selesai',                   label: 'Selesai' },
  { value: 'batal',                     label: 'Dibatalkan' },
]

function defaultDateRange() {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export default function LaporanKunjunganPage() {
  const defaults = defaultDateRange()
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo,   setDateTo]   = useState(defaults.to)
  const [poliId,   setPoliId]   = useState('')
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(1)

  const { data: polis } = useQuery<Poli[]>({
    queryKey: ['polis'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Poli[]>>('/polis')
      return res.data.data ?? []
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'visits', { dateFrom, dateTo, poliId, status, page }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Visit[]>>('/reports/visits', {
        params: {
          date_from:  dateFrom || undefined,
          date_to:    dateTo   || undefined,
          poli_id:    poliId   || undefined,
          status:     status   || undefined,
          page,
          per_page: 20,
        },
      })
      return res.data
    },
  })

  async function handleExport() {
    const token = Cookies.get('auth_token')
    const params = new URLSearchParams({
      date_from:  dateFrom,
      date_to:    dateTo,
      ...(poliId && { poli_id: poliId }),
      ...(status && { status }),
    })
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
    const url = `${baseUrl}/reports/visits/export?${params}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-kunjungan-${dateFrom}-${dateTo}.csv`
    link.click()
  }

  const columns: Column<Visit>[] = [
    {
      key: 'visit_number',
      header: 'No. Kunjungan',
      cell: (v) => <span className="font-mono text-[12px] font-medium text-[#434654]">{v.visit_number}</span>,
    },
    {
      key: 'visit_date',
      header: 'Tanggal',
      cell: (v) => <span className="text-[14px] text-[#434654]">{formatDate(v.visit_date)}</span>,
    },
    {
      key: 'patient',
      header: 'Pasien',
      cell: (v) => (
        <div>
          <p className="text-[14px] font-semibold text-[#091E42]">{v.patient?.name ?? '-'}</p>
          <p className="text-[12px] text-[#737685]">{v.patient?.medical_record_number}</p>
        </div>
      ),
    },
    {
      key: 'poli',
      header: 'Poli',
      cell: (v) => <span className="text-[14px] text-[#434654]">{v.poli?.name ?? '-'}</span>,
    },
    {
      key: 'doctor',
      header: 'Dokter',
      cell: (v) => <span className="text-[14px] text-[#434654]">{v.doctor?.user?.name ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <StatusBadge status={v.status} type="visit" />,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan Kunjungan"
        description="Rekap kunjungan pasien berdasarkan periode dan filter"
        action={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#737685]">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Tanggal Mulai</Label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Tanggal Akhir</Label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Poli</Label>
            <Select onValueChange={(v) => { const s = v as string; setPoliId(s === 'all' ? '' : s); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Semua Poli" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Poli</SelectItem>
                {polis?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Status</Label>
            <Select onValueChange={(v) => { const s = v as string; setStatus(s === 'all' ? '' : s); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.filter(s => s.value).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {data?.meta && (
        <p className="text-[13px] text-[#737685]">
          Menampilkan <span className="font-semibold text-[#091E42]">{data.meta.total}</span> kunjungan
        </p>
      )}

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Tidak ada data kunjungan untuk filter ini."
        pagination={data?.meta ? {
          page: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
          onPageChange: setPage,
        } : undefined}
      />
    </div>
  )
}
