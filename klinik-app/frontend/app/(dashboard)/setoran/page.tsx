"use client";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { SetoranForm } from "@/components/forms/SetoranForm";
import { useSetoranList, useSetoranCreate, useSetoranUpdate, useSetoranDelete } from "@/lib/hooks/useSetoran";
import { formatRupiah, formatDate, getPaymentMethodLabel, getErrorMessage } from "@/lib/utils";
import type { Setoran } from "@/lib/types";

const SUMBER_BADGE: Record<string, "info" | "purple" | "default"> = {
  observasi: "info",
  cream: "purple",
  lainnya: "default",
};

export default function SetoranPage() {
  const [params, setParams] = useState({ filter: "this_month", page: 1, per_page: 20 });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Setoran | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useSetoranList(params as Record<string, unknown>);
  const create = useSetoranCreate();
  const update = useSetoranUpdate();
  const del = useSetoranDelete();

  const items: Setoran[] = data?.data ?? [];
  const meta = data?.meta;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setError("");
    try {
      if (editItem) {
        await update.mutateAsync({ id: editItem.id, data: formData });
      } else {
        await create.mutateAsync(formData);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Setoran</h1>
          <p className="text-sm text-slate-500">Pencatatan setoran ke kas</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); setError(""); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Tambah Setoran
        </button>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select value={params.filter} onChange={(e) => setParams({ ...params, filter: e.target.value, page: 1 })} className="input w-auto text-sm">
            <option value="today">Hari Ini</option>
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Sumber</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Jumlah</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Metode</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Catatan</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Diinput Oleh</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.tanggal, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3">
                          <Badge variant={SUMBER_BADGE[item.sumber] ?? "default"} className="capitalize">
                            {item.sumber}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatRupiah(item.jumlah)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{getPaymentMethodLabel(item.metode)}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{item.catatan ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.user?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditItem(item); setShowForm(true); setError(""); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteId(item.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg">
                              <Trash2 size={14} />
                            </button>
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

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? "Edit Setoran" : "Tambah Setoran"}>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <SetoranForm onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} initialData={editItem ?? undefined} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} isLoading={del.isPending} title="Hapus Setoran" message="Data yang dihapus tidak dapat dikembalikan. Lanjutkan?" confirmLabel="Hapus" />
    </div>
  );
}
