'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import type { PatientFormData } from '@/types/patient'

const schema = z.object({
  name:           z.string().min(2, 'Nama minimal 2 karakter'),
  nik:            z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  birth_date:     z.string().min(1, 'Tanggal lahir wajib diisi'),
  birth_place:    z.string().min(1, 'Tempat lahir wajib diisi'),
  gender:         z.enum(['laki-laki', 'perempuan']),
  blood_type:     z.string().optional(),
  address:        z.string().min(5, 'Alamat wajib diisi'),
  phone:          z.string().min(9, 'Nomor telepon tidak valid'),
  email:          z.string().email('Format email tidak valid').optional().or(z.literal('')),
  insurance_type: z.enum(['umum', 'bpjs', 'asuransi_swasta']),
  insurance_number: z.string().optional(),
  emergency_name:     z.string().optional(),
  emergency_phone:    z.string().optional(),
  emergency_relation: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function TambahPasienPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'laki-laki', insurance_type: 'umum' },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: PatientFormData = {
        name:           values.name,
        nik:            values.nik,
        birth_date:     values.birth_date,
        birth_place:    values.birth_place,
        gender:         values.gender,
        blood_type:     values.blood_type || undefined,
        address:        values.address,
        phone:          values.phone,
        email:          values.email || undefined,
        insurance_type: values.insurance_type,
        insurance_number: values.insurance_number || undefined,
        emergency_contact: values.emergency_name ? {
          name:     values.emergency_name,
          phone:    values.emergency_phone ?? '',
          relation: values.emergency_relation ?? '',
        } : undefined,
      }
      const res = await api.post('/patients', payload)
      return res.data
    },
    onSuccess: () => {
      toast.success('Pasien berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      router.push('/pasien')
    },
    onError: () => toast.error('Gagal menambahkan pasien'),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Tambah Pasien Baru"
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nama Lengkap *</Label>
              <Input {...register('name')} placeholder="Nama sesuai KTP" />
              {errors.name && <p className="text-[12px] text-[#FF5630]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>NIK *</Label>
              <Input {...register('nik')} placeholder="16 digit NIK KTP" maxLength={16} />
              {errors.nik && <p className="text-[12px] text-[#FF5630]">{errors.nik.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kelamin *</Label>
              <Select defaultValue="laki-laki" onValueChange={(v) => setValue('gender', v as 'laki-laki' | 'perempuan')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tempat Lahir *</Label>
              <Input {...register('birth_place')} placeholder="Kota/Kabupaten" />
              {errors.birth_place && <p className="text-[12px] text-[#FF5630]">{errors.birth_place.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Lahir *</Label>
              <Input type="date" {...register('birth_date')} />
              {errors.birth_date && <p className="text-[12px] text-[#FF5630]">{errors.birth_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Golongan Darah</Label>
              <Select onValueChange={(v) => setValue('blood_type', v as string)}>
                <SelectTrigger><SelectValue placeholder="Pilih golongan darah" /></SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Kontak</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Alamat *</Label>
              <Textarea {...register('address')} placeholder="Alamat lengkap" rows={2} />
              {errors.address && <p className="text-[12px] text-[#FF5630]">{errors.address.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>No. Telepon *</Label>
              <Input {...register('phone')} placeholder="08xx-xxxx-xxxx" />
              {errors.phone && <p className="text-[12px] text-[#FF5630]">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register('email')} type="email" placeholder="email@contoh.com" />
              {errors.email && <p className="text-[12px] text-[#FF5630]">{errors.email.message}</p>}
            </div>
            <Separator className="sm:col-span-2" />
            <div className="space-y-1.5">
              <Label>Nama Kontak Darurat</Label>
              <Input {...register('emergency_name')} placeholder="Nama kerabat" />
            </div>
            <div className="space-y-1.5">
              <Label>Telepon Darurat</Label>
              <Input {...register('emergency_phone')} placeholder="08xx-xxxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Hubungan</Label>
              <Input {...register('emergency_relation')} placeholder="Istri, Suami, Orang Tua..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Asuransi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Jenis Asuransi *</Label>
              <Select defaultValue="umum" onValueChange={(v) => setValue('insurance_type', v as 'umum' | 'bpjs' | 'asuransi_swasta')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="umum">Umum</SelectItem>
                  <SelectItem value="bpjs">BPJS</SelectItem>
                  <SelectItem value="asuransi_swasta">Asuransi Swasta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watch('insurance_type') !== 'umum' && (
              <div className="space-y-1.5">
                <Label>No. Kartu Asuransi</Label>
                <Input {...register('insurance_number')} placeholder="Nomor kartu" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
            )}
            Simpan Pasien
          </Button>
        </div>
      </form>
    </div>
  )
}
