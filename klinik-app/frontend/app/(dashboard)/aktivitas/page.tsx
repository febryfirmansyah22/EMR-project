"use client";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { aktivitasApi } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type { AktivitasLog } from "@/lib/types";

const ACTION_BADGE: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
  create: "success",
  read: "default",
  update: "info",
  delete: "danger",
  login: "info",
  logout: "warning",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Buat",
  read: "Lihat",
  update: "Edit",
  delete: "Hapus",
  login: "Login",
  logout: "Logout",
};

export default function AktivitasPage() {
  const [params, setParams] = useState({ search: "", action: "", resource: "", page: 1, per_page: 25 });

  const { data, isLoading } = useQuery({
    queryKey: ["aktivitas", params],
    queryFn: async () => {
      const res = await aktivitasApi.list(params as Record<string, unknown>);
      return res.data;
    },
  });

  const items: AktivitasLog[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Log Aktivitas</h1>
        <p className="text-sm text-slate-500">Riwayat aktivitas pengguna sistem</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={params.search}
              onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
              className="input pl-9 text-sm"
            />
          </div>
          <select
            value={params.action}
            onChange={(e) => setParams({ ...params, action: e.target.value, page: 1 })}
            className="input w-auto text-sm"
          >
            <option value="">Semua Aksi</option>
            <option value="create">Buat</option>
            <option value="update">Edit</option>
            <option value="delete">Hapus</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <input
            type="text"
            placeholder="Filter resource..."
            value={params.resource}
            onChange={(e) => setParams({ ...params, resource: e.target.value, page: 1 })}
            className="input w-40 text-sm"
          />
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
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Waktu</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Pengguna</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Role</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs">Aksi</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Resource</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Tidak ada data</td></tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {formatDate(item.created_at, "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 font-medium">{item.user_name}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{item.user_role}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ACTION_BADGE[item.action] ?? "default"}>
                            {ACTION_LABEL[item.action] ?? item.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.resource}
                            {item.resource_id ? `#${item.resource_id}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">{item.ip_address}</td>
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
    </div>
  );
}
