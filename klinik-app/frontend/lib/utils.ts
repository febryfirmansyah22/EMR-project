import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string, fmt = "dd MMMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, "dd/MM/yyyy");
}

export function toInputDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "yyyy-MM-dd");
  } catch {
    return dateStr;
  }
}

export function todayInputDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: "Cash",
    qris: "QRIS",
    transfer: "Transfer",
  };
  return map[method] ?? method;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    dokter: "Dokter",
    perawat: "Perawat",
  };
  return map[role] ?? role;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? "Terjadi kesalahan";
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan";
}
