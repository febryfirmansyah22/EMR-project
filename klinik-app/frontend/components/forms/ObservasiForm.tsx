"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Spinner } from "@/components/ui/Spinner";
import { todayInputDate } from "@/lib/utils";
import type { Observasi } from "@/lib/types";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  nama_pasien: z.string().min(1, "Nama pasien wajib diisi"),
  harga: z.coerce.number().min(0, "Harga tidak valid"),
  metode: z.enum(["cash", "qris", "transfer"]),
  setor: z.coerce.number().min(0, "Setoran tidak valid"),
  catatan: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  initialData?: Observasi;
  onCancel: () => void;
}

export function ObservasiForm({ onSubmit, isLoading, initialData, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: initialData?.tanggal ?? todayInputDate(),
      nama_pasien: initialData?.nama_pasien ?? "",
      harga: initialData?.harga ?? 0,
      metode: initialData?.metode ?? "cash",
      setor: initialData?.setor ?? 0,
      catatan: initialData?.catatan ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Tanggal</label>
          <input {...register("tanggal")} type="date" className="input" />
          {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Nama Pasien</label>
          <input {...register("nama_pasien")} type="text" placeholder="Nama lengkap" className="input" />
          {errors.nama_pasien && <p className="text-xs text-red-600 mt-1">{errors.nama_pasien.message}</p>}
        </div>
        <div>
          <label className="label">Harga (Rp)</label>
          <input {...register("harga")} type="number" min={0} className="input" />
          {errors.harga && <p className="text-xs text-red-600 mt-1">{errors.harga.message}</p>}
        </div>
        <div>
          <label className="label">Metode Pembayaran</label>
          <select {...register("metode")} className="input">
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
          </select>
          {errors.metode && <p className="text-xs text-red-600 mt-1">{errors.metode.message}</p>}
        </div>
        <div>
          <label className="label">Setoran (Rp)</label>
          <input {...register("setor")} type="number" min={0} className="input" />
          {errors.setor && <p className="text-xs text-red-600 mt-1">{errors.setor.message}</p>}
        </div>
        <div>
          <label className="label">Catatan</label>
          <input {...register("catatan")} type="text" placeholder="Opsional" className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Batal</button>
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading && <Spinner className="h-4 w-4" />}
          {initialData ? "Simpan Perubahan" : "Tambah"}
        </button>
      </div>
    </form>
  );
}
