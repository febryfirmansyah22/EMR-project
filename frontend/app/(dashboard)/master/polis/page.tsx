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
import { Textarea } from '@/components/ui/textarea'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import api from '@/lib/api'
import type { Poli } from '@/types/master'
import type { ApiResponse } from '@/types/api'

const schema = z.object({
  name:        z.string().min(2, 'Nama wajib diisi'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function MasterPolisPage() {
  const queryClient = useQueryClient()
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<Poli | null>(null)

  const { data: polis, isLoading } = useQuery<Poli[]>({
    queryKey: ['polis'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Poli[]>>('/polis')
      return res.data.data ?? []
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '' })
    setOpen(true)
  }

  function openEdit(p: Poli) {
    setEditing(p)
    reset({ name: p.name, description: p.description ?? '' })
    setOpen(true)
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? api.put(`/polis/${editing.id}`, values)
        : api.post('/polis', values),
    onSuccess: () => {
      toast.success(editing ? 'Poli diperbarui' : 'Poli berhasil ditambahkan')
      queryClient.invalidateQueries({ queryKey: ['polis'] })
      setOpen(false)
    },
    onError: () => toast.error('Gagal menyimpan poli'),
  })

  const columns: Column<Poli>[] = [
    {
      key: 'name',
      header: 'Nama Poli',
      cell: (p) => <span className="text-[14px] font-semibold text-[#091E42]">{p.name}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      cell: (p) => <span className="text-[14px] text-[#434654]">{p.description ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${p.is_active ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#f1f3ff] text-[#434654]'}`}>
          {p.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (p) => (
        <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(p) }}>
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Poli"
        description="Kelola data poliklinik"
        action={
          <Button size="sm" onClick={openCreate}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Poli
          </Button>
        }
      />

      <DataTable
        data={polis ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Belum ada data poli."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Poli' : 'Tambah Poli'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
            <div className="space-y-4 px-5 py-4">
              <div className="space-y-1.5">
                <Label>Nama Poli *</Label>
                <Input {...register('name')} placeholder="Poli Umum, Poli Gigi, Poli KIA..." />
                {errors.name && <p className="text-[12px] text-[#FF5630]">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <Textarea {...register('description')} rows={2} placeholder="Keterangan tambahan (opsional)" />
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
