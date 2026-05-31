"use client";
import { Menu, LogOut, Bell } from "lucide-react";
import { useLogout } from "@/lib/hooks/useAuth";
import type { User } from "@/lib/types";

interface HeaderProps {
  onMenuClick: () => void;
  user?: User;
  title?: string;
}

export function Header({ onMenuClick, user, title }: HeaderProps) {
  const logout = useLogout();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <Bell size={18} className="text-slate-500" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-500 transition-colors"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
