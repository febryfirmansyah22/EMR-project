'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import type { Medicine } from '@/types/master'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  name:         z.string().min(2, 'Nama wajib diisi'),
  generic_name: z.string().optional(),
  category:     z.string().optional(),
  unit:         z.string().min(1, 'Satuan wajib diisi'),
  price:        z.coerce.number().min(0, 'Harga tidak valid'),
  stock:        z.coerce.number().int().min(0, 'Stok tidak valid'),
  min_stock:    z.coerce.number().int().min(0, 'Min. stok tidak valid'),
  description:  z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function MasterObatPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [open,   setOpen]   = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['medicines', { search, page }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Medicine[]>>('/medicines', {
        params: { search: search || undefined, page, per_page: 15 },
      })
      return res.data
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', generic_name: '', category: '', unit: '', price: 0, stock: 0, min_stock: 10 })
    setOpen(true)
  }

  function openEdit(m: Medicine) {
    setEditing(m)
    reset({
      name:         m.name,
      generic_name: m.generic_name ?? '',
      category:     m.category ?? '',
      unit:         m.unit,
      price:        m.price,
      stock:        m.stock,
      min_stock:    m.min_stock,
      description:  m.description ?? '',
    })
    setOpen(true)
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? api.put(`/medicines/${editing.id}`, values)
        : api.post('/medicines', values),
    onSuccess: () => {
      toast.success(editing ? 'Data obat diperbarui' : 'Obat berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['medicines'] })
      setOpen(false)
    },
    onError: () => toast.error('Gagal menyimpan data obat'),
  })

  const columns: Column<Medicine>[] = [
    {
      key: 'name',
      header: 'Nama Obat',
      cell: (m) => (
        <div>
          <p className="text-[14px] font-semibold text-[#091E42]">{m.name}</p>
          {m.generic_name && <p className="text-[12px] text-[#737685]">{m.generic_name}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (m) => <span className="text-[14px] text-[#434654]">{m.category ?? '-'}</span>,
    },
    {
      key: 'price',
      header: 'Harga',
      cell: (m) => <span className="text-[14px] font-medium text-[#091E42] num-tabular">{formatRupiah(m.price)}</span>,
    },
    {
      key: 'stock',
      header: 'Stok',
      cell: (m) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-[14px] font-semibold num-tabular ${m.stock === 0 ? 'text-[#FF5630]' : m.stock <= m.min_stock ? 'text-[#FF8B00]' : 'text-[#091E42]'}`}>
            {m.stock}
          </span>
          <span className="text-[12px] text-[#737685]">{m.unit}</span>
          {m.stock <= m.min_stock && m.stock > 0 && (
            <span className="material-symbols-outlined icon-fill text-[14px] text-[#FF8B00]">warning</span>
          )}
          {m.stock === 0 && (
            <span className="rounded-full bg-[#FFEBE6] px-2 py-0.5 text-[10px] font-semibold text-[#BF2600]">Habis</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (m) => (
        <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(m) }}>
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Obat"
        description="Kelola data obat dan stok"
        action={
          <Button size="sm" onClick={openCreate}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Obat
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">search</span>
          <Input
            placeholder="Cari nama obat..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {data?.meta && (
          <p className="text-[13px] text-[#737685]">{data.meta.total} obat</p>
        )}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Tidak ada data obat."
        pagination={data?.meta ? {
          page: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
          onPageChange: setPage,
        } : undefined}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Obat' : 'Tambah Obat Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Nama Obat *</Label>
                <Input {...register('name')} placeholder="Nama merek" />
                {errors.name && <p className="text-[12px] text-[#FF5630]">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nama Generik</Label>
                <Input {...register('generic_name')} placeholder="Nama generik" />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Input {...register('category')} placeholder="Antibiotik, Analgesik, dll." />
              </div>
              <div className="space-y-1.5">
                <Label>Satuan *</Label>
                <Input {...register('unit')} placeholder="tablet, kapsul, ml..." />
                {errors.unit && <p className="text-[12px] text-[#FF5630]">{errors.unit.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Harga (Rp) *</Label>
                <Input type="number" min={0} {...register('price')} />
                {errors.price && <p className="text-[12px] text-[#FF5630]">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Stok Saat Ini</Label>
                <Input type="number" min={0} {...register('stock')} />
                {errors.stock && <p className="text-[12px] text-[#FF5630]">{errors.stock.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Min. Stok (alert)</Label>
                <Input type="number" min={0} {...register('min_stock')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
