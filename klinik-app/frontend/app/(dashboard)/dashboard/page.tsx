"use client";
import { useState } from "react";
import {
  Users,
  TrendingUp,
  Banknote,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Wallet,
  ArrowUpDown,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageLoader } from "@/components/ui/Spinner";
import { useDashboardStats, useDashboardCharts } from "@/lib/hooks/useDashboard";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

type FilterType = "today" | "this_week" | "this_month" | "this_year" | "custom";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "custom", label: "Custom" },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("this_month");
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const params: Record<string, string> = { filter: activeFilter };
  if (activeFilter === "custom") {
    params.date_from = customFrom;
    params.date_to = customTo;
  }

  const { data: stats, isLoading: statsLoading } = useDashboardStats(params);
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts(params);

  const isLoading = statsLoading || chartsLoading;

  // Fallback demo data when API not available
  const s = stats ?? {
    total_pasien_hari_ini: 0,
    total_pasien_bulan_ini: 0,
    total_pemasukan: 0,
    total_cash: 0,
    total_qris_tf: 0,
    total_setoran: 0,
    sisa_saldo: 0,
    total_penjualan_cream: 0,
    total_pengeluaran_cream: 0,
    saldo_cream: 0,
    total_pembelian_obat: 0,
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Ringkasan transaksi klinik</p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                activeFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {activeFilter === "custom" && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Dari:</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="input w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sampai:</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="input w-auto"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pasien Hari Ini"
              value={s.total_pasien_hari_ini}
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Pasien Bulan Ini"
              value={s.total_pasien_bulan_ini}
              icon={Users}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <StatCard
              title="Total Pemasukan"
              value={formatRupiah(s.total_pemasukan)}
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatCard
              title="Total Cash"
              value={formatRupiah(s.total_cash)}
              icon={Banknote}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Total QRIS/TF"
              value={formatRupiah(s.total_qris_tf)}
              icon={CreditCard}
              iconColor="text-sky-600"
              iconBg="bg-sky-50"
            />
            <StatCard
              title="Total Setoran"
              value={formatRupiah(s.total_setoran)}
              icon={ArrowUpDown}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Sisa Saldo"
              value={formatRupiah(s.sisa_saldo)}
              icon={Wallet}
              iconColor="text-orange-600"
              iconBg="bg-orange-50"
            />
            <StatCard
              title="Penjualan Cream"
              value={formatRupiah(s.total_penjualan_cream)}
              icon={Sparkles}
              iconColor="text-pink-600"
              iconBg="bg-pink-50"
            />
            <StatCard
              title="Pengeluaran Cream"
              value={formatRupiah(s.total_pengeluaran_cream)}
              icon={Sparkles}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
            />
            <StatCard
              title="Saldo Cream"
              value={formatRupiah(s.saldo_cream)}
              icon={Wallet}
              iconColor="text-violet-600"
              iconBg="bg-violet-50"
            />
            <StatCard
              title="Pembelian Obat"
              value={formatRupiah(s.total_pembelian_obat)}
              icon={ShoppingBag}
              iconColor="text-teal-600"
              iconBg="bg-teal-50"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pasien per bulan */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Pasien per Bulan
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={c.pasien_per_bulan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pasien" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pemasukan per bulan */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Pemasukan per Bulan
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={c.pemasukan_per_bulan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Pemasukan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cash vs QRIS/TF */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Cash vs QRIS/TF
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Penjualan Cream per bulan */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Penjualan Cream per Bulan
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={c.cream_per_bulan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Penjualan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pembelian Obat per bulan */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Pembelian Obat per Bulan
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={c.obat_per_bulan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Pembelian" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
