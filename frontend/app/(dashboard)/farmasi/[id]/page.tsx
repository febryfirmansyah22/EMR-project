'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDateTime, formatRupiah } from '@/lib/utils'
import type { Prescription } from '@/types/prescription'
import type { ApiResponse } from '@/types/api'

export default function DetailFarmasiPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: rx, isLoading } = useQuery<Prescription>({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`)
      return res.data.data!
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['prescriptions', id] })
    queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/prescriptions/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status resep diperbarui'); invalidate() },
    onError:   () => toast.error('Gagal memperbarui status'),
  })

  const dispenseMutation = useMutation({
    mutationFn: () => api.post(`/prescriptions/${id}/dispense`),
    onSuccess: () => { toast.success('Resep berhasil didispensing'); invalidate() },
    onError:   () => toast.error('Gagal mendispensing resep'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!rx) return null

  const totalHarga = rx.items.reduce((sum, item) => sum + item.subtotal, 0)
  const canProcess  = rx.status === 'menunggu'
  const canDispense = rx.status === 'diproses'
  const canCancel   = ['menunggu', 'diproses'].includes(rx.status)

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`Resep ${rx.prescription_number}`}
        description={`Pasien: ${rx.visit?.patient?.name ?? '-'} · ${rx.visit?.patient?.medical_record_number ?? ''}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      {/* Status & actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c3c6d6] bg-[#f9f9ff] px-4 py-3">
        <StatusBadge status={rx.status} type="prescription" />
        <span className="text-[13px] text-[#737685]">
          {rx.status === 'menunggu'  ? 'Menunggu diproses' :
           rx.status === 'diproses' ? 'Sedang diproses' :
           rx.status === 'selesai'  ? `Selesai · ${rx.dispensed_at ? formatDateTime(rx.dispensed_at) : ''}` :
           'Dibatalkan'}
        </span>
        <div className="ml-auto flex gap-2">
          {canProcess && (
            <Button size="sm" variant="outline"
              onClick={() => statusMutation.mutate('diproses')}
              disabled={statusMutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              Mulai Proses
            </Button>
          )}
          {canDispense && (
            <Button size="sm"
              onClick={() => dispenseMutation.mutate()}
              disabled={dispenseMutation.isPending}
            >
              {dispenseMutation.isPending
                ? <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                : <span className="material-symbols-outlined text-[16px]">check_circle</span>}
              Selesai Dispensing
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              className="bg-[#FF5630] text-white hover:bg-[#BF2600] border-transparent"
              onClick={() => statusMutation.mutate('dibatalkan')}
              disabled={statusMutation.isPending}
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Batalkan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Daftar Obat */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Daftar Obat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {rx.items.map((item) => (
              <div key={item.id} className="py-3 border-b border-[#c3c6d6] last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-[#091E42]">{item.medicine?.name}</p>
                    <p className="text-[12px] text-[#737685] mt-0.5">
                      {item.quantity} {item.medicine?.unit} · {item.dosage}
                    </p>
                    {item.instructions && (
                      <p className="text-[12px] text-[#737685]">{item.instructions}</p>
                    )}
                    {item.notes && (
                      <p className="text-[12px] italic text-[#737685]">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] text-[#737685]">{formatRupiah(item.unit_price)} / {item.medicine?.unit}</p>
                    <p className="text-[14px] font-semibold text-[#091E42]">{formatRupiah(item.subtotal)}</p>
                  </div>
                </div>
              </div>
            ))}
            <Separator className="my-3" />
            <div className="flex justify-between text-[14px] font-semibold text-[#091E42]">
              <span>Total Obat</span>
              <span>{formatRupiah(totalHarga)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Info samping */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold text-[#091E42]">Info Resep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Dokter</p>
                <p className="font-medium text-[#091E42]">{rx.doctor?.user?.name ?? '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Kunjungan</p>
                <p className="font-mono text-[12px] text-[#434654]">{rx.visit?.visit_number ?? '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Dibuat</p>
                <p className="text-[#434654]">{formatDateTime(rx.created_at)}</p>
              </div>
              {rx.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Catatan Dokter</p>
                  <p className="italic text-[#434654]">{rx.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {rx.status === 'selesai' && rx.dispensed_by && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Info Dispensing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-[13px]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Disiapkan oleh</p>
                  <p className="font-medium text-[#091E42]">{rx.dispensed_by.name}</p>
                </div>
                {rx.dispensed_at && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Waktu</p>
                    <p className="text-[#434654]">{formatDateTime(rx.dispensed_at)}</p>
                  </div>
                )}
                {rx.pharmacist_notes && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685]">Catatan Apoteker</p>
                    <p className="italic text-[#434654]">{rx.pharmacist_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {rx.visit?.id && (
            <Button
              variant="outline" className="w-full" size="sm"
              onClick={() => router.push(`/kunjungan/${rx.visit!.id}`)}
            >
              Lihat Detail Kunjungan
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
