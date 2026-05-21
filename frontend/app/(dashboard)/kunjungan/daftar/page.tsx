'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import type { Patient } from '@/types/patient'
import type { Poli, Doctor } from '@/types/master'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  patient_id: z.number().int().positive('Pilih pasien'),
  poli_id:    z.number().int().positive('Pilih poli'),
  doctor_id:  z.number().optional(),
  complaint:  z.string().optional(),
  notes:      z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function DaftarKunjunganPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { setValue, watch, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedPoliId = watch('poli_id')

  const { data: patients, isFetching: searchLoading } = useQuery<Patient[]>({
    queryKey: ['patients-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const res = await api.get<ApiResponse<Patient[]>>('/patients', {
        params: { search: debouncedSearch, per_page: 10 },
      })
      return res.data.data ?? []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: polis } = useQuery<Poli[]>({
    queryKey: ['polis'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Poli[]>>('/polis')
      return res.data.data ?? []
    },
  })

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['doctors', selectedPoliId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Doctor[]>>('/doctors', {
        params: { poli_id: selectedPoliId },
      })
      return res.data.data ?? []
    },
    enabled: !!selectedPoliId,
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await api.post('/visits', values)
      return res.data.data
    },
    onSuccess: (data) => {
      toast.success('Kunjungan berhasil didaftarkan')
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      router.push(`/kunjungan/${data.id}`)
    },
    onError: () => toast.error('Gagal mendaftarkan kunjungan'),
  })

  function selectPatient(p: Patient) {
    setSelectedPatient(p)
    setValue('patient_id', p.id, { shouldValidate: true })
    setSearch('')
    setShowDropdown(false)
  }

  function clearPatient() {
    setSelectedPatient(null)
    setValue('patient_id', undefined as unknown as number)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Daftarkan Kunjungan"
        description="Pendaftaran pasien untuk kunjungan hari ini"
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        {/* Pilih Pasien */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Pasien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-[#c3c6d6] bg-[#f9f9ff] px-4 py-3">
                <div>
                  <p className="text-[14px] font-semibold text-[#091E42]">{selectedPatient.name}</p>
                  <p className="text-[12px] text-[#737685]">
                    {selectedPatient.medical_record_number} · {selectedPatient.phone}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={clearPatient}>
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">search</span>
                  <Input
                    placeholder="Cari nama atau no. RM pasien..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                </div>
                {showDropdown && (search.length >= 2) && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#c3c6d6] bg-white shadow-card-lg">
                    {searchLoading ? (
                      <div className="p-3 text-[13px] text-[#737685] text-center">Mencari...</div>
                    ) : patients && patients.length > 0 ? (
                      patients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left hover:bg-[#f1f3ff] first:rounded-t-lg last:rounded-b-lg"
                          onMouseDown={() => selectPatient(p)}
                        >
                          <p className="text-[14px] font-medium text-[#091E42]">{p.name}</p>
                          <p className="text-[12px] text-[#737685]">{p.medical_record_number}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-[13px] text-[#737685] text-center">
                        Tidak ditemukan.{' '}
                        <button
                          type="button"
                          className="text-[#0052CC] underline"
                          onMouseDown={() => router.push('/pasien/baru')}
                        >
                          Daftarkan pasien baru
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.patient_id && (
              <p className="text-[12px] text-[#FF5630]">{errors.patient_id.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Poli & Dokter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Poli &amp; Dokter</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Poli *</Label>
              <Select onValueChange={(v) => {
                setValue('poli_id', parseInt(v as string), { shouldValidate: true })
                setValue('doctor_id', undefined)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih poli tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {polis?.filter(p => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.poli_id && (
                <p className="text-[12px] text-[#FF5630]">{errors.poli_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Dokter</Label>
              <Select
                disabled={!selectedPoliId || !doctors?.length}
                onValueChange={(v) => setValue('doctor_id', parseInt(v as string))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedPoliId ? 'Pilih poli dulu' :
                    !doctors?.length ? 'Tidak ada dokter' :
                    'Pilih dokter (opsional)'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.filter(d => d.is_active).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.user?.name}
                      {d.specialization && (
                        <span className="ml-1 text-[12px] text-[#737685]">· {d.specialization}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Keluhan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Keluhan &amp; Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Keluhan Utama</Label>
              <Textarea
                placeholder="Tuliskan keluhan pasien secara singkat..."
                rows={3}
                onChange={(e) => setValue('complaint', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan Tambahan</Label>
              <Textarea
                placeholder="Catatan lain jika diperlukan..."
                rows={2}
                onChange={(e) => setValue('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
            )}
            Daftarkan Kunjungan
          </Button>
        </div>
      </form>
    </div>
  )
}
