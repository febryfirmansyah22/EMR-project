"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { setoranApi } from "@/lib/api";

export function useSetoranList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["setoran", params],
    queryFn: async () => {
      const res = await setoranApi.list(params);
      return res.data;
    },
  });
}

export function useSetoranCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => setoranApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["setoran"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSetoranUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      setoranApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["setoran"] });
    },
  });
}

export function useSetoranDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setoranApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["setoran"] });
    },
  });
}
