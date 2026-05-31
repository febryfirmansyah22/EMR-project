"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  total?: number;
  from?: number;
  to?: number;
}

export function Pagination({
  currentPage,
  lastPage,
  onPageChange,
  total,
  from,
  to,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(lastPage, currentPage + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        {from && to && total && (
          <span>
            Menampilkan {from}–{to} dari {total} data
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 text-sm rounded-lg hover:bg-slate-100"
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "w-8 h-8 text-sm rounded-lg",
              p === currentPage
                ? "bg-blue-600 text-white font-medium"
                : "hover:bg-slate-100 text-slate-700"
            )}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < lastPage && (
          <>
            {pages[pages.length - 1] < lastPage - 1 && (
              <span className="px-1 text-slate-400">…</span>
            )}
            <button
              onClick={() => onPageChange(lastPage)}
              className="w-8 h-8 text-sm rounded-lg hover:bg-slate-100"
            >
              {lastPage}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
