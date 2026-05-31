"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fakturApi } from "@/lib/api";
import { useFakturUpdate } from "@/lib/hooks/useFaktur";
import { FakturForm } from "@/components/forms/FakturForm";
import { PageLoader } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { useState } from "react";

export default function FakturEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["faktur", Number(id)],
    queryFn: async () => { const res = await fakturApi.get(Number(id)); return res.data.data; },
    enabled: !!id,
  });
  const update = useFakturUpdate();
  const [error, setError] = useState("");

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setError("");
    try {
      await update.mutateAsync({ id: Number(id), data: formData });
      router.push("/faktur");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-5 text-sm">
        <ArrowLeft size={16} /> Kembali
      </button>
      <div className="card p-6">
        <h1 className="text-lg font-bold text-slate-900 mb-5">Edit Faktur</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <FakturForm onSubmit={handleSubmit} isLoading={update.isPending} initialData={data} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
