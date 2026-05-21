import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const COOKIE_OPTIONS = { expires: 1, secure: false, sameSite: 'lax' } as const

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS)
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
