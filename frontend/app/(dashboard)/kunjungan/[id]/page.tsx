'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import api from '@/lib/api'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Visit, ExaminationFormData, MedicalRecordFormData } from '@/types/visit'
import type { ApiResponse } from '@/types/api'
import type { PaymentFormData } from '@/types/invoice'

// ─── Vital signs form schema ─────────────────────────────────────────────────
const examSchema = z.object({
  weight:                    z.coerce.number().positive().optional(),
  height:                    z.coerce.number().positive().optional(),
  blood_pressure_systolic:   z.coerce.number().positive().optional(),
  blood_pressure_diastolic:  z.coerce.number().positive().optional(),
  pulse:                     z.coerce.number().positive().optional(),
  temperature:               z.coerce.number().positive().optional(),
  respiratory_rate:          z.coerce.number().positive().optional(),
  oxygen_saturation:         z.coerce.number().min(0).max(100).optional(),
  blood_sugar:               z.coerce.number().positive().optional(),
  notes:                     z.string().optional(),
})

// ─── SOAP schema ─────────────────────────────────────────────────────────────
const soapSchema = z.object({
  soap_subjective:  z.string().min(1, 'Wajib diisi'),
  soap_objective:   z.string().min(1, 'Wajib diisi'),
  soap_assessment:  z.string().min(1, 'Wajib diisi'),
  soap_plan:        z.string().min(1, 'Wajib diisi'),
  doctor_notes:     z.string().optional(),
})

// ─── Payment schema ───────────────────────────────────────────────────────────
const paySchema = z.object({
  payment_method: z.enum(['tunai', 'bpjs', 'asuransi_swasta', 'debit', 'kredit']),
  payment_amount: z.coerce.number().min(0),
  discount:       z.coerce.number().min(0).optional(),
  notes:          z.string().optional(),
})

// ─── InfoRow helper ───────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-[#c3c6d6] last:border-0 text-[13px]">
      <span className="text-[#737685]">{label}</span>
      <span className="font-medium text-[#091E42] text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Vital stat tile ──────────────────────────────────────────────────────────
function VitalTile({ label, value, unit }: { label: string; value?: number | null; unit?: string }) {
  if (value == null) return null
  return (
    <div className="rounded-lg border border-[#c3c6d6] bg-[#f1f3ff] p-3 text-center">
      <p className="text-[20px] font-semibold text-[#091E42]">{value}<span className="text-[13px] font-normal ml-0.5 text-[#737685]">{unit}</span></p>
      <p className="text-[11px] text-[#737685] mt-0.5">{label}</p>
    </div>
  )
}

// ─── Status label map ─────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  terdaftar: 'Terdaftar',
  menunggu_pemeriksaan_awal: 'Menunggu Perawat',
  menunggu_dokter: 'Menunggu Dokter',
  sedang_diperiksa: 'Diperiksa',
  menunggu_obat: 'Menunggu Obat',
  menunggu_pembayaran: 'Menunggu Bayar',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
}

// ─── PAYMENT_METHOD options ───────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'bpjs', label: 'BPJS' },
  { value: 'asuransi_swasta', label: 'Asuransi Swasta' },
  { value: 'debit', label: 'Debit' },
  { value: 'kredit', label: 'Kartu Kredit' },
] as const

// ═════════════════════════════════════════════════════════════════════════════
export default function DetailKunjunganPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const role = user?.role ?? ''

  const { data: visit, isLoading } = useQuery<Visit>({
    queryKey: ['visits', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Visit>>(`/visits/${id}`)
      return res.data.data!
    },
    refetchInterval: 20_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['visits', id] })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/visits/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status diperbarui'); invalidate() },
    onError:   () => toast.error('Gagal memperbarui status'),
  })

  const examMutation = useMutation({
    mutationFn: (data: ExaminationFormData) =>
      visit?.examination
        ? api.put(`/visits/${id}/examination`, data)
        : api.post(`/visits/${id}/examination`, data),
    onSuccess: () => { toast.success('Pemeriksaan disimpan'); invalidate() },
    onError:   () => toast.error('Gagal menyimpan pemeriksaan'),
  })

  const soapMutation = useMutation({
    mutationFn: (data: MedicalRecordFormData) =>
      visit?.medical_record
        ? api.put(`/visits/${id}/medical-record`, data)
        : api.post(`/visits/${id}/medical-record`, data),
    onSuccess: () => { toast.success('SOAP disimpan'); invalidate() },
    onError:   () => toast.error('Gagal menyimpan SOAP'),
  })

  const payMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      api.post(`/invoices/${visit?.invoice?.id}/pay`, data),
    onSuccess: () => { toast.success('Pembayaran berhasil dicatat'); invalidate() },
    onError:   () => toast.error('Gagal mencatat pembayaran'),
  })

  const examForm = useForm<z.infer<typeof examSchema>>({ resolver: zodResolver(examSchema) as any })
  const soapForm = useForm<z.infer<typeof soapSchema>>({ resolver: zodResolver(soapSchema) })
  const payForm  = useForm<z.infer<typeof paySchema>>({ resolver: zodResolver(paySchema) as any, defaultValues: { discount: 0 } })

  const payMethod  = payForm.watch('payment_method')
  const payAmount  = payForm.watch('payment_amount') ?? 0
  const discount   = payForm.watch('discount') ?? 0
  const invoiceTotal = visit?.invoice ? visit.invoice.subtotal - discount : 0
  const change     = Math.max(0, payAmount - invoiceTotal)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (!visit) return null

  const isPerawat  = ['super_admin', 'perawat'].includes(role)
  const isDokter   = ['super_admin', 'dokter'].includes(role)
  const isFarmasi  = ['super_admin', 'farmasi'].includes(role)
  const isKasir    = ['super_admin', 'kasir'].includes(role)
  const canSeeSOAP = ['super_admin', 'dokter', 'perawat', 'admin_klinik'].includes(role)

  const exam = visit.examination
  const soap = visit.medical_record
  const rx   = visit.prescription
  const inv  = visit.invoice

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title={visit.patient?.name ?? 'Detail Kunjungan'}
        description={`${visit.visit_number} · Antrean No. ${visit.queue_number} · ${formatDate(visit.visit_date)}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c3c6d6] bg-[#f9f9ff] px-4 py-3">
        <StatusBadge status={visit.status} type="visit" />
        <span className="text-[13px] text-[#737685]">{STATUS_LABEL[visit.status]}</span>
        <div className="ml-auto flex gap-2">
          {isPerawat && visit.status === 'terdaftar' && (
            <Button size="sm" variant="outline"
              onClick={() => statusMutation.mutate('menunggu_pemeriksaan_awal')}
              disabled={statusMutation.isPending}
            >
              Panggil ke Perawat
            </Button>
          )}
          {isPerawat && visit.status === 'menunggu_pemeriksaan_awal' && (
            <Button size="sm"
              onClick={() => statusMutation.mutate('menunggu_dokter')}
              disabled={statusMutation.isPending}
            >
              Selesai Pemeriksaan Awal
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Button>
          )}
          {isDokter && visit.status === 'menunggu_dokter' && (
            <Button size="sm" variant="outline"
              onClick={() => statusMutation.mutate('sedang_diperiksa')}
              disabled={statusMutation.isPending}
            >
              Mulai Periksa
            </Button>
          )}
          {isDokter && visit.status === 'sedang_diperiksa' && !rx && (
            <Button size="sm"
              onClick={() => statusMutation.mutate('menunggu_pembayaran')}
              disabled={statusMutation.isPending}
            >
              Selesai (Tanpa Resep)
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Button>
          )}
          {isDokter && visit.status === 'sedang_diperiksa' && rx && (
            <Button size="sm"
              onClick={() => statusMutation.mutate('menunggu_obat')}
              disabled={statusMutation.isPending}
            >
              Kirim ke Farmasi
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="info">
        <TabsList className="w-full justify-start gap-0">
          <TabsTrigger value="info">
            <span className="material-symbols-outlined text-[15px]">person</span>
            Info
          </TabsTrigger>
          <TabsTrigger value="exam">
            <span className="material-symbols-outlined text-[15px]">stethoscope</span>
            Pemeriksaan
          </TabsTrigger>
          {canSeeSOAP && (
            <TabsTrigger value="soap">
              <span className="material-symbols-outlined text-[15px]">description</span>
              SOAP
            </TabsTrigger>
          )}
          {(isDokter || isFarmasi || isKasir) && (
            <TabsTrigger value="resep">
              <span className="material-symbols-outlined text-[15px]">medication</span>
              Resep
            </TabsTrigger>
          )}
          {(isKasir || ['admin_klinik', 'super_admin'].includes(role)) && (
            <TabsTrigger value="tagihan">
              <span className="material-symbols-outlined text-[15px]">receipt</span>
              Tagihan
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Info ──────────────────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Data Kunjungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="No. Kunjungan"  value={visit.visit_number} />
                <InfoRow label="No. Antrean"    value={String(visit.queue_number)} />
                <InfoRow label="Tanggal"        value={formatDate(visit.visit_date)} />
                <InfoRow label="Poli"           value={visit.poli?.name} />
                <InfoRow label="Dokter"         value={visit.doctor?.user?.name} />
                <InfoRow label="Keluhan"        value={visit.complaint} />
                <InfoRow label="Catatan"        value={visit.notes} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Data Pasien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Nama"      value={visit.patient?.name} />
                <InfoRow label="No. RM"   value={visit.patient?.medical_record_number} />
                <InfoRow label="Asuransi" value={
                  visit.patient?.insurance_type === 'umum' ? 'Umum' :
                  visit.patient?.insurance_type === 'bpjs' ? 'BPJS' : 'Asuransi Swasta'
                } />
              </CardContent>
              <div className="px-5 pb-4">
                <Button
                  variant="outline" size="sm" className="w-full"
                  onClick={() => router.push(`/pasien/${visit.patient_id}`)}
                >
                  Lihat Profil Lengkap Pasien
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Pemeriksaan Awal ─────────────────────────────────────────── */}
        <TabsContent value="exam" className="mt-4">
          {exam ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-[#091E42]">Hasil Pemeriksaan Awal</CardTitle>
                  <span className="text-[12px] text-[#737685]">{formatDateTime(exam.examined_at)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <VitalTile label="Berat Badan"    value={exam.weight}              unit="kg" />
                  <VitalTile label="Tinggi Badan"   value={exam.height}              unit="cm" />
                  <VitalTile label="Suhu"           value={exam.temperature}         unit="°C" />
                  <VitalTile label="Saturasi O₂"    value={exam.oxygen_saturation}   unit="%" />
                  <VitalTile label="Nadi"           value={exam.pulse}               unit="bpm" />
                  <VitalTile label="RR"             value={exam.respiratory_rate}    unit="/mnt" />
                  <VitalTile label="Gula Darah"     value={exam.blood_sugar}         unit="mg/dL" />
                  {exam.bmi && <VitalTile label={`IMT (${exam.bmi_category ?? ''})`} value={exam.bmi} />}
                </div>
                {(exam.blood_pressure_systolic || exam.blood_pressure_diastolic) && (
                  <div className="rounded-lg border border-[#c3c6d6] bg-[#f1f3ff] p-3 text-center">
                    <p className="text-[20px] font-semibold text-[#091E42]">
                      {exam.blood_pressure_systolic}/{exam.blood_pressure_diastolic}
                      <span className="text-[13px] font-normal ml-1 text-[#737685]">mmHg</span>
                    </p>
                    <p className="text-[11px] text-[#737685] mt-0.5">Tekanan Darah</p>
                  </div>
                )}
                {exam.notes && (
                  <div className="rounded-lg bg-[#f1f3ff] p-3 text-[13px]">
                    <p className="font-semibold text-[11px] text-[#737685] mb-1">Catatan</p>
                    <span className="text-[#434654]">{exam.notes}</span>
                  </div>
                )}
                {isPerawat && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[13px] text-[#0052CC] hover:underline">Edit pemeriksaan</summary>
                    <ExamForm form={examForm} onSubmit={(v) => examMutation.mutate(v)} isPending={examMutation.isPending} exam={exam} />
                  </details>
                )}
              </CardContent>
            </Card>
          ) : isPerawat ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Input Pemeriksaan Awal</CardTitle>
              </CardHeader>
              <CardContent>
                <ExamForm form={examForm} onSubmit={(v) => examMutation.mutate(v)} isPending={examMutation.isPending} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon="stethoscope" message="Belum ada data pemeriksaan awal." />
          )}
        </TabsContent>

        {/* ── Tab: SOAP ─────────────────────────────────────────────────────── */}
        {canSeeSOAP && (
          <TabsContent value="soap" className="mt-4 space-y-4">
            {soap ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[14px] font-semibold text-[#091E42]">Rekam Medis SOAP</CardTitle>
                      <span className="text-[12px] text-[#737685]">dr. {soap.doctor?.user?.name}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'S — Subjective', value: soap.soap_subjective },
                      { label: 'O — Objective',  value: soap.soap_objective },
                      { label: 'A — Assessment', value: soap.soap_assessment },
                      { label: 'P — Plan',       value: soap.soap_plan },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685] mb-1">{label}</p>
                        <p className="text-[14px] whitespace-pre-wrap text-[#434654]">{value}</p>
                      </div>
                    ))}
                    {soap.doctor_notes && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737685] mb-1">Catatan Dokter</p>
                        <p className="text-[14px] text-[#434654]">{soap.doctor_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Diagnoses */}
                {soap.diagnoses && soap.diagnoses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[14px] font-semibold text-[#091E42]">Diagnosis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {soap.diagnoses.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-[13px] py-2 border-b border-[#c3c6d6] last:border-0">
                          <div>
                            <span className="font-mono text-[11px] text-[#737685] mr-2">{d.code}</span>
                            <span className="text-[#434654]">{d.name}</span>
                          </div>
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                            style={d.pivot?.type === 'primer'
                              ? { backgroundColor: '#dae2ff', color: '#0052CC' }
                              : { backgroundColor: '#f1f3ff', color: '#434654' }
                            }
                          >
                            {d.pivot?.type === 'primer' ? 'Primer' : 'Sekunder'}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Tindakan */}
                {soap.actions && soap.actions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[14px] font-semibold text-[#091E42]">Tindakan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {soap.actions.map((a) => (
                        <div key={a.id} className="flex justify-between py-2.5 border-b border-[#c3c6d6] last:border-0 text-[13px]">
                          <div>
                            <span className="text-[#434654]">{a.name}</span>
                            {a.pivot?.notes && <p className="text-[12px] text-[#737685]">{a.pivot.notes}</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-[#737685]">×{a.pivot?.quantity ?? 1}</span>
                            <p className="font-semibold text-[#091E42]">{formatRupiah(a.price * (a.pivot?.quantity ?? 1))}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {isDokter && ['sedang_diperiksa', 'menunggu_obat', 'menunggu_pembayaran'].includes(visit.status) && (
                  <details>
                    <summary className="cursor-pointer text-[13px] text-[#0052CC] hover:underline">Edit SOAP</summary>
                    <div className="mt-3">
                      <SoapForm form={soapForm} onSubmit={(v) => soapMutation.mutate(v)} isPending={soapMutation.isPending} record={soap} />
                    </div>
                  </details>
                )}
              </>
            ) : isDokter ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[14px] font-semibold text-[#091E42]">Input SOAP</CardTitle>
                </CardHeader>
                <CardContent>
                  <SoapForm form={soapForm} onSubmit={(v) => soapMutation.mutate(v)} isPending={soapMutation.isPending} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState icon="description" message="Belum ada rekam medis." />
            )}
          </TabsContent>
        )}

        {/* ── Tab: Resep ────────────────────────────────────────────────────── */}
        {(isDokter || isFarmasi || isKasir) && (
          <TabsContent value="resep" className="mt-4">
            {rx ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[14px] font-semibold text-[#091E42]">Resep {rx.prescription_number}</CardTitle>
                    <StatusBadge status={rx.status} type="prescription" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  {rx.items.map((item) => (
                    <div key={item.id} className="py-2.5 border-b border-[#c3c6d6] last:border-0">
                      <div className="flex justify-between text-[13px]">
                        <span className="font-semibold text-[#091E42]">{item.medicine?.name}</span>
                        <span className="font-semibold text-[#091E42]">{formatRupiah(item.subtotal)}</span>
                      </div>
                      <p className="text-[12px] text-[#737685] mt-0.5">
                        {item.quantity} {item.medicine?.unit} · {item.dosage}
                        {item.instructions && ` · ${item.instructions}`}
                      </p>
                    </div>
                  ))}
                  {rx.notes && (
                    <div className="pt-3 text-[13px] text-[#737685]">
                      <span className="font-semibold">Catatan: </span>{rx.notes}
                    </div>
                  )}
                  {isFarmasi && (
                    <div className="pt-4">
                      <Button
                        size="sm" className="w-full"
                        onClick={() => router.push(`/farmasi/${rx.id}`)}
                      >
                        Kelola Resep di Farmasi
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : isDokter && ['sedang_diperiksa'].includes(visit.status) ? (
              <div className="rounded-xl border-2 border-dashed border-[#c3c6d6] p-8 text-center space-y-3">
                <span className="material-symbols-outlined text-[32px] text-[#737685] block">medication</span>
                <p className="text-[13px] text-[#737685]">Belum ada resep untuk kunjungan ini.</p>
                <Button size="sm" onClick={() => router.push(`/kunjungan/${id}/resep/baru`)}>
                  Buat Resep
                </Button>
              </div>
            ) : (
              <EmptyState icon="medication" message="Tidak ada resep untuk kunjungan ini." />
            )}
          </TabsContent>
        )}

        {/* ── Tab: Tagihan ──────────────────────────────────────────────────── */}
        {(isKasir || ['admin_klinik', 'super_admin'].includes(role)) && (
          <TabsContent value="tagihan" className="mt-4 space-y-4">
            {inv ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[14px] font-semibold text-[#091E42]">Invoice {inv.invoice_number}</CardTitle>
                      <StatusBadge status={inv.status} type="invoice" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    {inv.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2.5 border-b border-[#c3c6d6] last:border-0 text-[13px]">
                        <div>
                          <span className="text-[#434654]">{item.description}</span>
                          <p className="text-[12px] text-[#737685]">
                            {item.type === 'tindakan' ? 'Tindakan' : 'Obat'} · ×{item.quantity}
                          </p>
                        </div>
                        <span className="font-semibold text-[#091E42]">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                    <Separator className="my-3" />
                    <div className="space-y-1 text-[13px]">
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
                      <div className="flex justify-between font-semibold text-[15px] pt-1">
                        <span className="text-[#091E42]">Total</span>
                        <span className="text-[#091E42]">{formatRupiah(inv.total_amount)}</span>
                      </div>
                    </div>

                    {inv.status === 'lunas' && (
                      <div className="mt-4 rounded-lg bg-[#E3FCEF] border border-[#ABF5D1] p-3 text-[13px] space-y-1">
                        <p className="font-semibold text-[#006644]">Pembayaran Diterima</p>
                        <p className="text-[#006644]">
                          {PAYMENT_METHODS.find(m => m.value === inv.payment_method)?.label ?? inv.payment_method}
                          {' · '}{formatRupiah(inv.payment_amount ?? 0)}
                        </p>
                        {inv.payment_change && inv.payment_change > 0 && (
                          <p className="text-[#006644]">Kembalian: {formatRupiah(inv.payment_change)}</p>
                        )}
                        <p className="text-[12px] text-[#006644]">{inv.paid_at ? formatDateTime(inv.paid_at) : ''}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isKasir && inv.status === 'menunggu_pembayaran' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[14px] font-semibold text-[#091E42]">Proses Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={payForm.handleSubmit((v) => payMutation.mutate(v as PaymentFormData))} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Metode Pembayaran *</Label>
                            <Select onValueChange={(v) => payForm.setValue('payment_method', v as PaymentFormData['payment_method'])}>
                              <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                              <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {payForm.formState.errors.payment_method && (
                              <p className="text-[12px] text-[#FF5630]">{payForm.formState.errors.payment_method.message}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label>Diskon (Rp)</Label>
                            <Input type="number" min={0} {...payForm.register('discount')} placeholder="0" />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Jumlah Bayar (Rp) *</Label>
                            <Input type="number" min={0} {...payForm.register('payment_amount')} placeholder="0" />
                            {payForm.formState.errors.payment_amount && (
                              <p className="text-[12px] text-[#FF5630]">{payForm.formState.errors.payment_amount.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f1f3ff] p-3 text-[13px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#737685]">Total Tagihan</span>
                            <span className="font-semibold text-[#091E42]">{formatRupiah(invoiceTotal)}</span>
                          </div>
                          {payMethod && !['bpjs', 'asuransi_swasta'].includes(payMethod) && change > 0 && (
                            <div className="flex justify-between text-[#006644]">
                              <span>Kembalian</span>
                              <span className="font-semibold">{formatRupiah(change)}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label>Catatan</Label>
                          <Textarea {...payForm.register('notes')} placeholder="Opsional" rows={2} />
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
              </>
            ) : (
              <EmptyState
                icon="receipt"
                message={
                  ['menunggu_pembayaran', 'selesai', 'batal'].includes(visit.status)
                    ? 'Invoice sedang diproses...'
                    : 'Invoice belum dibuat. Invoice akan otomatis dibuat saat kunjungan selesai diperiksa.'
                }
              />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#c3c6d6] p-10 text-center space-y-3">
      <span className="material-symbols-outlined text-[36px] text-[#c3c6d6] block">{icon}</span>
      <p className="text-[13px] text-[#737685]">{message}</p>
    </div>
  )
}

function ExamForm({
  form, onSubmit, isPending, exam,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof examSchema>>>
  onSubmit: (v: ExaminationFormData) => void
  isPending: boolean
  exam?: Visit['examination']
}) {
  const { register, handleSubmit } = form

  const fields: { name: keyof z.infer<typeof examSchema>; label: string; unit?: string; step?: string }[] = [
    { name: 'weight',                   label: 'Berat Badan',     unit: 'kg',    step: '0.1' },
    { name: 'height',                   label: 'Tinggi Badan',    unit: 'cm',    step: '0.1' },
    { name: 'blood_pressure_systolic',  label: 'TD Sistolik',     unit: 'mmHg' },
    { name: 'blood_pressure_diastolic', label: 'TD Diastolik',    unit: 'mmHg' },
    { name: 'pulse',                    label: 'Nadi',            unit: 'bpm' },
    { name: 'temperature',              label: 'Suhu',            unit: '°C',   step: '0.1' },
    { name: 'respiratory_rate',         label: 'Frek. Napas',     unit: '/mnt' },
    { name: 'oxygen_saturation',        label: 'Saturasi O₂',     unit: '%' },
    { name: 'blood_sugar',              label: 'Gula Darah',      unit: 'mg/dL' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4 mt-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <Label className="text-[12px] text-[#737685]">{f.label} {f.unit && <span className="text-[#737685]">({f.unit})</span>}</Label>
            <Input
              type="number"
              step={f.step ?? '1'}
              placeholder="-"
              defaultValue={exam?.[f.name as keyof typeof exam] as number ?? ''}
              {...register(f.name)}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#737685]">Catatan</Label>
        <Textarea rows={2} defaultValue={exam?.notes ?? ''} {...register('notes')} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending && <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>}
        Simpan Pemeriksaan
      </Button>
    </form>
  )
}

function SoapForm({
  form, onSubmit, isPending, record,
}: {
  form: ReturnType<typeof useForm<z.infer<typeof soapSchema>>>
  onSubmit: (v: MedicalRecordFormData) => void
  isPending: boolean
  record?: Visit['medical_record']
}) {
  const { register, handleSubmit, formState: { errors } } = form

  const fields: { name: keyof z.infer<typeof soapSchema>; label: string; required?: boolean }[] = [
    { name: 'soap_subjective', label: 'S — Subjective (Keluhan)', required: true },
    { name: 'soap_objective',  label: 'O — Objective (Pemeriksaan)', required: true },
    { name: 'soap_assessment', label: 'A — Assessment (Diagnosis)', required: true },
    { name: 'soap_plan',       label: 'P — Plan (Tata Laksana)', required: true },
    { name: 'doctor_notes',    label: 'Catatan Tambahan Dokter' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label>{f.label}{f.required && ' *'}</Label>
          <Textarea
            rows={3}
            defaultValue={record?.[f.name as keyof typeof record] as string ?? ''}
            {...register(f.name)}
          />
          {errors[f.name] && <p className="text-[12px] text-[#FF5630]">{errors[f.name]?.message}</p>}
        </div>
      ))}
      <Button type="submit" disabled={isPending}>
        {isPending && <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>}
        Simpan SOAP
      </Button>
    </form>
  )
}
