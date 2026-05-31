"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, setToken, removeToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await authApi.me();
      return res.data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const res = await authApi.login(email, password);
      return res.data;
    },
    onSuccess: (data) => {
      setToken(data.data.token);
      queryClient.setQueryData(["me"], data.data.user);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // ignore
      }
      removeToken();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
}
