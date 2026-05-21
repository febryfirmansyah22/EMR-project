'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/constants'

/* ── Material Symbol helper ── */
function Icon({
  name,
  filled = false,
  className = '',
}: {
  name: string
  filled?: boolean
  className?: string
}) {
  return (
    <span
      className={cn('material-symbols-outlined', filled && 'icon-fill', className)}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

interface NavItem {
  label: string
  href: string
  icon: string           // Material Symbol name
  activeIcon?: string    // filled variant if different
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    roles: ['super_admin', 'admin_klinik', 'dokter', 'perawat', 'farmasi', 'kasir', 'owner'],
  },
  {
    label: 'Pasien',
    href: '/pasien',
    icon: 'person',
    roles: ['super_admin', 'admin_klinik', 'dokter', 'perawat'],
  },
  {
    label: 'Antrean',
    href: '/kunjungan',
    icon: 'view_kanban',
    roles: ['super_admin', 'admin_klinik', 'dokter', 'perawat', 'farmasi', 'kasir'],
  },
  {
    label: 'Farmasi',
    href: '/farmasi',
    icon: 'medication',
    roles: ['super_admin', 'admin_klinik', 'farmasi', 'dokter'],
  },
  {
    label: 'Kasir',
    href: '/kasir',
    icon: 'payments',
    roles: ['super_admin', 'admin_klinik', 'kasir'],
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: 'bar_chart',
    roles: ['super_admin', 'admin_klinik', 'kasir', 'owner'],
  },
  {
    label: 'Master Data',
    href: '/master/obat',
    icon: 'tune',
    roles: ['super_admin', 'admin_klinik'],
  },
]

const MASTER_SUB: { href: string; label: string; icon: string }[] = [
  { href: '/master/obat',     label: 'Obat',     icon: 'medication' },
  { href: '/master/tindakan', label: 'Tindakan', icon: 'clinical_notes' },
  { href: '/master/polis',    label: 'Poli',     icon: 'local_hospital' },
]

interface SidebarProps {
  role: Role
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const inMaster = pathname.startsWith('/master')
  const canSeeMaster = role === 'super_admin' || role === 'admin_klinik'

  /* Auto-close drawer on route change (mobile) */
  useEffect(() => {
    onClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  /* Lock body scroll when drawer open on mobile */
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}

      <aside className={cn(
        /* Mobile: drawer fixed positioned, slides in from left */
        'fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-[#c3c6d6] bg-[#f9f9ff] shadow-2xl transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        /* Desktop: static positioned, always visible */
        'md:static md:translate-x-0 md:shadow-none'
      )}>
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#c3c6d6]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0052CC]">
          <Icon name="medical_services" filled className="text-white icon-sm" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-none text-[#0052CC] tracking-tight">
            OMARA EMR
          </p>
          <p className="mt-0.5 text-[11px] text-[#434654]">Klinik Pratama</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : item.href === '/master/obat'
              ? pathname.startsWith('/master')
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors duration-150 group',
                isActive
                  ? 'bg-[#dae2ff] text-[#0052CC] font-semibold'
                  : 'text-[#434654] hover:bg-[#f1f3ff] hover:text-[#041b3c]'
              )}
            >
              <Icon
                name={item.icon}
                filled={isActive}
                className={cn(
                  'text-[20px]',
                  isActive ? 'text-[#0052CC]' : 'text-[#434654]'
                )}
              />
              <span className="flex-1 leading-none">{item.label}</span>

              {/* Active indicator bar on right edge */}
              {isActive && (
                <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-l-full bg-[#0052CC]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Master Data sub-menu ── */}
      {inMaster && canSeeMaster && (
        <div className="border-t border-[#c3c6d6] px-3 py-3">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#434654]">
            Master Data
          </p>
          {MASTER_SUB.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                pathname === href
                  ? 'bg-[#dae2ff] text-[#0052CC] font-semibold'
                  : 'text-[#434654] hover:bg-[#f1f3ff] hover:text-[#041b3c]'
              )}
            >
              <Icon
                name={icon}
                filled={pathname === href}
                className={cn(
                  'text-[16px]',
                  pathname === href ? 'text-[#0052CC]' : 'text-[#434654]'
                )}
              />
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className="border-t border-[#c3c6d6] px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#737685]">
          <Icon name="info" className="text-[16px] text-[#737685]" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
    </>
  )
}
