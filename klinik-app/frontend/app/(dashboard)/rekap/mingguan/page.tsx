"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rekapApi } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/utils";
import { PageLoader } from "@/components/ui/Spinner";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RekapMingguanPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const weekStart = startOfWeek(subWeeks(now, -weekOffset), { weekStartsOn: 1 });
  // weekOffset 0 = current, negative = past
  const targetDate = subWeeks(now, Math.abs(weekOffset));
  const wStart = startOfWeek(targetDate, { weekStartsOn: 1 });
  const wEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

  const dateFrom = format(wStart, "yyyy-MM-dd");
  const dateTo = format(wEnd, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["rekap-mingguan", dateFrom, dateTo],
    queryFn: async () => {
      const res = await rekapApi.mingguan({ date_from: dateFrom, date_to: dateTo });
      return res.data.data;
    },
  });

  const r = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rekap Mingguan</h1>
          <p className="text-sm text-slate-500">Ringkasan transaksi per minggu</p>
        </div>
      </div>

      {/* Week selector */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-900">
            {format(wStart, "dd MMMM", { locale: id })} — {format(wEnd, "dd MMMM yyyy", { locale: id })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {weekOffset === 0 ? "Minggu Ini" : weekOffset === 1 ? "Minggu Lalu" : `${weekOffset} Minggu Lalu`}
          </p>
        </div>
        <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-40">
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>

      {isLoading ? <PageLoader /> : !r ? (
        <div className="card p-8 text-center text-slate-400">Tidak ada data untuk periode ini</div>
      ) : (
        <div className="space-y-5">
          {/* Observasi Summary */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-blue-50">
              <h2 className="font-semibold text-blue-800">Observasi Umum</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Pasien", value: r.observasi?.total_pasien ?? 0, isNum: true },
                { label: "Total Biaya", value: formatRupiah(r.observasi?.total_biaya ?? 0) },
                { label: "Total Cash", value: formatRupiah(r.observasi?.total_cash ?? 0) },
                { label: "Total QRIS/TF", value: formatRupiah(r.observasi?.total_qris_tf ?? 0) },
                { label: "Total Setor", value: formatRupiah(r.observasi?.total_setor ?? 0) },
                { label: "Sisa Saldo", value: formatRupiah(r.observasi?.sisa_saldo ?? 0) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-base font-bold text-slate-900">{item.isNum ? item.value : item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cream Summary */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-pink-50">
              <h2 className="font-semibold text-pink-800">Penjualan Cream</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Jumlah Pasien", value: r.cream?.jumlah_pasien ?? 0 },
                { label: "Total Penjualan", value: formatRupiah(r.cream?.total_penjualan ?? 0) },
                { label: "Total Pengeluaran", value: formatRupiah(r.cream?.total_pengeluaran ?? 0) },
                { label: "Saldo", value: formatRupiah(r.cream?.saldo ?? 0) },
                { label: "Saldo Cash", value: formatRupiah(r.cream?.saldo_cash ?? 0) },
                { label: "Saldo TF", value: formatRupiah(r.cream?.saldo_tf ?? 0) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-base font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Faktur Summary */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-amber-50">
              <h2 className="font-semibold text-amber-800">Faktur Pembelian Obat</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Jumlah Transaksi", value: r.faktur?.jumlah_transaksi ?? 0 },
                { label: "Total Pembelian", value: formatRupiah(r.faktur?.total_pembelian ?? 0) },
                { label: "Rata-rata", value: formatRupiah(r.faktur?.rata_rata ?? 0) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-base font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Setoran */}
          <div className="card p-5">
            <p className="text-sm text-slate-500 mb-1">Total Setoran Minggu Ini</p>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(r.setoran ?? 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
