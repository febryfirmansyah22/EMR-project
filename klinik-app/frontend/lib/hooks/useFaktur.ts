"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fakturApi } from "@/lib/api";
import type { FakturFilter } from "@/lib/types";

export function useFakturList(params?: FakturFilter) {
  return useQuery({
    queryKey: ["faktur", params],
    queryFn: async () => {
      const res = await fakturApi.list(params as Record<string, unknown>);
      return res.data;
    },
  });
}

export function useFakturSummary(params?: Partial<FakturFilter>) {
  return useQuery({
    queryKey: ["faktur-summary", params],
    queryFn: async () => {
      const res = await fakturApi.summary(params as Record<string, unknown>);
      return res.data.data;
    },
  });
}

export function useFakturCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fakturApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faktur"] });
      qc.invalidateQueries({ queryKey: ["faktur-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useFakturUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      fakturApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faktur"] });
      qc.invalidateQueries({ queryKey: ["faktur-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useFakturDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fakturApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faktur"] });
      qc.invalidateQueries({ queryKey: ["faktur-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
