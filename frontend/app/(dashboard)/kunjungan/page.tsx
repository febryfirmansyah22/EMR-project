'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Visit } from '@/types/visit'
import type { ApiResponse } from '@/types/api'

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}

/* Column config — each with a color accent */
const BOARD_COLUMNS: {
  status: string
  label: string
  accent: string     // left border color
  headerBg: string   // column header bg
  countBg: string    // count badge bg/text
}[] = [
  {
    status: 'terdaftar',
    label: 'Terdaftar',
    accent: '#c3c6d6',
    headerBg: '#f1f3ff',
    countBg: 'bg-[#dae2ff] text-[#0052CC]',
  },
  {
    status: 'menunggu_pemeriksaan_awal',
    label: 'Menunggu Perawat',
    accent: '#FFAB00',
    headerBg: '#FFFAE6',
    countBg: 'bg-[#FFF0B3] text-[#FF8B00]',
  },
  {
    status: 'menunggu_dokter',
    label: 'Menunggu Dokter',
    accent: '#FF8B00',
    headerBg: '#FFF7E6',
    countBg: 'bg-[#FFF0B3] text-[#FF8B00]',
  },
  {
    status: 'sedang_diperiksa',
    label: 'Diperiksa',
    accent: '#0052CC',
    headerBg: '#EBF4FF',
    countBg: 'bg-[#DEEBFF] text-[#0052CC]',
  },
  {
    status: 'menunggu_obat',
    label: 'Menunggu Obat',
    accent: '#6554C0',
    headerBg: '#F3F0FF',
    countBg: 'bg-[#EAE6FF] text-[#6554C0]',
  },
  {
    status: 'menunggu_pembayaran',
    label: 'Menunggu Bayar',
    accent: '#00A3BF',
    headerBg: '#E6FCFF',
    countBg: 'bg-[#E6FCFF] text-[#00A3BF]',
  },
]

/* ── Queue Card ── */
function QueueCard({ visit, onClick }: { visit: Visit; onClick: () => void }) {
  const initials = (visit.patient?.name ?? '-')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[#c3c6d6] bg-white p-3.5 text-left transition-all hover:border-[#0052CC]/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-[#0052CC]"
    >
      {/* Top row: name + queue number */}
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dae2ff] text-[11px] font-bold text-[#0052CC]">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#091E42] leading-tight">
            {visit.patient?.name ?? '-'}
          </p>
          <p className="text-[11px] text-[#737685] font-mono">
            {visit.patient?.medical_record_number ?? '—'}
          </p>
        </div>

        {/* Queue number badge */}
        <span className="shrink-0 rounded bg-[#0052CC] px-1.5 py-0.5 text-[11px] font-bold text-white num-tabular">
          {visit.queue_number ?? '-'}
        </span>
      </div>

      {/* Bottom: poli + doctor */}
      <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[#434654]">
        <Icon name="local_hospital" className="text-[14px] text-[#737685]" />
        <span className="truncate">
          {visit.poli?.name ?? '-'}
          {visit.doctor?.user?.name && (
            <span className="text-[#737685]"> · {visit.doctor.user.name}</span>
          )}
        </span>
      </div>
    </button>
  )
}

export default function KunjunganPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [, setRefetchKey] = useState(0)

  const { data: visits, isLoading, refetch } = useQuery<Visit[]>({
    queryKey: ['visits', 'queue-today'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Visit[]>>('/visits/queue-today')
      return res.data.data ?? []
    },
    refetchInterval: 30_000,
  })

  const groupedVisits = BOARD_COLUMNS.reduce<Record<string, Visit[]>>((acc, col) => {
    acc[col.status] = visits?.filter((v) => v.status === col.status) ?? []
    return acc
  }, {})

  const totalActive = visits?.filter((v) => !['selesai', 'batal'].includes(v.status)).length ?? 0
  const canRegister = user && ['super_admin', 'admin_klinik'].includes(user.role)

  return (
    <div className="flex h-full flex-col space-y-5">
      <PageHeader
        title="Antrean Hari Ini"
        description={new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        action={
          <div className="flex items-center gap-2">
            {/* Active count chip */}
            <span className="rounded-full bg-[#dae2ff] px-3 py-1 text-[12px] font-semibold text-[#0052CC]">
              {totalActive} aktif
            </span>

            <button
              onClick={() => { refetch(); setRefetchKey(k => k + 1) }}
              className="flex h-9 items-center gap-1.5 rounded border border-[#c3c6d6] bg-white px-3 text-[13px] font-medium text-[#434654] hover:bg-[#f1f3ff] transition-colors"
            >
              <Icon name="refresh" className="text-[16px]" />
              Refresh
            </button>

            {canRegister && (
              <button
                onClick={() => router.push('/kunjungan/daftar')}
                className="flex h-9 items-center gap-1.5 rounded bg-[#0052CC] px-4 text-[13px] font-semibold text-white hover:bg-[#003d9b] transition-colors"
              >
                <Icon name="person_add" className="text-[16px]" />
                Daftarkan Pasien
              </button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div
          className="grid gap-3 min-w-max"
          style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS.length}, 224px)` }}
        >
          {BOARD_COLUMNS.map((col) => (
            <div key={col.status} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div
            className="grid gap-3 min-w-max h-full"
            style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS.length}, 224px)` }}
          >
            {BOARD_COLUMNS.map((col) => {
              const colVisits = groupedVisits[col.status] ?? []
              return (
                <div key={col.status} className="flex flex-col gap-2">
                  {/* Column header */}
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
                    style={{
                      backgroundColor: col.headerBg,
                      borderColor: col.accent + '40',
                      borderLeftWidth: '3px',
                      borderLeftColor: col.accent,
                    }}
                  >
                    <span className="text-[12px] font-semibold text-[#091E42]">
                      {col.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold num-tabular ${col.countBg}`}
                    >
                      {colVisits.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {colVisits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#c3c6d6] bg-white/60 py-6 text-center">
                        <Icon name="inbox" className="text-[24px] text-[#c3c6d6]" />
                        <p className="mt-1.5 text-[11px] text-[#737685]">Kosong</p>
                      </div>
                    ) : (
                      colVisits.map((visit) => (
                        <QueueCard
                          key={visit.id}
                          visit={visit}
                          onClick={() => router.push(`/kunjungan/${visit.id}`)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
