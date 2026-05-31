"use client";
import { useState } from "react";
import { Plus, Search, Download, Edit2, Trash2, Filter } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { CreamForm } from "@/components/forms/CreamForm";
import {
  useCreamList,
  useCreamSummary,
  useCreamCreate,
  useCreamUpdate,
  useCreamDelete,
} from "@/lib/hooks/useCream";
import { formatRupiah, formatDate, getPaymentMethodLabel, getErrorMessage } from "@/lib/utils";
import { creamApi } from "@/lib/api";
import type { Cream, CreamFilter } from "@/lib/types";
import * as XLSX from "xlsx";

const PAYMENT_BADGE: Record<string, "success" | "info" | "purple"> = {
  cash: "success",
  qris: "info",
  transfer: "purple",
};

export default function CreamPage() {
  const [filters, setFilters] = useState<CreamFilter>({ filter: "this_month", page: 1, per_page: 20 });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Cream | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useCreamList(filters);
  const { data: summary } = useCreamSummary(filters);
  const create = useCreamCreate();
  const update = useCreamUpdate();
  const del = useCreamDelete();

  const items: Cream[] = data?.data ?? [];
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
      const res = await creamApi.list({ ...filters, per_page: 99999 } as Record<string, unknown>);
      const rows = res.data?.data ?? [];
      const ws = XLSX.utils.json_to_sheet(
        rows.map((r: Cream, i: number) => ({
          No: i + 1,
          Tanggal: r.tanggal,
          "Nama Pasien": r.nama_pasien,
          Produk: r.produk,
          "Harga Jual": r.harga_jual,
          Pengeluaran: r.pengeluaran,
          Metode: getPaymentMethodLabel(r.metode),
          Catatan: r.catatan ?? "",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penjualan Cream");
      XLSX.writeFile(wb, `cream-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert("Export gagal: " + getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Penjualan Cream</h1>
          <p className="text-sm text-slate-500">Pencatatan penjualan produk cream</p>
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
              onChange={(e) => setFilters({ ...filters, filter: e.target.value as CreamFilter["filter"], page: 1 })}
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
          <select
            value={filters.metode ?? ""}
            onChange={(e) => setFilters({ ...filters, metode: e.target.value as CreamFilter["metode"], page: 1 })}
            className="input w-auto text-sm"
          >
            <option value="">Semua Metode</option>
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
          </select>
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pasien..."
              value={filters.search ?? ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="input pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Jumlah Pasien", value: summary.jumlah_pasien },
            { label: "Total Penjualan", value: formatRupiah(summary.total_penjualan) },
            { label: "Total Pengeluaran", value: formatRupiah(summary.total_pengeluaran) },
            { label: "Saldo", value: formatRupiah(summary.saldo) },
            { label: "Saldo Cash", value: formatRupiah(summary.saldo_cash) },
            { label: "Saldo TF", value: formatRupiah(summary.saldo_tf) },
          ].map((item) => (
            <div key={item.label} className="card p-3 text-center">
              <p className="text-xs text-slate-500 truncate">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">No.</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Nama Pasien</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Produk</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Harga Jual</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Pengeluaran</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Metode</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Saldo</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Catatan</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{(meta?.from ?? 0) + idx}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.tanggal, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3 font-medium">{item.nama_pasien}</td>
                        <td className="px-4 py-3 text-slate-600">{item.produk}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatRupiah(item.harga_jual)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatRupiah(item.pengeluaran)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={PAYMENT_BADGE[item.metode] ?? "default"}>
                            {getPaymentMethodLabel(item.metode)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          {item.saldo !== undefined ? formatRupiah(item.saldo) : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[100px] truncate">{item.catatan ?? "-"}</td>
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
            {meta && (
              <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={(p) => setFilters({ ...filters, page: p })} />
            )}
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? "Edit Penjualan Cream" : "Tambah Penjualan Cream"} size="lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <CreamForm onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} initialData={editItem ?? undefined} onCancel={() => { setShowForm(false); setEditItem(null); }} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} isLoading={del.isPending} title="Hapus Data Cream" message="Data yang dihapus tidak dapat dikembalikan. Lanjutkan?" confirmLabel="Hapus" />
    </div>
  );
}
