"use client";
import { useState } from "react";
import { useDashboardCharts, useDashboardStats } from "@/lib/hooks/useDashboard";
import { formatRupiah } from "@/lib/utils";
import { PageLoader } from "@/components/ui/Spinner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";

type FilterType = "this_week" | "this_month" | "this_year" | "custom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function GrafikPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("this_month");
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const params: Record<string, string> = { filter: activeFilter };
  if (activeFilter === "custom") {
    params.date_from = customFrom;
    params.date_to = customTo;
  }

  const { data: charts, isLoading } = useDashboardCharts(params);

  const c = charts ?? {
    pasien_per_bulan: [],
    pemasukan_per_bulan: [],
    cash_vs_qris: { cash: 0, qris_tf: 0 },
    cream_per_bulan: [],
    obat_per_bulan: [],
  };

  const pieData = [
    { name: "Cash", value: c.cash_vs_qris?.cash ?? 0 },
    { name: "QRIS/TF", value: c.cash_vs_qris?.qris_tf ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Grafik Analitik</h1>
          <p className="text-sm text-slate-500">Visualisasi data transaksi klinik</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["this_week", "this_month", "this_year", "custom"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                activeFilter === f ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "this_week" ? "Minggu Ini" : f === "this_month" ? "Bulan Ini" : f === "this_year" ? "Tahun Ini" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {activeFilter === "custom" && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Dari:</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sampai:</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input w-auto" />
          </div>
        </div>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Pasien per Periode</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={c.pasien_per_bulan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pasien" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Pemasukan per Periode</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={c.pemasukan_per_bulan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Pemasukan" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribusi Metode Pembayaran</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Penjualan Cream per Periode</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={c.cream_per_bulan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="Penjualan" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Pembelian Obat per Periode</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={c.obat_per_bulan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Pembelian" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
