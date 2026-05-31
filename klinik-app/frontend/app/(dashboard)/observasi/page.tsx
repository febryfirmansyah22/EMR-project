"use client";
import { useState } from "react";
import { Plus, Search, Download, Edit2, Trash2, Filter } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { ObservasiForm } from "@/components/forms/ObservasiForm";
import {
  useObservasiList,
  useObservasiSummary,
  useObservasiCreate,
  useObservasiUpdate,
  useObservasiDelete,
} from "@/lib/hooks/useObservasi";
import { formatRupiah, formatDate, getPaymentMethodLabel, getErrorMessage } from "@/lib/utils";
import { observasiApi } from "@/lib/api";
import type { Observasi, ObservasiFilter } from "@/lib/types";
import * as XLSX from "xlsx";

const PAYMENT_BADGE: Record<string, "success" | "info" | "purple"> = {
  cash: "success",
  qris: "info",
  transfer: "purple",
};

export default function ObservasiPage() {
  const [filters, setFilters] = useState<ObservasiFilter>({
    filter: "this_month",
    page: 1,
    per_page: 20,
  });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Observasi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useObservasiList(filters);
  const { data: summary } = useObservasiSummary(filters);
  const create = useObservasiCreate();
  const update = useObservasiUpdate();
  const del = useObservasiDelete();

  const items: Observasi[] = data?.data ?? [];
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
      const exportFilters = { ...filters, per_page: 99999 };
      const res = await observasiApi.list(exportFilters as Record<string, unknown>);
      const rows = res.data?.data ?? [];
      const ws = XLSX.utils.json_to_sheet(
        rows.map((r: Observasi, i: number) => ({
          No: i + 1,
          Tanggal: r.tanggal,
          "Nama Pasien": r.nama_pasien,
          Harga: r.harga,
          Metode: getPaymentMethodLabel(r.metode),
          Setor: r.setor,
          Catatan: r.catatan ?? "",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Observasi");
      XLSX.writeFile(wb, `observasi-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert("Export gagal: " + getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Observasi Umum</h1>
          <p className="text-sm text-slate-500">Pencatatan kunjungan pasien harian</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export Excel
          </button>
          <button
            onClick={() => { setEditItem(null); setShowForm(true); setError(""); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
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
              onChange={(e) => setFilters({ ...filters, filter: e.target.value as ObservasiFilter["filter"], page: 1 })}
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
              <input type="date" value={filters.date_from ?? ""} onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })} className="input w-auto text-sm" />
              <input type="date" value={filters.date_to ?? ""} onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })} className="input w-auto text-sm" />
            </>
          )}
          <select
            value={filters.metode ?? ""}
            onChange={(e) => setFilters({ ...filters, metode: e.target.value as ObservasiFilter["metode"], page: 1 })}
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

      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Pasien", value: summary.total_pasien, isNum: true },
            { label: "Total Biaya", value: formatRupiah(summary.total_biaya), isNum: false },
            { label: "Total Cash", value: formatRupiah(summary.total_cash), isNum: false },
            { label: "Total QRIS/TF", value: formatRupiah(summary.total_qris_tf), isNum: false },
            { label: "Total Setor", value: formatRupiah(summary.total_setor), isNum: false },
            { label: "Sisa Saldo", value: formatRupiah(summary.sisa_saldo), isNum: false },
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
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Harga</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Metode</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Setor</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Saldo</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Catatan</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{(meta?.from ?? 0) + idx}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.tanggal, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.nama_pasien}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatRupiah(item.harga)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={PAYMENT_BADGE[item.metode] ?? "default"}>
                            {getPaymentMethodLabel(item.metode)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{formatRupiah(item.setor)}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          {item.saldo !== undefined ? formatRupiah(item.saldo) : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{item.catatan ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setEditItem(item); setShowForm(true); setError(""); }}
                              className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg"
                            >
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
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                from={meta.from}
                to={meta.to}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Edit Observasi" : "Tambah Observasi"}
        size="lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <ObservasiForm
          onSubmit={handleSubmit}
          isLoading={create.isPending || update.isPending}
          initialData={editItem ?? undefined}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={del.isPending}
        title="Hapus Data Observasi"
        message="Data yang dihapus tidak dapat dikembalikan. Lanjutkan?"
        confirmLabel="Hapus"
      />
    </div>
  );
}
