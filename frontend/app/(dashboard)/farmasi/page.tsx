'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { Prescription, PrescriptionStatus } from '@/types/prescription'
import type { ApiResponse } from '@/types/api'

const TABS: { value: PrescriptionStatus | 'all'; label: string }[] = [
  { value: 'menunggu',    label: 'Menunggu' },
  { value: 'diproses',   label: 'Diproses' },
  { value: 'selesai',    label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

function RxCard({ rx, onClick }: { rx: Prescription; onClick: () => void }) {
  const initials = (rx.visit?.patient?.name ?? '-')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[#c3c6d6] bg-white p-4 text-left transition-all hover:border-[#0052CC]/30 hover:shadow-card focus-visible:outline-2 focus-visible:outline-[#0052CC]"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dae2ff] text-[11px] font-bold text-[#0052CC]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] font-semibold text-[#091E42]">
              {rx.visit?.patient?.name ?? '-'}
            </p>
            <StatusBadge status={rx.status} type="prescription" />
          </div>
          <p className="text-[12px] text-[#737685] font-mono">
            {rx.visit?.patient?.medical_record_number ?? '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#f1f3ff] pt-2.5">
        <span className="font-mono text-[12px] text-[#737685]">{rx.prescription_number}</span>
        <div className="flex items-center gap-3 text-[12px] text-[#434654]">
          <span>
            <span className="font-semibold text-[#091E42]">{rx.items.length}</span> item
          </span>
          <span className="text-[#737685]">{formatDateTime(rx.created_at)}</span>
        </div>
      </div>
    </button>
  )
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#c3c6d6] bg-white py-14">
      <span className="material-symbols-outlined text-[40px] text-[#c3c6d6]">medication</span>
      <p className="mt-3 text-[14px] font-medium text-[#091E42]">Tidak ada resep</p>
      <p className="mt-0.5 text-[13px] text-[#737685]">
        Tidak ada resep dengan status "{tab}"
      </p>
    </div>
  )
}

export default function FarmasiPage() {
  const router = useRouter()
  const [tab, setTab] = useState<string>('menunggu')

  const { data: prescriptions, isLoading, refetch } = useQuery<Prescription[]>({
    queryKey: ['prescriptions', tab],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Prescription[]>>('/prescriptions', {
        params: { status: tab, per_page: 50 },
      })
      return res.data.data ?? []
    },
    refetchInterval: 20_000,
  })

  const menungguCount = prescriptions?.length ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Antrean Farmasi"
        description="Kelola resep dan dispensing obat"
        action={
          <button
            onClick={() => refetch()}
            className="flex h-9 items-center gap-1.5 rounded border border-[#c3c6d6] bg-white px-3 text-[13px] font-medium text-[#434654] hover:bg-[#f1f3ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === 'menunggu' && tab === 'menunggu' && menungguCount > 0 && (
                <span className="ml-1.5 rounded-full bg-[#FF5630] px-1.5 py-0 text-[10px] font-bold text-white leading-4">
                  {menungguCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
              </div>
            ) : !prescriptions || prescriptions.length === 0 ? (
              <EmptyState tab={t.label.toLowerCase()} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {prescriptions.map((rx) => (
                  <RxCard
                    key={rx.id}
                    rx={rx}
                    onClick={() => router.push(`/farmasi/${rx.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
