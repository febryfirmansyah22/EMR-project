'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Patient } from '@/types/patient'
import type { ApiResponse } from '@/types/api'

const INSURANCE_LABEL: Record<string, string> = {
  umum: 'Umum', bpjs: 'BPJS', asuransi_swasta: 'Asuransi',
}

const INSURANCE_STYLE: Record<string, { bg: string; text: string }> = {
  umum:            { bg: '#f1f3ff', text: '#434654' },
  bpjs:            { bg: '#E3FCEF', text: '#006644' },
  asuransi_swasta: { bg: '#dae2ff', text: '#0052CC' },
}

export default function PasienPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { search, page }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Patient[]>>('/patients', {
        params: { search: search || undefined, page, per_page: 15 },
      })
      return res.data
    },
  })

  const columns: Column<Patient>[] = [
    {
      key: 'rm',
      header: 'No. RM',
      cell: (p) => (
        <span className="font-mono text-[12px] font-medium text-[#434654]">{p.medical_record_number}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Pasien',
      cell: (p) => (
        <div>
          <p className="text-[14px] font-semibold text-[#091E42]">{p.name}</p>
          <p className="text-[12px] text-[#737685]">{p.gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'} · {p.age} tahun</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      cell: (p) => <span className="text-[14px] text-[#434654]">{p.phone}</span>,
    },
    {
      key: 'insurance',
      header: 'Asuransi',
      cell: (p) => {
        const style = INSURANCE_STYLE[p.insurance_type] ?? { bg: '#f1f3ff', text: '#434654' }
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {INSURANCE_LABEL[p.insurance_type] ?? p.insurance_type}
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Terdaftar',
      cell: (p) => <span className="text-[12px] text-[#737685]">{formatDate(p.created_at)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Pasien"
        description="Kelola data pasien klinik"
        action={
          <Button onClick={() => router.push('/pasien/baru')} size="sm">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Pasien
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">search</span>
          <Input
            placeholder="Cari nama, no. RM..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {data?.meta && (
          <p className="text-[13px] text-[#737685]">{data.meta.total} pasien</p>
        )}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Tidak ada pasien ditemukan."
        onRowClick={(p) => router.push(`/pasien/${p.id}`)}
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
