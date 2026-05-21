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
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import type { MedicalAction } from '@/types/master'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  name:     z.string().min(2, 'Nama wajib diisi'),
  category: z.string().optional(),
  price:    z.coerce.number().min(0, 'Harga tidak valid'),
})

type FormValues = z.infer<typeof schema>

export default function MasterTindakanPage() {
  const queryClient = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<MedicalAction | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['actions', { search, page }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MedicalAction[]>>('/actions', {
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
    reset({ name: '', category: '', price: 0 })
    setOpen(true)
  }

  function openEdit(a: MedicalAction) {
    setEditing(a)
    reset({ name: a.name, category: a.category ?? '', price: a.price })
    setOpen(true)
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? api.put(`/actions/${editing.id}`, values)
        : api.post('/actions', values),
    onSuccess: () => {
      toast.success(editing ? 'Tindakan diperbarui' : 'Tindakan ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['actions'] })
      setOpen(false)
    },
    onError: () => toast.error('Gagal menyimpan tindakan'),
  })

  const columns: Column<MedicalAction>[] = [
    {
      key: 'name',
      header: 'Nama Tindakan',
      cell: (a) => <span className="text-[14px] font-semibold text-[#091E42]">{a.name}</span>,
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (a) => <span className="text-[14px] text-[#434654]">{a.category ?? '-'}</span>,
    },
    {
      key: 'price',
      header: 'Tarif',
      cell: (a) => <span className="text-[14px] font-medium text-[#091E42] num-tabular">{formatRupiah(a.price)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${a.is_active ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#f1f3ff] text-[#434654]'}`}>
          {a.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (a) => (
        <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(a) }}>
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Tindakan"
        description="Kelola data tindakan medis dan tarifnya"
        action={
          <Button size="sm" onClick={openCreate}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Tindakan
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">search</span>
          <Input
            placeholder="Cari nama tindakan..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {data?.meta && (
          <p className="text-[13px] text-[#737685]">{data.meta.total} tindakan</p>
        )}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Tidak ada data tindakan."
        pagination={data?.meta ? {
          page: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
          onPageChange: setPage,
        } : undefined}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Tindakan' : 'Tambah Tindakan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-1.5">
                <Label>Nama Tindakan *</Label>
                <Input {...register('name')} placeholder="Konsultasi umum, Jahit luka, dll." />
                {errors.name && <p className="text-[12px] text-[#FF5630]">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Input {...register('category')} placeholder="Konsultasi, Tindakan Minor, Laboratorium..." />
              </div>
              <div className="space-y-1.5">
                <Label>Tarif (Rp) *</Label>
                <Input type="number" min={0} {...register('price')} />
                {errors.price && <p className="text-[12px] text-[#FF5630]">{errors.price.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
