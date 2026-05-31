"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Spinner } from "@/components/ui/Spinner";
import { todayInputDate } from "@/lib/utils";
import type { Faktur } from "@/lib/types";

const schema = z.object({
  tanggal: z.string().min(1),
  pbf_toko: z.string().min(1, "PBF/Toko wajib diisi"),
  harga: z.coerce.number().min(0),
  keterangan: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  initialData?: Faktur;
  onCancel: () => void;
}

export function FakturForm({ onSubmit, isLoading, initialData, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: initialData?.tanggal ?? todayInputDate(),
      pbf_toko: initialData?.pbf_toko ?? "",
      harga: initialData?.harga ?? 0,
      keterangan: initialData?.keterangan ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Tanggal</label>
        <input {...register("tanggal")} type="date" className="input" />
        {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal.message}</p>}
      </div>
      <div>
        <label className="label">PBF / Toko</label>
        <input {...register("pbf_toko")} type="text" placeholder="Nama PBF atau toko" className="input" />
        {errors.pbf_toko && <p className="text-xs text-red-600 mt-1">{errors.pbf_toko.message}</p>}
      </div>
      <div>
        <label className="label">Harga (Rp)</label>
        <input {...register("harga")} type="number" min={0} className="input" />
        {errors.harga && <p className="text-xs text-red-600 mt-1">{errors.harga.message}</p>}
      </div>
      <div>
        <label className="label">Keterangan</label>
        <textarea {...register("keterangan")} rows={2} placeholder="Keterangan opsional" className="input resize-none" />
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
