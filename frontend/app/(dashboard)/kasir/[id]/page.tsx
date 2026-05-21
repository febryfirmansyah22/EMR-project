'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/utils'
import type { Invoice, PaymentFormData } from '@/types/invoice'
import type { ApiResponse } from '@/types/api'

const PAYMENT_METHODS = [
  { value: 'tunai',           label: 'Tunai' },
  { value: 'bpjs',            label: 'BPJS' },
  { value: 'asuransi_swasta', label: 'Asuransi Swasta' },
  { value: 'debit',           label: 'Debit' },
  { value: 'kredit',          label: 'Kartu Kredit' },
] as const

const paySchema = z.object({
  payment_method: z.enum(['tunai', 'bpjs', 'asuransi_swasta', 'debit', 'kredit']),
  payment_amount: z.coerce.number().min(0),
  discount:       z.coerce.number().min(0).optional(),
  notes:          z.string().optional(),
})

type PaySchema = z.infer<typeof paySchema>

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-[#c3c6d6] last:border-0 text-[13px]">
      <span className="text-[#737685]">{label}</span>
      <span className="font-medium text-[#091E42]">{value}</span>
    </div>
  )
}

export default function DetailKasirPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const queryClient = useQueryClient()

  const { data: inv, isLoading } = useQuery<Invoice>({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`)
      return res.data.data!
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaySchema>({
    resolver: zodResolver(paySchema) as any,
    defaultValues: { discount: 0 },
  })

  const payMethod = watch('payment_method')
  const payAmount = watch('payment_amount') ?? 0
  const discount  = watch('discount') ?? 0
  const subtotal  = inv?.subtotal ?? 0
  const totalAfterDiscount = Math.max(0, subtotal - discount)
  const change = Math.max(0, payAmount - totalAfterDiscount)

  const payMutation = useMutation({
    mutationFn: (data: PaymentFormData) => api.post(`/invoices/${id}/pay`, data),
    onSuccess: () => {
      toast.success('Pembayaran berhasil dicatat')
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('Gagal mencatat pembayaran'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/cancel`),
    onSuccess: () => {
      toast.success('Invoice dibatalkan')
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('Gagal membatalkan invoice'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!inv) return null

  const isPending   = inv.status === 'menunggu_pembayaran'
  const isPaid      = inv.status === 'lunas'

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`Invoice ${inv.invoice_number}`}
        description={`${inv.patient?.name ?? '-'} · ${inv.visit?.visit_date ? formatDate(inv.visit.visit_date) : ''}`}
        action={
          <div className="flex gap-2">
            {isPaid && (
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <span className="material-symbols-outlined text-[16px]">print</span>
                Cetak
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali
            </Button>
          </div>
        }
      />

      {/* Status */}
      <div className="flex items-center gap-3 rounded-xl border border-[#c3c6d6] bg-[#f9f9ff] px-4 py-3">
        <StatusBadge status={inv.status} type="invoice" />
        <span className="text-[13px] text-[#737685]">
          {isPending ? 'Menunggu pembayaran dari pasien' :
           isPaid    ? `Lunas · ${inv.paid_at ? formatDateTime(inv.paid_at) : ''}` :
           'Invoice dibatalkan'}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Invoice items */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Rincian Tagihan</CardTitle>
          </CardHeader>
          <CardContent>
            {inv.items.length === 0 ? (
              <p className="text-[13px] text-[#737685] text-center py-4">Tidak ada item tagihan.</p>
            ) : (
              <>
                <div className="space-y-0">
                  {inv.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2.5 border-b border-[#c3c6d6] last:border-0 text-[13px]">
                      <div>
                        <p className="text-[#434654]">{item.description}</p>
                        <p className="text-[12px] text-[#737685]">
                          {item.type === 'tindakan' ? 'Tindakan' : 'Obat'} · ×{item.quantity} · {formatRupiah(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-semibold text-[#091E42] shrink-0 ml-4">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#737685]">Subtotal</span>
                    <span className="text-[#434654]">{formatRupiah(inv.subtotal)}</span>
                  </div>
                  {inv.discount > 0 && (
                    <div className="flex justify-between text-[#FF5630]">
                      <span>Diskon</span>
                      <span>-{formatRupiah(inv.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-[15px] pt-1 text-[#091E42]">
                    <span>Total</span>
                    <span>{formatRupiah(inv.total_amount > 0 ? inv.total_amount : subtotal)}</span>
                  </div>
                </div>

                {isPaid && (
                  <>
                    <Separator className="my-3" />
                    <div className="rounded-lg bg-[#E3FCEF] border border-[#ABF5D1] p-3 space-y-1 text-[13px]">
                      <p className="font-semibold text-[#006644]">Pembayaran Diterima</p>
                      <div className="text-[#006644] space-y-0.5">
                        <p>Metode: {PAYMENT_METHODS.find(m => m.value === inv.payment_method)?.label ?? inv.payment_method}</p>
                        <p>Jumlah: {formatRupiah(inv.payment_amount ?? 0)}</p>
                        {inv.payment_change && inv.payment_change > 0 && (
                          <p>Kembalian: {formatRupiah(inv.payment_change)}</p>
                        )}
                        <p className="text-[12px]">
                          Kasir: {inv.paid_by?.name ?? '-'} · {inv.paid_at ? formatDateTime(inv.paid_at) : ''}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold text-[#091E42]">Informasi Pasien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Nama"      value={inv.patient?.name} />
              <InfoRow label="No. RM"   value={inv.patient?.medical_record_number} />
              <InfoRow label="Asuransi" value={
                inv.patient?.insurance_type === 'umum' ? 'Umum' :
                inv.patient?.insurance_type === 'bpjs' ? 'BPJS' : 'Asuransi Swasta'
              } />
              {inv.patient?.insurance_number && (
                <InfoRow label="No. Kartu" value={inv.patient.insurance_number} />
              )}
            </CardContent>
          </Card>

          {/* Payment form — only when pending */}
          {isPending && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Proses Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((v) => payMutation.mutate(v as PaymentFormData))} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Metode *</Label>
                    <Select onValueChange={(v) => setValue('payment_method', v as PaySchema['payment_method'])}>
                      <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.payment_method && (
                      <p className="text-[12px] text-[#FF5630]">{errors.payment_method.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Diskon (Rp)</Label>
                    <Input type="number" min={0} {...register('discount')} placeholder="0" />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Jumlah Bayar (Rp) *</Label>
                    <Input type="number" min={0} {...register('payment_amount')} />
                    {errors.payment_amount && (
                      <p className="text-[12px] text-[#FF5630]">{errors.payment_amount.message}</p>
                    )}
                  </div>

                  {/* Live summary */}
                  <div className="rounded-lg bg-[#f1f3ff] p-3 text-[13px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#737685]">Total tagihan</span>
                      <span className="font-semibold text-[#091E42]">{formatRupiah(totalAfterDiscount)}</span>
                    </div>
                    {payMethod && !['bpjs', 'asuransi_swasta'].includes(payMethod) && change > 0 && (
                      <div className="flex justify-between text-[#006644] font-medium">
                        <span>Kembalian</span>
                        <span>{formatRupiah(change)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Catatan</Label>
                    <Textarea rows={2} {...register('notes')} placeholder="Opsional" />
                  </div>

                  <Button type="submit" className="w-full" disabled={payMutation.isPending}>
                    {payMutation.isPending && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                    )}
                    Konfirmasi Pembayaran
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isPending && (
            <Button
              variant="outline"
              className="w-full text-[#FF5630] border-[#FF5630]/40 hover:bg-[#FFEBE6]"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (confirm('Batalkan invoice ini?')) cancelMutation.mutate()
              }}
            >
              Batalkan Invoice
            </Button>
          )}

          {inv.visit?.id && (
            <Button
              variant="outline" size="sm" className="w-full"
              onClick={() => router.push(`/kunjungan/${inv.visit!.id}`)}
            >
              Lihat Detail Kunjungan
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
