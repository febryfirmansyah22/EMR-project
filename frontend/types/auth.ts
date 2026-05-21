import type { Role } from '@/lib/constants'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  token_type: string
  user: User
}
