"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Spinner } from "@/components/ui/Spinner";
import { todayInputDate } from "@/lib/utils";
import type { Setoran } from "@/lib/types";

const schema = z.object({
  tanggal: z.string().min(1),
  sumber: z.enum(["observasi", "cream", "lainnya"]),
  jumlah: z.coerce.number().min(0),
  metode: z.enum(["cash", "qris", "transfer"]),
  catatan: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  initialData?: Setoran;
  onCancel: () => void;
}

export function SetoranForm({ onSubmit, isLoading, initialData, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: initialData?.tanggal ?? todayInputDate(),
      sumber: initialData?.sumber ?? "observasi",
      jumlah: initialData?.jumlah ?? 0,
      metode: initialData?.metode ?? "cash",
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
        <div>
          <label className="label">Sumber</label>
          <select {...register("sumber")} className="input">
            <option value="observasi">Observasi</option>
            <option value="cream">Cream</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="label">Jumlah (Rp)</label>
          <input {...register("jumlah")} type="number" min={0} className="input" />
          {errors.jumlah && <p className="text-xs text-red-600 mt-1">{errors.jumlah.message}</p>}
        </div>
        <div>
          <label className="label">Metode</label>
          <select {...register("metode")} className="input">
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
          </select>
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
