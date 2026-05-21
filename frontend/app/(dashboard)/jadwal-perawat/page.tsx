'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

/* ────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
   ──────────────────────────────────────────────────────────────── */
type ShiftCode = 'P' | 'S' | 'M' | 'SM' | 'PM' | 'PS' | 'Libur' | 'Cuti' | ''

interface DayEntry {
  shift: ShiftCode
  infus: number
  rnp: number
  keterangan: string
}

const SHIFT_OPTIONS: { value: ShiftCode; label: string }[] = [
  { value: '',      label: '—' },
  { value: 'P',     label: 'P (Pagi)' },
  { value: 'S',     label: 'S (Sore)' },
  { value: 'M',     label: 'M (Malam)' },
  { value: 'SM',    label: 'SM (Sore+Malam)' },
  { value: 'PM',    label: 'PM (Pagi+Malam)' },
  { value: 'PS',    label: 'PS (Pagi+Sore)' },
  { value: 'Libur', label: 'Libur' },
  { value: 'Cuti',  label: 'Cuti' },
]

const SHIFT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  P:     { bg: '#D1FAE5', text: '#065F46', label: 'P' },
  S:     { bg: '#FEF3C7', text: '#92400E', label: 'S' },
  M:     { bg: '#DBEAFE', text: '#1E40AF', label: 'M' },
  SM:    { bg: '#EDE9FE', text: '#5B21B6', label: 'SM' },
  PM:    { bg: '#CFFAFE', text: '#0E7490', label: 'PM' },
  PS:    { bg: '#D1FAE5', text: '#065F46', label: 'PS' },
  Libur: { bg: '#FEE2E2', text: '#991B1B', label: 'L' },
  Cuti:  { bg: '#F3F4F6', text: '#374151', label: 'C' },
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN_NAMA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const NAVY = '#0F2540'

/* ────────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ──────────────────────────────────────────────────────────────── */
function storageKey(year: number, month: number) {
  return `jadwal_perawat_${year}_${String(month + 1).padStart(2, '0')}`
}

function loadMonth(year: number, month: number): Record<number, DayEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey(year, month))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMonth(year: number, month: number, data: Record<number, DayEntry>) {
  try {
    localStorage.setItem(storageKey(year, month), JSON.stringify(data))
  } catch { /* ignore */ }
}

/* ────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────── */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function dayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay()
}

function blankEntry(): DayEntry {
  return { shift: '', infus: 0, rnp: 0, keterangan: '' }
}

/* ────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ──────────────────────────────────────────────────────────────── */
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>
}

/* Day card — always expanded, inline edit */
function DayCard({
  day, year, month, entry, onSave,
}: {
  day: number
  year: number
  month: number
  entry: DayEntry
  onSave: (day: number, entry: DayEntry) => void
}) {
  const [form, setForm] = useState<DayEntry>(entry)
  const [dirty, setDirty] = useState(false)

  // Sync when entry changes from outside (month change)
  useEffect(() => {
    setForm(entry)
    setDirty(false)
  }, [entry])

  function set<K extends keyof DayEntry>(key: K, val: DayEntry[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setDirty(true)
  }

  function handleSave() {
    onSave(day, form)
    setDirty(false)
    toast.success(`Data tanggal ${day} ${BULAN_NAMA[month]} tersimpan`)
  }

  function handleUbah() {
    setForm(entry)
    setDirty(false)
  }

  const dow  = dayOfWeek(year, month, day)
  const badge = form.shift ? SHIFT_BADGE[form.shift] : null
  const isWeekend = dow === 0 || dow === 6
  const today = new Date()
  const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${isToday ? 'border-[#0052CC]' : 'border-[#E2E8F0]'}`}>
      {/* Day header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${isWeekend ? 'bg-[#FFF7ED]' : 'bg-[#F8FAFC]'} border-b border-[#E2E8F0]`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-[15px] ${isToday ? 'bg-[#0052CC] text-white' : isWeekend ? 'bg-[#FED7AA] text-[#9A3412]' : 'bg-[#E2E8F0] text-[#374151]'}`}>
            {day}
          </div>
          <div>
            <p className={`text-[13px] font-semibold ${isWeekend ? 'text-[#9A3412]' : 'text-[#0F2540]'}`}>{HARI[dow]}</p>
            {isToday && <p className="text-[10px] font-semibold text-[#0052CC] uppercase tracking-wide">Hari ini</p>}
          </div>
        </div>
        {badge && (
          <span
            className="inline-flex items-center justify-center rounded-full px-3 py-0.5 text-[12px] font-bold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Form body */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Row 1: Shift + Infus + RNP */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Shift</label>
            <select
              value={form.shift}
              onChange={e => set('shift', e.target.value as ShiftCode)}
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-2 text-[12px] font-semibold text-[#0F2540] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
            >
              {SHIFT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Infus <span className="text-[#CBD5E1]">×</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.infus || ''}
              onChange={e => set('infus', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[13px] font-semibold text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">RNP</label>
            <input
              type="number"
              min={0}
              value={form.rnp || ''}
              onChange={e => set('rnp', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[13px] font-semibold text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
            />
          </div>
        </div>

        {/* Row 2: Keterangan */}
        <input
          type="text"
          value={form.keterangan}
          onChange={e => set('keterangan', e.target.value)}
          placeholder="Keterangan / nama pasien"
          className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[12px] text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
        />

        {/* Row 3: Simpan + Ubah */}
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: dirty ? '#0052CC' : NAVY }}
          >
            <Icon name="check" className="text-[16px]" />
            Simpan
          </button>
          <button
            onClick={handleUbah}
            disabled={!dirty}
            className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
          >
            <Icon name="undo" className="text-[14px]" />
            Ubah
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────────────────────── */
type TabKey = 'beranda' | 'jadwal' | 'rekap'

const REKAP_ROLES = ['super_admin', 'admin_klinik', 'owner']

export default function JadwalPerawatPage() {
  const now = new Date()
  const { user } = useAuth()
  const canSeeRekap = user ? REKAP_ROLES.includes(user.role) : false

  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [data, setData]   = useState<Record<number, DayEntry>>({})
  const [tab, setTab]     = useState<TabKey>('jadwal')

  /* If current tab is rekap but user lost access, fall back to jadwal */
  useEffect(() => {
    if (tab === 'rekap' && !canSeeRekap) setTab('jadwal')
  }, [canSeeRekap, tab])

  /* Load from localStorage on mount and whenever month changes */
  useEffect(() => {
    setData(loadMonth(year, month))
  }, [year, month])

  /* Navigate month */
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else             { setMonth(m => m - 1) }
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else              { setMonth(m => m + 1) }
  }

  function handleSave(day: number, entry: DayEntry) {
    const updated = { ...data, [day]: entry }
    setData(updated)
    saveMonth(year, month, updated)
  }

  /* Derived stats */
  const totalDays = daysInMonth(year, month)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  const stats = useMemo(() => {
    const entries = Object.values(data)
    const shiftCount = entries.filter(e => e.shift && e.shift !== 'Libur' && e.shift !== 'Cuti' && e.shift !== '').length
    const totalInfus = entries.reduce((s, e) => s + (e.infus || 0), 0)
    const totalRnp   = entries.reduce((s, e) => s + (e.rnp   || 0), 0)
    const libur      = entries.filter(e => e.shift === 'Libur').length
    const cuti       = entries.filter(e => e.shift === 'Cuti').length

    // Count per shift type
    const byShift: Record<string, number> = {}
    entries.forEach(e => {
      if (e.shift) byShift[e.shift] = (byShift[e.shift] || 0) + 1
    })

    return { shiftCount, totalInfus, totalRnp, libur, cuti, byShift }
  }, [data])

  /* ── REKAP TAB ── */
  const RekapView = () => (
    <div className="space-y-4 p-4">
      {/* Big stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Shift', value: stats.shiftCount, icon: 'calendar_today', color: '#0052CC' },
          { label: 'Infus', value: stats.totalInfus, icon: 'vaccines', color: '#059669' },
          { label: 'Pasien RNP', value: stats.totalRnp, icon: 'bed', color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-center shadow-sm">
            <Icon name={s.icon} className="icon-fill text-[24px]" style={{ color: s.color } as any} />
            <p className="mt-1 text-[28px] font-bold text-[#0F2540]">{s.value}</p>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Shift breakdown */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
          <Icon name="donut_small" className="icon-fill text-[16px] text-[#3B82F6]" />
          <h3 className="text-[13px] font-bold text-[#0F2540]">Rekap Shift {BULAN_NAMA[month]} {year}</h3>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {SHIFT_OPTIONS.filter(o => o.value !== '').map(o => {
            const count = stats.byShift[o.value] || 0
            const badge = SHIFT_BADGE[o.value]
            return (
              <div key={o.value} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex size-7 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[13px] text-[#334155]">{o.label}</span>
                </div>
                <span className="text-[15px] font-bold text-[#0F2540]">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Keterangan list */}
      {Object.entries(data).some(([, e]) => e.keterangan) && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <Icon name="notes" className="icon-fill text-[16px] text-[#3B82F6]" />
            <h3 className="text-[13px] font-bold text-[#0F2540]">Catatan Pasien</h3>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {days.filter(d => data[d]?.keterangan).map(d => {
              const e = data[d]
              const badge = e.shift ? SHIFT_BADGE[e.shift] : null
              return (
                <div key={d} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[12px] font-bold text-[#374151]">
                    {d}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#94A3B8]">{HARI[dayOfWeek(year, month, d)]}, {d} {BULAN_NAMA[month]}</p>
                    <p className="text-[13px] text-[#0F2540] truncate">{e.keterangan}</p>
                  </div>
                  {badge && (
                    <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  /* ── BERANDA TAB ── */
  const BerandaView = () => (
    <div className="p-4 space-y-4">
      {/* Today highlight */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3A5F 100%)` }}>
        <div className="px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Hari Ini</p>
          <p className="mt-1 text-[22px] font-bold">
            {HARI[now.getDay()]}, {now.getDate()} {BULAN_NAMA[now.getMonth()]} {now.getFullYear()}
          </p>
          {data[now.getDate()]?.shift ? (
            <div className="mt-3 inline-flex items-center gap-2">
              {(() => {
                const b = SHIFT_BADGE[data[now.getDate()].shift!]
                return b ? (
                  <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ backgroundColor: b.bg, color: b.text }}>
                    Shift {data[now.getDate()].shift}
                  </span>
                ) : null
              })()}
              {data[now.getDate()]?.infus > 0 && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] text-white">{data[now.getDate()].infus} Infus</span>
              )}
              {data[now.getDate()]?.rnp > 0 && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] text-white">{data[now.getDate()].rnp} RNP</span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-white/60">Belum ada jadwal hari ini</p>
          )}
        </div>
      </div>

      {/* Month stats — hanya untuk super_admin, admin_klinik, owner */}
      {canSeeRekap && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <p className="text-[12px] font-bold text-[#0F2540]">Ringkasan {BULAN_NAMA[month]} {year}</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
            {[
              { label: 'Shift', value: stats.shiftCount },
              { label: 'Infus', value: stats.totalInfus },
              { label: 'RNP', value: stats.totalRnp },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 text-center">
                <p className="text-[22px] font-bold text-[#0F2540]">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming days */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
          <Icon name="upcoming" className="icon-fill text-[16px] text-[#3B82F6]" />
          <h3 className="text-[13px] font-bold text-[#0F2540]">7 Hari ke Depan</h3>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now); d.setDate(now.getDate() + i)
            const dd = d.getDate(), mm = d.getMonth(), yy = d.getFullYear()
            const e = (yy === year && mm === month) ? data[dd] : loadMonth(yy, mm)[dd]
            const badge = e?.shift ? SHIFT_BADGE[e.shift] : null
            return (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i === 0 ? 'bg-[#EFF6FF]' : ''}`}>
                <div>
                  <p className="text-[12px] font-semibold text-[#0F2540]">{HARI[d.getDay()]}, {dd} {BULAN_NAMA[mm]}</p>
                  {e?.keterangan && <p className="text-[11px] text-[#64748B] truncate max-w-[200px]">{e.keterangan}</p>}
                </div>
                {badge ? (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#CBD5E1]">—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 bg-[#F8FAFC]" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>

      {/* ── Navy Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3A5F 100%)` }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Icon name="calendar_month" className="icon-fill text-[22px] text-[#67E8F9]" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold leading-tight">Jadwal Perawat</h1>
            <p className="text-[11px] text-white/60">Elzahrawi Medika Cihaurbeuti</p>
          </div>
        </div>

        {/* Month navigator — only on Jadwal tab */}
        {tab === 'jadwal' && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Icon name="chevron_left" className="text-[20px]" />
            </button>
            <p className="text-[15px] font-semibold">
              {BULAN_NAMA[month]} {year}
            </p>
            <button
              onClick={nextMonth}
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Icon name="chevron_right" className="text-[20px]" />
            </button>
          </div>
        )}

        {/* Stats bar — hanya untuk role yang boleh lihat rekap */}
        {canSeeRekap && (
          <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-white/10 backdrop-blur-sm">
            {[
              { label: 'Shift', value: stats.shiftCount },
              { label: 'Infus', value: stats.totalInfus },
              { label: 'Pasien RNP', value: stats.totalRnp },
            ].map(s => (
              <div key={s.label} className="px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] text-white/60 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'beranda' && <BerandaView />}

        {tab === 'jadwal' && (
          <div className="p-3 space-y-2.5">
            {/* Hint */}
            <p className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] px-1">
              <Icon name="edit" className="text-[13px]" />
              Isi data shift lalu tap Simpan untuk menyimpan
            </p>

            {days.map(d => (
              <DayCard
                key={d}
                day={d}
                year={year}
                month={month}
                entry={data[d] ?? blankEntry()}
                onSave={handleSave}
              />
            ))}
          </div>
        )}

        {tab === 'rekap' && <RekapView />}
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="shrink-0 border-t border-[#E2E8F0] bg-white">
        <div className={`grid ${canSeeRekap ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {(([
            { key: 'beranda', label: 'Beranda', icon: 'home',           show: true },
            { key: 'jadwal',  label: 'Jadwal',  icon: 'calendar_month', show: true },
            { key: 'rekap',   label: 'Rekap',   icon: 'bar_chart',      show: canSeeRekap },
          ] as { key: TabKey; label: string; icon: string; show: boolean }[]).filter(t => t.show)).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                tab === t.key ? 'text-[#0052CC]' : 'text-[#94A3B8]'
              }`}
            >
              <Icon
                name={t.icon}
                className={`text-[22px] ${tab === t.key ? 'icon-fill' : ''}`}
              />
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-[#0052CC]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
