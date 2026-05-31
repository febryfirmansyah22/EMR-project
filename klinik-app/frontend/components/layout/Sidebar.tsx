"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  FileText,
  Banknote,
  BarChart2,
  TrendingUp,
  Users,
  ClipboardList,
  X,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/observasi", label: "Observasi Umum", icon: Activity },
  { href: "/cream", label: "Penjualan Cream", icon: Sparkles },
  { href: "/faktur", label: "Faktur Pembelian", icon: FileText },
  { href: "/setoran", label: "Setoran", icon: Banknote },
  { href: "/rekap/mingguan", label: "Rekap Mingguan", icon: BarChart2 },
  { href: "/rekap/bulanan", label: "Rekap Bulanan", icon: TrendingUp },
  { href: "/grafik", label: "Grafik", icon: TrendingUp },
  {
    href: "/pengguna",
    label: "Pengguna",
    icon: Users,
    adminOnly: true,
  },
  { href: "/aktivitas", label: "Log Aktivitas", icon: ClipboardList },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = user?.role === "super_admin";

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isSuperAdmin
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 flex flex-col",
          "transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">
                Klinik App
              </p>
              <p className="text-xs text-slate-400">Pencatatan Transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      size={17}
                      className={isActive ? "text-blue-600" : "text-slate-400"}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {user && (
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
