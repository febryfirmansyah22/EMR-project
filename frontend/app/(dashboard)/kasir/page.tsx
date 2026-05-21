'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types/invoice'
import type { ApiResponse } from '@/types/api'

const TABS: { value: InvoiceStatus; label: string }[] = [
  { value: 'menunggu_pembayaran', label: 'Menunggu Bayar' },
  { value: 'lunas',              label: 'Lunas' },
  { value: 'dibatalkan',         label: 'Dibatalkan' },
]

function InvoiceCard({ inv, onClick }: { inv: Invoice; onClick: () => void }) {
  const initials = (inv.patient?.name ?? '-')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const total = inv.total_amount > 0 ? inv.total_amount : inv.subtotal

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
              {inv.patient?.name ?? '-'}
            </p>
            <StatusBadge status={inv.status} type="invoice" />
          </div>
          <p className="text-[12px] text-[#737685] font-mono">
            {inv.patient?.medical_record_number ?? '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#f1f3ff] pt-2.5">
        <span className="font-mono text-[12px] text-[#737685]">{inv.invoice_number}</span>
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold text-[#091E42] num-tabular">
            {formatRupiah(total)}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[12px] text-[#737685]">{formatDateTime(inv.created_at)}</p>
    </button>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#c3c6d6] bg-white py-14">
      <span className="material-symbols-outlined text-[40px] text-[#c3c6d6]">receipt_long</span>
      <p className="mt-3 text-[14px] font-medium text-[#091E42]">Tidak ada invoice</p>
      <p className="mt-0.5 text-[13px] text-[#737685]">
        Tidak ada invoice dengan status "{label}"
      </p>
    </div>
  )
}

export default function KasirPage() {
  const router = useRouter()
  const [tab, setTab] = useState<string>('menunggu_pembayaran')

  const { data: invoices, isLoading, refetch } = useQuery<Invoice[]>({
    queryKey: ['invoices', tab],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Invoice[]>>('/invoices', {
        params: { status: tab, per_page: 50 },
      })
      return res.data.data ?? []
    },
    refetchInterval: 20_000,
  })

  const menungguCount = invoices?.length ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kasir & Pembayaran"
        description="Kelola pembayaran dan invoice pasien"
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
              {t.value === 'menunggu_pembayaran' && tab === 'menunggu_pembayaran' && menungguCount > 0 && (
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
            ) : !invoices || invoices.length === 0 ? (
              <EmptyState label={t.label.toLowerCase()} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {invoices.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    inv={inv}
                    onClick={() => router.push(`/kasir/${inv.id}`)}
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
