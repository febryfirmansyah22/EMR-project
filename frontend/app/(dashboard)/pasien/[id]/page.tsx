'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable, type Column } from '@/components/shared/data-table'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Patient } from '@/types/patient'
import type { Visit } from '@/types/visit'
import type { ApiResponse } from '@/types/api'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-[#c3c6d6] last:border-0">
      <span className="text-[13px] text-[#737685]">{label}</span>
      <span className="text-[13px] font-medium text-[#091E42]">{value}</span>
    </div>
  )
}

const INSURANCE_STYLE: Record<string, { bg: string; text: string }> = {
  umum:            { bg: '#f1f3ff', text: '#434654' },
  bpjs:            { bg: '#E3FCEF', text: '#006644' },
  asuransi_swasta: { bg: '#dae2ff', text: '#0052CC' },
}

export default function DetailPasienPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patients', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Patient>>(`/patients/${id}`)
      return res.data.data!
    },
  })

  const { data: visits } = useQuery<Visit[]>({
    queryKey: ['patients', id, 'medical-records'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Visit[]>>(`/patients/${id}/medical-records`)
      return res.data.data ?? []
    },
    enabled: !!id,
  })

  const visitColumns: Column<Visit>[] = [
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
      key: 'poli',
      header: 'Poli',
      cell: (v) => <span className="text-[14px] text-[#434654]">{v.poli?.name ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <StatusBadge status={v.status} type="visit" />,
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!patient) return null

  const insuranceStyle = INSURANCE_STYLE[patient.insurance_type] ?? { bg: '#f1f3ff', text: '#434654' }
  const insuranceLabel = patient.insurance_type === 'umum' ? 'Umum' :
    patient.insurance_type === 'bpjs' ? 'BPJS' : 'Asuransi Swasta'

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={patient.name}
        description={`No. RM: ${patient.medical_record_number}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Info pribadi */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-[#091E42]">
              <span className="material-symbols-outlined text-[20px] text-[#737685]">person</span>
              Data Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="NIK" value={patient.nik} />
            <InfoRow label="Jenis Kelamin" value={patient.gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'} />
            <InfoRow label="Tempat Lahir" value={patient.birth_place} />
            <InfoRow label="Tanggal Lahir" value={`${formatDate(patient.birth_date)} (${patient.age} tahun)`} />
            <InfoRow label="Golongan Darah" value={patient.blood_type} />
            <InfoRow label="Agama" value={patient.religion} />
            <InfoRow label="Status Menikah" value={patient.marital_status} />
            <InfoRow label="Pekerjaan" value={patient.occupation} />
          </CardContent>
        </Card>

        {/* Kontak & Asuransi */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-[#091E42]">
                <span className="material-symbols-outlined text-[20px] text-[#737685]">phone</span>
                Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[14px] text-[#091E42]">{patient.phone}</p>
              {patient.email && <p className="text-[13px] text-[#737685]">{patient.email}</p>}
              {patient.address && (
                <div className="flex gap-1.5 text-[13px] text-[#737685]">
                  <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">location_on</span>
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.emergency_contact && (
                <div className="mt-3 rounded-lg bg-[#f1f3ff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685] mb-1">Kontak Darurat</p>
                  <p className="text-[14px] font-semibold text-[#091E42]">{patient.emergency_contact.name}</p>
                  <p className="text-[12px] text-[#737685]">{patient.emergency_contact.relation} · {patient.emergency_contact.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-[#091E42]">
                <span className="material-symbols-outlined text-[20px] text-[#737685]">shield</span>
                Asuransi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: insuranceStyle.bg, color: insuranceStyle.text }}
              >
                {insuranceLabel}
              </span>
              {patient.insurance_number && (
                <p className="text-[13px] font-mono text-[#434654]">{patient.insurance_number}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Riwayat kunjungan */}
      {visits && visits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[14px] font-semibold text-[#091E42]">
              <span className="material-symbols-outlined text-[20px] text-[#737685]">calendar_today</span>
              Riwayat Kunjungan ({visits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={visits}
              columns={visitColumns}
              onRowClick={(v) => router.push(`/kunjungan/${v.id}`)}
              emptyMessage="Belum ada riwayat kunjungan."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
