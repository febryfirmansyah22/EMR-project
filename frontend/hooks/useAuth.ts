'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getToken, setToken, removeToken } from '@/lib/auth'
import type { LoginCredentials, AuthResponse, User } from '@/types/auth'
import type { ApiResponse } from '@/types/api'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!getToken()) return null
      const res = await api.get<ApiResponse<User>>('/auth/me')
      return res.data.data ?? null
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
      return res.data.data!
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      router.push('/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      removeToken()
      queryClient.clear()
      router.push('/login')
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
