"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rekapApi } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { PageLoader } from "@/components/ui/Spinner";
import { format, subMonths, addMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function RekapBulananPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const targetDate = subMonths(new Date(), monthOffset);
  const bulan = targetDate.getMonth() + 1;
  const tahun = targetDate.getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ["rekap-bulanan", bulan, tahun],
    queryFn: async () => {
      const res = await rekapApi.bulanan({ bulan, tahun });
      return res.data.data;
    },
  });

  const r = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rekap Bulanan</h1>
          <p className="text-sm text-slate-500">Ringkasan transaksi per bulan</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-900 text-lg">
            {format(targetDate, "MMMM yyyy", { locale: id })}
          </p>
          <p className="text-xs text-slate-500">{monthOffset === 0 ? "Bulan Ini" : monthOffset === 1 ? "Bulan Lalu" : `${monthOffset} bulan lalu`}</p>
        </div>
        <button onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))} disabled={monthOffset === 0} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-40">
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? <PageLoader /> : !r ? (
        <div className="card p-8 text-center text-slate-400">Tidak ada data untuk periode ini</div>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 bg-blue-50 border-blue-100">
              <p className="text-xs text-blue-600 font-medium">Total Pasien</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{r.observasi?.total_pasien ?? 0}</p>
            </div>
            <div className="card p-4 bg-green-50 border-green-100">
              <p className="text-xs text-green-600 font-medium">Total Pemasukan</p>
              <p className="text-xl font-bold text-green-900 mt-1">{formatRupiah(r.observasi?.total_biaya ?? 0)}</p>
            </div>
            <div className="card p-4 bg-pink-50 border-pink-100">
              <p className="text-xs text-pink-600 font-medium">Penjualan Cream</p>
              <p className="text-xl font-bold text-pink-900 mt-1">{formatRupiah(r.cream?.total_penjualan ?? 0)}</p>
            </div>
            <div className="card p-4 bg-amber-50 border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Pembelian Obat</p>
              <p className="text-xl font-bold text-amber-900 mt-1">{formatRupiah(r.faktur?.total_pembelian ?? 0)}</p>
            </div>
          </div>

          {/* Detail sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Observasi detail */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Observasi Umum</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Total Pasien", value: r.observasi?.total_pasien ?? 0, isNum: true },
                  { label: "Total Biaya", value: formatRupiah(r.observasi?.total_biaya ?? 0) },
                  { label: "Total Cash", value: formatRupiah(r.observasi?.total_cash ?? 0) },
                  { label: "Total QRIS/TF", value: formatRupiah(r.observasi?.total_qris_tf ?? 0) },
                  { label: "Total Setor", value: formatRupiah(r.observasi?.total_setor ?? 0) },
                  { label: "Sisa Saldo", value: formatRupiah(r.observasi?.sisa_saldo ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.isNum ? item.value : item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cream detail */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Penjualan Cream</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Jumlah Pasien", value: r.cream?.jumlah_pasien ?? 0 },
                  { label: "Total Penjualan", value: formatRupiah(r.cream?.total_penjualan ?? 0) },
                  { label: "Total Pengeluaran", value: formatRupiah(r.cream?.total_pengeluaran ?? 0) },
                  { label: "Saldo Bersih", value: formatRupiah(r.cream?.saldo ?? 0) },
                  { label: "Saldo Cash", value: formatRupiah(r.cream?.saldo_cash ?? 0) },
                  { label: "Saldo Transfer", value: formatRupiah(r.cream?.saldo_tf ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Faktur detail */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Faktur Pembelian Obat</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Jumlah Transaksi", value: r.faktur?.jumlah_transaksi ?? 0 },
                  { label: "Total Pembelian", value: formatRupiah(r.faktur?.total_pembelian ?? 0) },
                  { label: "Rata-rata per Transaksi", value: formatRupiah(r.faktur?.rata_rata ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total setoran */}
            <div className="card p-5 flex flex-col justify-center">
              <p className="text-sm text-slate-500">Total Setoran Bulan Ini</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatRupiah(r.total_setoran ?? 0)}</p>
            </div>
          </div>

          {/* Weekly breakdown */}
          {r.minggu_detail && r.minggu_detail.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Rincian per Minggu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Minggu</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Pasien</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Pemasukan</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Cream</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Faktur</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs">Setoran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.minggu_detail.map((w: Record<string, unknown>, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">Minggu {(w.minggu_ke as number) ?? i + 1}</td>
                        <td className="px-4 py-3 text-right">{(w.observasi as Record<string, number>)?.total_pasien ?? 0}</td>
                        <td className="px-4 py-3 text-right">{formatRupiah((w.observasi as Record<string, number>)?.total_biaya ?? 0)}</td>
                        <td className="px-4 py-3 text-right">{formatRupiah((w.cream as Record<string, number>)?.total_penjualan ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatRupiah((w.faktur as Record<string, number>)?.total_pembelian ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatRupiah((w.setoran as number) ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
