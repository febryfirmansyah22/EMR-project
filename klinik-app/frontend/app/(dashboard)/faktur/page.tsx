"use client";
import { useState } from "react";
import { Plus, Download, Edit2, Trash2, Filter } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/Spinner";
import { FakturForm } from "@/components/forms/FakturForm";
import { useFakturList, useFakturSummary, useFakturCreate, useFakturUpdate, useFakturDelete } from "@/lib/hooks/useFaktur";
import { formatRupiah, formatDate, getErrorMessage } from "@/lib/utils";
import { fakturApi } from "@/lib/api";
import type { Faktur, FakturFilter } from "@/lib/types";
import * as XLSX from "xlsx";

export default function FakturPage() {
  const [filters, setFilters] = useState<FakturFilter>({ filter: "this_month", page: 1, per_page: 20 });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Faktur | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useFakturList(filters);
  const { data: summary } = useFakturSummary(filters);
  const create = useFakturCreate();
  const update = useFakturUpdate();
  const del = useFakturDelete();

  const items: Faktur[] = data?.data ?? [];
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

  const handleExport = async () => {
    try {
      const res = await fakturApi.list({ ...filters, per_page: 99999 } as Record<string, unknown>);
      const rows = res.data?.data ?? [];
      const ws = XLSX.utils.json_to_sheet(
        rows.map((r: Faktur, i: number) => ({
          No: i + 1,
          Tanggal: r.tanggal,
          "PBF/Toko": r.pbf_toko,
          Harga: r.harga,
          Keterangan: r.keterangan ?? "",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Faktur");
      XLSX.writeFile(wb, `faktur-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert("Export gagal: " + getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faktur Pembelian Obat</h1>
          <p className="text-sm text-slate-500">Pencatatan pembelian obat dari PBF/toko</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={() => { setEditItem(null); setShowForm(true); setError(""); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Tambah
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={filters.filter ?? "this_month"}
              onChange={(e) => setFilters({ ...filters, filter: e.target.value as FakturFilter["filter"], page: 1 })}
              className="input w-auto text-sm"
            >
              <option value="today">Hari Ini</option>
              <option value="this_week">Minggu Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="this_year">Tahun Ini</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {filters.filter === "custom" && (
            <>
              <input type="date" value={filters.date_from ?? ""} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="input w-auto text-sm" />
              <input type="date" value={filters.date_to ?? ""} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="input w-auto text-sm" />
            </>
          )}
          <input
            type="text"
            placeholder="Filter PBF/Toko..."
            value={filters.pbf_toko ?? ""}
            onChange={(e) => setFilters({ ...filters, pbf_toko: e.target.value, page: 1 })}
            className="input w-48 text-sm"
          />
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Pembelian", value: formatRupiah(summary.total_pembelian) },
            { label: "Jumlah Transaksi", value: summary.jumlah_transaksi },
            { label: "Rata-rata", value: formatRupiah(summary.rata_rata) },
          ].map((item) => (
            <div key={item.label} className="card p-4 text-center">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">No.</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">PBF/Toko</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Harga</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Keterangan</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{(meta?.from ?? 0) + idx}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.tanggal, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3 font-medium">{item.pbf_toko}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">{formatRupiah(item.harga)}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{item.keterangan ?? "-"}</td>
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
            {meta && <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={(p) => setFilters({ ...filters, page: p })} />}
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? "Edit Faktur" : "Tambah Faktur"} size="md">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <FakturForm onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} initialData={editItem ?? undefined} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} isLoading={del.isPending} title="Hapus Faktur" message="Data yang dihapus tidak dapat dikembalikan. Lanjutkan?" confirmLabel="Hapus" />
    </div>
  );
}
