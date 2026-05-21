import axios, { AxiosError, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
