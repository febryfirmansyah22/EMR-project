'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import type { Visit } from '@/types/visit'
import type { Medicine } from '@/types/master'
import type { ApiResponse } from '@/types/api'

const itemSchema = z.object({
  medicine_id:    z.number().int().positive('Pilih obat'),
  medicine_name:  z.string(),
  medicine_unit:  z.string(),
  medicine_price: z.number(),
  quantity:       z.coerce.number().int().min(1, 'Min. 1'),
  dosage:         z.string().min(1, 'Aturan pakai wajib diisi'),
  instructions:   z.string().optional(),
  notes:          z.string().optional(),
})

const schema = z.object({
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Tambahkan minimal 1 item obat'),
})

type FormValues = z.infer<typeof schema>

// ── Medicine search dropdown ───────────────────────────────────────────────────
function MedicineSearch({ onSelect }: { onSelect: (m: Medicine) => void }) {
  const [search,    setSearch]    = useState('')
  const [debounced, setDebounced] = useState('')
  const [open,      setOpen]      = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data: medicines, isFetching } = useQuery<Medicine[]>({
    queryKey: ['medicines-search', debounced],
    queryFn: async () => {
      if (debounced.length < 2) return []
      const res = await api.get<ApiResponse<Medicine[]>>('/medicines', {
        params: { search: debounced, per_page: 10 },
      })
      return res.data.data ?? []
    },
    enabled: debounced.length >= 2,
  })

  function select(m: Medicine) {
    onSelect(m)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">search</span>
        <Input
          placeholder="Cari nama obat..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {open && search.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#c3c6d6] bg-white shadow-card-lg max-h-60 overflow-y-auto">
          {isFetching ? (
            <div className="p-3 text-[13px] text-[#737685] text-center">Mencari...</div>
          ) : medicines && medicines.length > 0 ? (
            medicines.map((m) => (
              <button
                key={m.id}
                type="button"
                className="w-full px-4 py-2.5 text-left hover:bg-[#f1f3ff] first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
                onMouseDown={() => select(m)}
                disabled={m.stock === 0}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-[#091E42]">{m.name}</p>
                    {m.generic_name && (
                      <p className="text-[12px] text-[#737685]">{m.generic_name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[12px] font-medium text-[#434654]">{formatRupiah(m.price)}/{m.unit}</p>
                    <p className={`text-[12px] ${m.stock === 0 ? 'text-[#FF5630]' : 'text-[#737685]'}`}>
                      Stok: {m.stock} {m.unit}
                    </p>
                  </div>
                </div>
                {m.stock === 0 && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#FFEBE6] text-[#BF2600] mt-0.5">Stok habis</span>
                )}
              </button>
            ))
          ) : (
            <div className="p-3 text-[13px] text-[#737685] text-center">
              Obat tidak ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function BuatResepPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const queryClient = useQueryClient()

  const { data: visit } = useQuery<Visit>({
    queryKey: ['visits', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Visit>>(`/visits/${id}`)
      return res.data.data!
    },
  })

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const items = watch('items')
  const totalEstimate = items.reduce((sum, item) => {
    return sum + (item.medicine_price || 0) * (Number(item.quantity) || 0)
  }, 0)

  function addMedicine(m: Medicine) {
    if (fields.some(f => f.medicine_id === m.id)) {
      toast.info(`${m.name} sudah ada dalam daftar`)
      return
    }
    append({
      medicine_id:    m.id,
      medicine_name:  m.name,
      medicine_unit:  m.unit,
      medicine_price: m.price,
      quantity:       1,
      dosage:         '',
      instructions:   '',
      notes:          '',
    })
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        notes: values.notes || undefined,
        items: values.items.map(({ medicine_id, quantity, dosage, instructions, notes }) => ({
          medicine_id, quantity, dosage,
          instructions: instructions || undefined,
          notes: notes || undefined,
        })),
      }
      return api.post(`/visits/${id}/prescription`, payload)
    },
    onSuccess: () => {
      toast.success('Resep berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: ['visits', id] })
      router.push(`/kunjungan/${id}`)
    },
    onError: () => toast.error('Gagal membuat resep'),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Buat Resep"
        description={visit?.patient?.name ? `Pasien: ${visit.patient.name}` : `Kunjungan ${id}`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        {/* Medicine search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Tambah Obat</CardTitle>
          </CardHeader>
          <CardContent>
            <MedicineSearch onSelect={addMedicine} />
          </CardContent>
        </Card>

        {/* Item list */}
        {fields.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[14px] font-semibold text-[#091E42]">Daftar Obat</CardTitle>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#dae2ff] text-[#0052CC]">
                  {fields.length} item
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => {
                const item = items[index]
                return (
                  <div key={field.id} className="rounded-lg border border-[#c3c6d6] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-[#091E42]">{field.medicine_name}</p>
                        <p className="text-[12px] text-[#737685]">
                          {formatRupiah(field.medicine_price)} / {field.medicine_unit}
                        </p>
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="text-[#FF5630] hover:text-[#FF5630] hover:bg-[#FFEBE6]"
                        onClick={() => remove(index)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[12px]">Jumlah ({field.medicine_unit}) *</Label>
                        <Input type="number" min={1} {...register(`items.${index}.quantity`)} />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-[12px] text-[#FF5630]">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[12px]">Aturan Pakai *</Label>
                        <Input placeholder="3x1 tablet / 2x sehari" {...register(`items.${index}.dosage`)} />
                        {errors.items?.[index]?.dosage && (
                          <p className="text-[12px] text-[#FF5630]">{errors.items[index]?.dosage?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[12px]">Petunjuk</Label>
                        <Input placeholder="Sesudah makan, Sebelum tidur..." {...register(`items.${index}.instructions`)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[12px]">Catatan</Label>
                        <Input placeholder="Catatan untuk apoteker..." {...register(`items.${index}.notes`)} />
                      </div>
                    </div>

                    <div className="text-right text-[12px] text-[#737685]">
                      Subtotal:{' '}
                      <span className="font-semibold text-[#091E42]">
                        {formatRupiah((field.medicine_price || 0) * (Number(item?.quantity) || 0))}
                      </span>
                    </div>
                  </div>
                )
              })}

              <Separator />
              <div className="flex justify-between text-[14px] font-semibold text-[#091E42]">
                <span>Estimasi Total</span>
                <span>{formatRupiah(totalEstimate)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {errors.items?.root && (
          <p className="text-[13px] text-[#FF5630]">{errors.items.root.message}</p>
        )}
        {typeof errors.items?.message === 'string' && (
          <p className="text-[13px] text-[#FF5630]">{errors.items.message}</p>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold text-[#091E42]">Catatan Resep</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              rows={2}
              placeholder="Catatan tambahan untuk apoteker (opsional)..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
          <Button type="submit" disabled={mutation.isPending || fields.length === 0}>
            {mutation.isPending && (
              <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
            )}
            Kirim Resep ke Farmasi
          </Button>
        </div>
      </form>
    </div>
  )
}
