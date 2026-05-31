"use client";
import { useState } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { useUsersList, useUsersCreate, useUsersUpdate, useUsersDelete } from "@/lib/hooks/useUsers";
import { useMe } from "@/lib/hooks/useAuth";
import { formatDate, getRoleLabel, getErrorMessage } from "@/lib/utils";
import type { User } from "@/lib/types";

const createSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["super_admin", "admin", "dokter", "perawat"]),
  is_active: z.boolean(),
});
const editSchema = createSchema.extend({ password: z.string().optional().or(z.literal("")) });
type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

function UserForm({
  onSubmit,
  isLoading,
  initialData,
  onCancel,
  isEdit,
}: {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  initialData?: User;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      password: "",
      role: initialData?.role ?? "admin",
      is_active: initialData?.is_active ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nama Lengkap</label>
        <input {...register("name")} className="input" placeholder="Nama lengkap" />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Email</label>
        <input {...register("email")} type="email" className="input" placeholder="email@klinik.com" />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label">{isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}</label>
        <input {...register("password")} type="password" className="input" placeholder="••••••••" />
        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="label">Role</label>
        <select {...register("role")} className="input">
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
          <option value="dokter">Dokter</option>
          <option value="perawat">Perawat</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input {...register("is_active")} type="checkbox" id="is_active" className="w-4 h-4 rounded border-slate-300" />
        <label htmlFor="is_active" className="text-sm text-slate-700">Akun aktif</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading && <Spinner className="h-4 w-4" />}
          {isEdit ? "Simpan" : "Tambah"}
        </button>
      </div>
    </form>
  );
}

export default function PenggunaPage() {
  const [params, setParams] = useState({ search: "", page: 1, per_page: 20 });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { data: me } = useMe();

  const { data, isLoading } = useUsersList(params as Record<string, unknown>);
  const create = useUsersCreate();
  const update = useUsersUpdate();
  const del = useUsersDelete();

  if (me?.role !== "super_admin") {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  const items: User[] = data?.data ?? [];
  const meta = data?.meta;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setError("");
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    try {
      if (editItem) {
        await update.mutateAsync({ id: editItem.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      setShowForm(false);
      setEditItem(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await del.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const ROLE_BADGE: Record<string, "info" | "success" | "purple" | "warning"> = {
    super_admin: "info",
    admin: "success",
    dokter: "purple",
    perawat: "warning",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500">Kelola akun pengguna sistem</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); setError(""); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Tambah Pengguna
        </button>
      </div>

      <div className="card p-4">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={params.search}
            onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Nama</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Role</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Bergabung</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
                  ) : (
                    items.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 text-xs font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="font-medium text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={ROLE_BADGE[user.role] ?? "default"}>{getRoleLabel(user.role)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={user.is_active ? "success" : "danger"}>{user.is_active ? "Aktif" : "Nonaktif"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditItem(user); setShowForm(true); setError(""); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg">
                              <Edit2 size={14} />
                            </button>
                            {user.id !== me?.id && (
                              <button onClick={() => setDeleteId(user.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={(p) => setParams({ ...params, page: p })} />}
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? "Edit Pengguna" : "Tambah Pengguna"} size="md">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <UserForm onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} initialData={editItem ?? undefined} onCancel={() => { setShowForm(false); setEditItem(null); }} isEdit={!!editItem} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} isLoading={del.isPending} title="Hapus Pengguna" message="Akun pengguna ini akan dihapus. Lanjutkan?" confirmLabel="Hapus" />
    </div>
  );
}
