"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { observasiApi } from "@/lib/api";
import type { ObservasiFilter } from "@/lib/types";

export function useObservasiList(params?: ObservasiFilter) {
  return useQuery({
    queryKey: ["observasi", params],
    queryFn: async () => {
      const res = await observasiApi.list(params as Record<string, unknown>);
      return res.data;
    },
  });
}

export function useObservasiSummary(params?: Partial<ObservasiFilter>) {
  return useQuery({
    queryKey: ["observasi-summary", params],
    queryFn: async () => {
      const res = await observasiApi.summary(params as Record<string, unknown>);
      return res.data.data;
    },
  });
}

export function useObservasiById(id: number | null) {
  return useQuery({
    queryKey: ["observasi", id],
    queryFn: async () => {
      const res = await observasiApi.get(id!);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useObservasiCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => observasiApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observasi"] });
      qc.invalidateQueries({ queryKey: ["observasi-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useObservasiUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      observasiApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observasi"] });
      qc.invalidateQueries({ queryKey: ["observasi-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useObservasiDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => observasiApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observasi"] });
      qc.invalidateQueries({ queryKey: ["observasi-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
