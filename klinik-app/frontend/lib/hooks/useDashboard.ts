"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export function useDashboardStats(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["dashboard", "stats", params],
    queryFn: async () => {
      const res = await dashboardApi.stats(params);
      return res.data.data;
    },
  });
}

export function useDashboardCharts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["dashboard", "charts", params],
    queryFn: async () => {
      const res = await dashboardApi.charts(params);
      return res.data.data;
    },
  });
}
