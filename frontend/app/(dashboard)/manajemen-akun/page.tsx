'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Role } from '@/lib/constants'

/* ────────────────────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────────────────────── */
interface UserAccount {
  id: number
  name: string
  email: string
  role: Role
  is_active: boolean
  created_at?: string
}

interface Meta {
  current_page: number
  last_page: number
  total: number
}

interface FormState {
  name: string
  email: string
  password: string
  role: Role | ''
  is_active: boolean
}

/* ────────────────────────────────────────────────────────────────
   CONSTANTS
   ──────────────────────────────────────────────────────────────── */
const EMPTY_FORM: FormState = {
  name: '', email: '', password: '', role: '', is_active: true,
}

const ROLE_OPTIONS: { value: Role | ''; label: string }[] = [
  { value: '',             label: 'Semua Role' },
  { value: 'super_admin',  label: 'Super Admin' },
  { value: 'admin_klinik', label: 'Admin Klinik' },
  { value: 'dokter',       label: 'Dokter' },
  { value: 'perawat',      label: 'Perawat' },
  { value: 'farmasi',      label: 'Farmasi' },
  { value: 'kasir',        label: 'Kasir' },
  { value: 'owner',        label: 'Owner' },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin:  'Super Admin',
  admin_klinik: 'Admin Klinik',
  dokter:       'Dokter',
  perawat:      'Perawat',
  farmasi:      'Farmasi',
  kasir:        'Kasir',
  owner:        'Owner',
}

const ROLE_COLOR: Record<string, string> = {
  super_admin:  'bg-[#FEF3C7] text-[#92400E]',
  admin_klinik: 'bg-[#DBEAFE] text-[#1E40AF]',
  dokter:       'bg-[#D1FAE5] text-[#065F46]',
  perawat:      'bg-[#EDE9FE] text-[#5B21B6]',
  farmasi:      'bg-[#CFFAFE] text-[#0E7490]',
  kasir:        'bg-[#FCE7F3] text-[#9D174D]',
  owner:        'bg-[#F3F4F6] text-[#374151]',
}

/* ────────────────────────────────────────────────────────────────
   MODULE-LEVEL UI HELPERS
   (Defined outside any component so they are stable references)
   ──────────────────────────────────────────────────────────────── */
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-[#334155]">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-[#FF5630]">{error}</p>}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   FORM DIALOG
   ──────────────────────────────────────────────────────────────── */
function UserFormDialog({
  open,
  editing,
  onClose,
  onSuccess,
}: {
  open: boolean
  editing: UserAccount | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm]     = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)

  /* Reset form only when dialog opens or the target user changes */
  useEffect(() => {
    if (!open) return
    setErrors({})
    if (editing) {
      setForm({
        name:      editing.name,
        email:     editing.email,
        password:  '',
        role:      editing.role,
        is_active: editing.is_active,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editing])

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit() {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim())                              errs.name     = 'Nama wajib diisi.'
    if (!form.email.trim())                             errs.email    = 'Email wajib diisi.'
    if (!form.role)                                     errs.role     = 'Role wajib dipilih.'
    if (!editing && !form.password)                     errs.password = 'Password wajib diisi.'
    if (form.password && form.password.length < 8)      errs.password = 'Password minimal 8 karakter.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name:      form.name.trim(),
        email:     form.email.trim(),
        role:      form.role,
        is_active: form.is_active,
      }
      if (form.password) payload.password = form.password

      if (editing) {
        await api.put(`/users/${editing.id}`, payload)
        toast.success(`Akun ${form.name} berhasil diperbarui`)
      } else {
        await api.post('/users', payload)
        toast.success(`Akun ${form.name} berhasil dibuat`)
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const apiErrors = e?.response?.data?.errors
      if (apiErrors) {
        setErrors({
          name:     apiErrors.name?.[0],
          email:    apiErrors.email?.[0],
          password: apiErrors.password?.[0],
          role:     apiErrors.role?.[0],
        })
      } else {
        toast.error(e?.response?.data?.message || 'Terjadi kesalahan')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-[#0F2540]">
            <Icon name="manage_accounts" className="icon-fill text-[18px] text-[#0052CC]" />
            {editing ? 'Edit Akun' : 'Buat Akun Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FieldGroup label="Nama Lengkap" error={errors.name}>
            <Input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="Nama lengkap pengguna"
              className="h-9 text-[13px]"
            />
          </FieldGroup>

          <FieldGroup label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              placeholder="email@klinik.com"
              className="h-9 text-[13px]"
            />
          </FieldGroup>

          <FieldGroup
            label={editing ? 'Password Baru (kosongkan jika tidak diganti)' : 'Password'}
            error={errors.password}
          >
            <Input
              type="password"
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              placeholder={editing ? '••••••••' : 'Minimal 8 karakter'}
              className="h-9 text-[13px]"
            />
          </FieldGroup>

          <FieldGroup label="Role / Jabatan" error={errors.role}>
            <select
              value={form.role}
              onChange={e => setField('role', e.target.value as Role)}
              className="w-full h-9 rounded-md border border-[#c3c6d6] bg-white px-3 text-[13px] text-[#0F2540] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
            >
              <option value="">-- Pilih Role --</option>
              <option value="super_admin">Super Admin (IT)</option>
              <option value="admin_klinik">Admin Klinik</option>
              <option value="dokter">Dokter</option>
              <option value="perawat">Perawat</option>
              <option value="farmasi">Farmasi</option>
              <option value="kasir">Kasir</option>
              <option value="owner">Owner</option>
            </select>
          </FieldGroup>

          {editing && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setField('is_active', !form.is_active)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.is_active ? 'bg-[#0052CC]' : 'bg-[#CBD5E1]'}`}
              >
                <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <Label className="text-[13px] text-[#334155]">
                Akun {form.is_active ? 'Aktif' : 'Nonaktif'}
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#003D99] disabled:opacity-60 transition-colors"
          >
            {loading && <Icon name="progress_activity" className="text-[15px] animate-spin" />}
            <Icon name="save" className="text-[15px]" />
            {editing ? 'Simpan Perubahan' : 'Buat Akun'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ────────────────────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────────────────────── */
export default function ManajemenAkunPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState<Role | ''>('')
  const [dialogOpen, setDialog] = useState(false)
  const [editing, setEditing]   = useState<UserAccount | null>(null)

  /* Access guard */
  if (currentUser && currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <Icon name="lock" className="icon-fill text-[48px] text-[#CBD5E1]" />
        <h2 className="text-[18px] font-bold text-[#0F2540]">Akses Ditolak</h2>
        <p className="text-[14px] text-[#64748B]">Halaman ini hanya dapat diakses oleh Super Admin.</p>
      </div>
    )
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (search)     params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const res = await api.get(`/users?${params}`)
      return res.data as { data: UserAccount[]; meta: Meta }
    },
    enabled: currentUser?.role === 'super_admin',
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ user, activate }: { user: UserAccount; activate: boolean }) => {
      if (activate) {
        await api.patch(`/users/${user.id}/activate`)
      } else {
        await api.delete(`/users/${user.id}`)
      }
    },
    onSuccess: (_, { user, activate }) => {
      toast.success(`Akun ${user.name} berhasil ${activate ? 'diaktifkan' : 'dinonaktifkan'}`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Terjadi kesalahan')
    },
  })

  function openCreate() {
    setEditing(null)
    setDialog(true)
  }

  function openEdit(user: UserAccount) {
    setEditing(user)
    setDialog(true)
  }

  const activeCount   = data?.data.filter(u => u.is_active).length  ?? 0
  const inactiveCount = data?.data.filter(u => !u.is_active).length ?? 0

  const columns: Column<UserAccount>[] = [
    {
      key: 'name',
      header: 'Nama',
      cell: (u) => (
        <div>
          <p className="font-semibold text-[#0F2540]">{u.name}</p>
          <p className="text-[11px] text-[#64748B]">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
          {ROLE_LABEL[u.role] ?? u.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${u.is_active ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
          <span className={`size-1.5 rounded-full ${u.is_active ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
          {u.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEdit(u)}
            className="flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors"
          >
            <Icon name="edit" className="text-[14px]" />
            Edit
          </button>
          {u.id !== currentUser?.id && (
            <button
              onClick={() => toggleActiveMutation.mutate({ user: u, activate: !u.is_active })}
              disabled={toggleActiveMutation.isPending}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                u.is_active
                  ? 'border border-[#FEE2E2] text-[#DC2626] hover:bg-[#FEF2F2]'
                  : 'border border-[#D1FAE5] text-[#059669] hover:bg-[#ECFDF5]'
              }`}
            >
              <Icon name={u.is_active ? 'block' : 'check_circle'} className="text-[14px]" />
              {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Akun"
        description="Kelola akun pengguna sistem EMR. Hanya Super Admin yang dapat membuat dan mengelola akun."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#003D99] transition-colors"
          >
            <Icon name="person_add" className="text-[18px]" />
            Buat Akun Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Akun',    value: data?.meta.total ?? '—', icon: 'group',         color: '#0052CC' },
          { label: 'Akun Aktif',    value: activeCount,             icon: 'check_circle',  color: '#059669' },
          { label: 'Akun Nonaktif', value: inactiveCount,           icon: 'block',         color: '#DC2626' },
          { label: 'Total Role',    value: '7',                     icon: 'badge',         color: '#7C3AED' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
              <Icon name={s.icon} className="icon-fill text-[18px]" style={{ color: s.color } as React.CSSProperties} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{s.label}</p>
            </div>
            <p className="mt-1.5 text-[24px] font-bold text-[#0F2540]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari nama atau email..."
            className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white pl-9 pr-3 text-[13px] text-[#0F2540] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRole(e.target.value as Role | ''); setPage(1) }}
          className="h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[13px] text-[#0F2540] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
        >
          {ROLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Tidak ada akun yang ditemukan."
        pagination={data?.meta && data.meta.last_page > 1 ? {
          page,
          lastPage: data.meta.last_page,
          total:    data.meta.total,
          onPageChange: setPage,
        } : undefined}
      />

      {/* Info box */}
      <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 flex gap-3">
        <Icon name="info" className="icon-fill text-[18px] text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="text-[12px] text-[#1E40AF] space-y-0.5">
          <p className="font-semibold">Tentang Manajemen Akun</p>
          <p>Hanya <strong>Super Admin</strong> yang dapat membuat, mengedit, dan menonaktifkan akun pengguna.</p>
          <p>Akun yang dinonaktifkan tidak dapat login, tetapi data historisnya tetap terjaga.</p>
          <p>Password tidak dapat dilihat — hanya bisa direset melalui form Edit.</p>
        </div>
      </div>

      {/* Dialog */}
      <UserFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialog(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  )
}
