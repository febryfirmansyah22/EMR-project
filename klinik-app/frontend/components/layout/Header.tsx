"use client";
import { Menu, LogOut, Bell, Moon, Sun } from "lucide-react";
import { useLogout } from "@/lib/hooks/useAuth";
import { useTheme } from "@/providers/ThemeProvider";
import type { User } from "@/lib/types";

interface HeaderProps {
  onMenuClick: () => void;
  user?: User;
  title?: string;
}

export function Header({ onMenuClick, user, title }: HeaderProps) {
  const logout = useLogout();
  const { theme, mounted, toggle } = useTheme();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
        >
          <Menu size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={toggle}
            className="p-2 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-slate-500" />
            )}
          </button>
        )}
        <button className="p-2 hover:bg-slate-100 rounded-lg relative dark:hover:bg-slate-700">
          <Bell size={18} className="text-slate-500 dark:text-slate-400" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-500 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:text-slate-400"
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
