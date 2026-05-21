'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import Cookies from 'js-cookie'
import type { RevenueReport } from '@/types/report'
import type { ApiResponse } from '@/types/api'

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  tunai:           'Tunai',
  bpjs:            'BPJS',
  asuransi_swasta: 'Asuransi Swasta',
  debit:           'Debit',
  kredit:          'Kartu Kredit',
}

function defaultDateRange() {
  const to   = new Date()
  const from = new Date()
  from.setDate(1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const TONE_STYLES: Record<string, { box: string; icon: string }> = {
  primary: { box: 'bg-[#dae2ff]', icon: 'text-[#0052CC]' },
  success: { box: 'bg-[#E3FCEF]', icon: 'text-[#006644]' },
  warning: { box: 'bg-[#FFF0B3]', icon: 'text-[#FF8B00]' },
  sky:     { box: 'bg-[#E6FCFF]', icon: 'text-[#00A3BF]' },
}

function StatCard({ title, value, sub, icon, tone = 'primary' }: {
  title: string; value: string; sub?: string; icon: string; tone?: string
}) {
  const t = TONE_STYLES[tone] ?? TONE_STYLES.primary
  return (
    <div className="rounded-lg border border-[#c3c6d6] bg-white p-5 hover:shadow-card transition-shadow duration-150">
      <div className={`inline-flex rounded-lg p-2 mb-3 ${t.box}`}>
        <span className={`material-symbols-outlined text-[20px] ${t.icon}`}>{icon}</span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">{title}</p>
      <p className="text-[24px] font-bold text-[#091E42] leading-tight mt-0.5 num-tabular">{value}</p>
      {sub && <p className="text-[12px] text-[#737685] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Mini bar chart (pure CSS) ─────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { period: string; revenue: number }[] }) {
  if (!data.length) return null
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="flex items-end gap-1 h-32 mt-4">
      {data.map((d) => {
        const pct = Math.round((d.revenue / maxRevenue) * 100)
        return (
          <div key={d.period} className="flex flex-col items-center flex-1 min-w-0 gap-1">
            <div className="relative w-full flex flex-col justify-end" style={{ height: '96px' }}>
              <div
                className="w-full rounded-t bg-[#0052CC] transition-all duration-500"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${d.period}: ${formatRupiah(d.revenue)}`}
              />
            </div>
            <span className="text-[9px] text-[#737685] truncate w-full text-center">
              {d.period.length > 8 ? d.period.slice(5) : d.period}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function LaporanPendapatanPage() {
  const defaults = defaultDateRange()
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo,   setDateTo]   = useState(defaults.to)
  const [groupBy,  setGroupBy]  = useState('daily')

  const { data: report, isLoading } = useQuery<RevenueReport>({
    queryKey: ['reports', 'revenue', { dateFrom, dateTo, groupBy }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RevenueReport>>('/reports/revenue', {
        params: { date_from: dateFrom, date_to: dateTo, group_by: groupBy },
      })
      return res.data.data!
    },
  })

  async function handleExport() {
    const token = Cookies.get('auth_token')
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, group_by: groupBy })
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
    const url = `${baseUrl}/reports/revenue/export?${params}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-pendapatan-${dateFrom}-${dateTo}.csv`
    link.click()
  }

  const summary = report?.summary

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan Pendapatan"
        description="Analisis pendapatan klinik per periode"
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
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Tanggal Mulai</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Tanggal Akhir</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Kelompokkan per</Label>
            <Select value={groupBy} onValueChange={(v) => v && setGroupBy(v as string)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pendapatan"
            value={formatRupiah(summary.total_revenue)}
            sub={`${summary.total_invoices} invoice lunas`}
            icon="trending_up"
            tone="success"
          />
          <StatCard
            title="Rata-rata / Invoice"
            value={formatRupiah(summary.avg_revenue)}
            icon="bar_chart"
            tone="primary"
          />
          <StatCard
            title="Total Diskon"
            value={formatRupiah(summary.total_discount)}
            icon="percent"
            tone="warning"
          />
          <StatCard
            title="Total Invoice"
            value={String(summary.total_invoices)}
            sub="Invoice lunas"
            icon="credit_card"
            tone="sky"
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Tren Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-36 w-full" />
            ) : report?.breakdown && report.breakdown.length > 0 ? (
              <MiniBarChart
                data={report.breakdown.map(b => ({ period: b.period, revenue: b.revenue }))}
              />
            ) : (
              <div className="h-36 flex items-center justify-center text-[13px] text-[#737685]">
                Tidak ada data untuk periode ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* By payment method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Per Metode Bayar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : report?.by_payment_method?.map((m) => (
              <div key={m.payment_method} className="flex justify-between py-2.5 border-b border-[#c3c6d6] last:border-0 text-[13px]">
                <div>
                  <p className="font-semibold text-[#091E42]">{PAYMENT_METHOD_LABEL[m.payment_method] ?? m.payment_method}</p>
                  <p className="text-[12px] text-[#737685]">{m.count} transaksi</p>
                </div>
                <span className="text-[14px] font-semibold text-[#091E42] num-tabular">{formatRupiah(m.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold text-[#091E42]">Detail per {groupBy === 'daily' ? 'Hari' : 'Bulan'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#c3c6d6] bg-[#f1f3ff]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Periode</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Invoice</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Diskon</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#737685]">Memuat...</td>
                  </tr>
                ) : report?.breakdown?.length ? (
                  report.breakdown.map((b, i) => (
                    <tr key={b.period} className={`border-b border-[#c3c6d6] last:border-0 hover:bg-[#EBF4FF] transition-colors ${i % 2 === 1 ? 'bg-[#F4F5F7]' : 'bg-white'}`}>
                      <td className="px-4 py-3 font-medium text-[#091E42]">{b.period}</td>
                      <td className="px-4 py-3 text-right text-[#737685]">{b.invoices}</td>
                      <td className="px-4 py-3 text-right text-[#FF5630]">
                        {b.discount > 0 ? `-${formatRupiah(b.discount)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#091E42] num-tabular">{formatRupiah(b.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#737685]">
                      Tidak ada data untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
              {report?.summary && report.breakdown?.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[#c3c6d6] bg-[#f1f3ff]">
                    <td className="px-4 py-3 font-semibold text-[#091E42]">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#091E42]">{report.summary.total_invoices}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#FF5630]">
                      {report.summary.total_discount > 0 ? `-${formatRupiah(report.summary.total_discount)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#006644] num-tabular">
                      {formatRupiah(report.summary.total_revenue)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
