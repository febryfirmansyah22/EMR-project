'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import type { MedicinesReport } from '@/types/report'
import type { ApiResponse } from '@/types/api'

const REPORT_LINKS = [
  {
    icon: 'calendar_month',
    title: 'Laporan Kunjungan',
    desc: 'Rekapitulasi kunjungan pasien per periode, poli, dan dokter',
    href: '/laporan/kunjungan',
    iconBg: 'bg-[#dae2ff]',
    iconText: 'text-[#0052CC]',
  },
  {
    icon: 'trending_up',
    title: 'Laporan Pendapatan',
    desc: 'Analisis pendapatan, diskon, dan metode pembayaran',
    href: '/laporan/pendapatan',
    iconBg: 'bg-[#E3FCEF]',
    iconText: 'text-[#006644]',
  },
]

export default function LaporanPage() {
  const router = useRouter()

  const { data: report, isLoading } = useQuery<MedicinesReport>({
    queryKey: ['reports', 'medicines'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MedicinesReport>>('/reports/medicines')
      return res.data.data!
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Rekap data dan analisis operasional klinik"
      />

      {/* Report nav cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORT_LINKS.map((r) => (
          <button
            key={r.href}
            onClick={() => router.push(r.href)}
            className="group rounded-lg border border-[#c3c6d6] bg-white p-5 text-left transition-all hover:border-[#0052CC]/40 hover:shadow-card"
          >
            <div className="flex items-start gap-4">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${r.iconBg}`}>
                <span className={`material-symbols-outlined icon-fill text-[20px] ${r.iconText}`}>
                  {r.icon}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-[#091E42]">{r.title}</p>
                <p className="mt-0.5 text-[13px] text-[#434654]">{r.desc}</p>
              </div>
              <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#c3c6d6] transition-colors group-hover:text-[#0052CC]">
                arrow_forward
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Medicines stock report */}
      <div className="rounded-lg border border-[#c3c6d6] bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c3c6d6] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined icon-fill text-[20px] text-[#434654]">medication</span>
            <p className="text-[15px] font-semibold text-[#091E42]">Status Stok Obat</p>
          </div>
          {report && (
            <div className="flex gap-2">
              {report.summary.out_stock > 0 && (
                <span className="rounded-full bg-[#FFEBE6] px-2.5 py-0.5 text-[11px] font-semibold text-[#BF2600]">
                  {report.summary.out_stock} habis
                </span>
              )}
              {report.summary.low_stock > 0 && (
                <span className="rounded-full bg-[#FFF0B3] px-2.5 py-0.5 text-[11px] font-semibold text-[#FF8B00]">
                  {report.summary.low_stock} menipis
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#c3c6d6] bg-[#f1f3ff]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654]">
                    Nama Obat
                  </th>
                  <th className="hidden px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654] sm:table-cell">
                    Kategori
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654]">
                    Stok
                  </th>
                  <th className="hidden px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654] sm:table-cell">
                    Min. Stok
                  </th>
                  <th className="hidden px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654] md:table-cell">
                    Harga
                  </th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {report?.medicines.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`border-b border-[#c3c6d6] last:border-0 transition-colors hover:bg-[#EBF4FF] ${idx % 2 === 1 ? 'bg-[#F4F5F7]' : 'bg-white'}`}
                  >
                    <td className="px-5 py-3">
                      <p className="text-[14px] font-semibold text-[#091E42]">{m.name}</p>
                      {m.generic_name && (
                        <p className="text-[12px] text-[#737685]">{m.generic_name}</p>
                      )}
                    </td>
                    <td className="hidden px-5 py-3 text-[14px] text-[#434654] sm:table-cell">
                      {m.category ?? '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[14px] font-semibold text-[#091E42] num-tabular">{m.stock}</span>
                      <span className="ml-1 text-[12px] text-[#737685]">{m.unit}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-right text-[14px] text-[#434654] num-tabular sm:table-cell">
                      {m.min_stock}
                    </td>
                    <td className="hidden px-5 py-3 text-right text-[14px] text-[#434654] num-tabular md:table-cell">
                      {formatRupiah(m.price)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={m.stock_status} type="stock" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
