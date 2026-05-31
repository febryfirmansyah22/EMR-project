"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creamApi } from "@/lib/api";
import type { CreamFilter } from "@/lib/types";

export function useCreamList(params?: CreamFilter) {
  return useQuery({
    queryKey: ["cream", params],
    queryFn: async () => {
      const res = await creamApi.list(params as Record<string, unknown>);
      return res.data;
    },
  });
}

export function useCreamSummary(params?: Partial<CreamFilter>) {
  return useQuery({
    queryKey: ["cream-summary", params],
    queryFn: async () => {
      const res = await creamApi.summary(params as Record<string, unknown>);
      return res.data.data;
    },
  });
}

export function useCreamCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => creamApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cream"] });
      qc.invalidateQueries({ queryKey: ["cream-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreamUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      creamApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cream"] });
      qc.invalidateQueries({ queryKey: ["cream-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreamDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => creamApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cream"] });
      qc.invalidateQueries({ queryKey: ["cream-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
