"use client";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmLabel = "Ya, Lanjutkan",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              : "bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
          }
        >
          {isLoading && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
