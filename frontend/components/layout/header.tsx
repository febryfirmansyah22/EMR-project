'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import api from '@/lib/api'
import { removeToken } from '@/lib/auth'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types/auth'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, string> = {
  super_admin:  'Super Admin',
  admin_klinik: 'Admin Klinik',
  dokter:       'Dokter',
  perawat:      'Perawat',
  farmasi:      'Farmasi',
  kasir:        'Kasir',
  owner:        'Owner',
}

/* Breadcrumb label map — path segment → display label */
const BREADCRUMB_MAP: Record<string, string> = {
  dashboard:  'Dashboard',
  pasien:     'Pasien',
  kunjungan:  'Antrean',
  daftar:     'Pendaftaran',
  farmasi:    'Farmasi',
  kasir:      'Kasir',
  laporan:    'Laporan',
  kunjungan_:  'Kunjungan',
  pendapatan: 'Pendapatan',
  master:     'Master Data',
  obat:       'Obat',
  tindakan:   'Tindakan',
  polis:      'Poli',
  baru:       'Baru',
  resep:      'Resep',
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden="true">
      {name}
    </span>
  )
}

interface HeaderProps {
  user: User
  onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && theme === 'dark'

  /* Build breadcrumb from pathname */
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, idx) => {
    const label = BREADCRUMB_MAP[seg] ?? (seg.length < 12 ? seg : `#${seg.slice(0, 6)}…`)
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const isLast = idx === segments.length - 1
    return { label, href, isLast }
  })

  async function handleLogout() {
    setMenuOpen(false)
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore — token might already be expired
    } finally {
      removeToken()
      queryClient.clear()
      router.push('/login')
      toast.success('Berhasil logout')
    }
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const roleLabel = ROLE_LABEL[user.role] ?? user.role

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#c3c6d6] bg-white px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex size-9 items-center justify-center rounded-full text-[#434654] hover:bg-[#f1f3ff] transition-colors -ml-1"
          aria-label="Open menu"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>

        {/* ── Breadcrumb (truncates on mobile, shows last segment only) ── */}
        <nav className="flex items-center gap-1 text-[13px] min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span
              key={crumb.href}
              className={cn(
                'flex items-center gap-1',
                /* On mobile, only show last crumb */
                !crumb.isLast && 'hidden sm:flex'
              )}
            >
              {i > 0 && (
                <Icon name="chevron_right" className="text-[16px] text-[#737685] hidden sm:inline" />
              )}
              {crumb.isLast ? (
                <span className="font-semibold text-[#091E42] truncate">{crumb.label}</span>
              ) : (
                <a
                  href={crumb.href}
                  className="text-[#737685] hover:text-[#0052CC] transition-colors"
                >
                  {crumb.label}
                </a>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="relative flex size-9 items-center justify-center rounded-full text-[#434654] hover:bg-[#f1f3ff] transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          suppressHydrationWarning
        >
          <Icon
            name={isDark ? 'light_mode' : 'dark_mode'}
            className={cn('text-[20px]', isDark && 'text-[#FCD34D]')}
          />
        </button>

        {/* Notification bell (static) */}
        <button
          className="relative flex size-9 items-center justify-center rounded-full text-[#434654] hover:bg-[#f1f3ff] transition-colors"
          aria-label="Notifikasi"
        >
          <Icon name="notifications" className="text-[20px]" />
        </button>

        {/* Help */}
        <button
          className="flex size-9 items-center justify-center rounded-full text-[#434654] hover:bg-[#f1f3ff] transition-colors"
          aria-label="Bantuan"
        >
          <Icon name="help" className="text-[20px]" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-[#c3c6d6]" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#f1f3ff] transition-colors"
          >
            {/* Avatar */}
            <div className="flex size-8 items-center justify-center rounded-full bg-[#dae2ff] text-[#0052CC] text-[12px] font-bold">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-[13px] font-semibold leading-none text-[#091E42]">
                {user.name}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#737685]">
                {roleLabel}
              </p>
            </div>
            <Icon name="expand_more" className="hidden md:inline text-[16px] text-[#737685]" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#c3c6d6] bg-white py-1 shadow-card">
                <div className="px-4 py-2 border-b border-[#c3c6d6]">
                  <p className="text-[13px] font-semibold text-[#091E42]">{user.name}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737685]">
                    {roleLabel}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#FF5630] hover:bg-[#FF5630]/5 transition-colors"
                >
                  <Icon name="logout" className="text-[16px]" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
