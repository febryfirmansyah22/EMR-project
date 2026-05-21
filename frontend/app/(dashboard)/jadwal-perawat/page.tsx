'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────
type ShiftCode = 'P' | 'S' | 'M' | 'SM' | 'PM' | 'PS' | 'Libur' | 'Cuti' | ''
interface DayEntry { shift: ShiftCode; infus: number; rnp: number; keterangan: string }
interface Nurse    { id: string; name: string }
type TabId = 'home' | 'cal' | 'shift' | 'swap' | 'confirm' | 'stat'

// ─── Tenang Design Tokens ────────────────────────────────────────
const T = {
  bg:          '#f7f5ef',
  bgWarm:      '#f1ede6',
  surface:     '#ffffff',
  surfaceAlt:  '#f9f8f3',
  ink:         '#2b2e4a',
  inkSoft:     '#424563',
  muted:       '#797c98',
  mutedSoft:   '#a2a5bc',
  hairline:    '#e5e0d5',
  hairlineSoft:'#eeeae0',
  accent:      '#4a8fa8',
  accentInk:   '#2c6c84',
  accentSoft:  '#d9ecf3',
  danger:      '#c35c3a',
  dangerSoft:  '#fde6de',
}

// ─── Shift Visual Palette ────────────────────────────────────────
const SV: Record<string, { label: string; time: string; bg: string; bgSoft: string; ink: string; dot: string; icon: string }> = {
  P:     { label: 'Pagi',      time: '07:00–14:00', bg: '#f4dcbf', bgSoft: '#faf3e5', ink: '#7c4215', dot: '#c87235', icon: '☀' },
  S:     { label: 'Sore',      time: '14:00–21:00', bg: '#bfe6d0', bgSoft: '#e8f5ed', ink: '#185c32', dot: '#4a9660', icon: '◐' },
  M:     { label: 'Malam',     time: '21:00–07:00', bg: '#d2caec', bgSoft: '#ece8f7', ink: '#32247c', dot: '#6250bc', icon: '☾' },
  SM:    { label: 'Sore+Mlm',  time: 'Sore & Malam', bg: '#d5ceef', bgSoft: '#edebf8', ink: '#38287e', dot: '#6855be', icon: '◐☾' },
  PM:    { label: 'Pagi+Mlm',  time: 'Pagi & Malam', bg: '#ead9ce', bgSoft: '#f8f2ec', ink: '#7a3820', dot: '#c06840', icon: '☀☾' },
  PS:    { label: 'Pagi+Sore', time: 'Pagi & Sore',  bg: '#d5e8ce', bgSoft: '#eef5ea', ink: '#2e5820', dot: '#6a9450', icon: '☀◐' },
  Libur: { label: 'Libur',     time: 'Hari libur',   bg: '#ece8e0', bgSoft: '#f4f3ee', ink: '#5c5e70', dot: '#b0a898', icon: '○' },
  Cuti:  { label: 'Cuti',      time: 'Cuti',          bg: '#fce8c0', bgSoft: '#fff5e0', ink: '#8c5c10', dot: '#c89828', icon: '✈' },
}

// ─── Constants ───────────────────────────────────────────────────
const HARI_FULL  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const HARI_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const SHIFT_OPTIONS: { value: ShiftCode; label: string }[] = [
  { value: 'P',     label: '☀ Pagi (07:00–14:00)' },
  { value: 'S',     label: '◐ Sore (14:00–21:00)' },
  { value: 'M',     label: '☾ Malam (21:00–07:00)' },
  { value: 'SM',    label: '◐☾ Sore+Malam' },
  { value: 'PM',    label: '☀☾ Pagi+Malam' },
  { value: 'PS',    label: '☀◐ Pagi+Sore' },
  { value: 'Libur', label: '○ Libur' },
  { value: 'Cuti',  label: '✈ Cuti' },
]

const SHIFT_WEIGHT: Record<string, number> = { P:1, S:1, M:1, SM:2, PM:2, PS:2, Libur:0, Cuti:0 }
const REAL_SHIFTS = new Set(['P','S','M','SM','PM','PS'])
const FEE_PER_SHIFT = 50_000
const FEE_PER_INFUS = 5_000
const FEE_PER_RNP   = 5_000
const RNP_THRESHOLD = 3
const REKAP_ROLES   = ['super_admin', 'admin_klinik', 'owner']

// ─── Storage ─────────────────────────────────────────────────────
function schedKey(id: string, y: number, m: number) {
  return `jadwal_${id}_${y}_${String(m + 1).padStart(2, '0')}`
}
function loadSched(id: string, y: number, m: number): Record<number, DayEntry> {
  if (typeof window === 'undefined') return {}
  try { const r = localStorage.getItem(schedKey(id, y, m)); return r ? JSON.parse(r) : {} } catch { return {} }
}
function saveSched(id: string, y: number, m: number, d: Record<number, DayEntry>) {
  try { localStorage.setItem(schedKey(id, y, m), JSON.stringify(d)) } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function dow(y: number, m: number, d: number) { return new Date(y, m, d).getDay() }
function blankEntry(): DayEntry { return { shift: '', infus: 0, rnp: 0, keterangan: '' } }
function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
function dailyFee(e: DayEntry): number {
  const w = SHIFT_WEIGHT[e.shift] ?? 0; if (!w) return 0
  return w * FEE_PER_SHIFT + (e.infus || 0) * FEE_PER_INFUS
}
function computeStats(data: Record<number, DayEntry>) {
  const entries = Object.values(data)
  const shiftCount = entries.reduce((s, e) => s + (SHIFT_WEIGHT[e.shift] ?? 0), 0)
  const totalInfus = entries.reduce((s, e) => s + (e.infus || 0), 0)
  const totalRnp   = entries.reduce((s, e) => s + (e.rnp   || 0), 0)
  const byShift: Record<string, number> = {}
  entries.forEach(e => { if (e.shift) byShift[e.shift] = (byShift[e.shift] || 0) + 1 })
  const feeShift = shiftCount * FEE_PER_SHIFT
  const feeInfus = totalInfus * FEE_PER_INFUS
  const rnpBillable = Math.max(0, totalRnp - RNP_THRESHOLD)
  const feeRnp = rnpBillable * FEE_PER_RNP
  return { shiftCount, totalInfus, totalRnp, byShift, feeShift, feeInfus, feeRnp, rnpBillable, totalFee: feeShift + feeInfus + feeRnp }
}

// ─── ATOMS ───────────────────────────────────────────────────────
function ShiftPill({ code, size = 'sm', showTime = false }: {
  code: string; size?: 'xs' | 'sm' | 'md'; showTime?: boolean
}) {
  const sv = SV[code]
  if (!sv) return null
  const h  = { xs: 22, sm: 28, md: 34 }
  const fs = { xs: 11, sm: 12.5, md: 14 }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: h[size], padding: `0 ${size === 'xs' ? 8 : 11}px`,
      borderRadius: 999, background: sv.bg, color: sv.ink,
      fontSize: fs[size], fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <span style={{ opacity: 0.85 }}>{sv.icon}</span>
      <span>{sv.label}</span>
      {showTime && <span style={{ opacity: 0.6, fontWeight: 500 }}> · {sv.time}</span>}
    </span>
  )
}

function TAvatar({ name, size = 36, ring = false }: { name: string; size?: number; ring?: boolean }) {
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue  = (seed * 37) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: `oklch(0.88 0.04 ${hue})`, color: `oklch(0.35 0.08 ${hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.36, flexShrink: 0, letterSpacing: -0.2,
      boxShadow: ring ? `0 0 0 2px ${T.bg}, 0 0 0 3px ${T.accent}` : 'none',
    }}>
      {initials(name)}
    </div>
  )
}

function TCard({ children, pad = 18, style }: {
  children: React.ReactNode; pad?: number; style?: React.CSSProperties
}) {
  return (
    <div style={{ background: T.surface, borderRadius: 20, padding: pad, border: `1px solid ${T.hairlineSoft}`, ...style }}>
      {children}
    </div>
  )
}

function TBtn({ children, variant = 'primary', size = 'md', full, style, onClick }: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'soft' | 'ghost';
  size?: 'sm' | 'md'; full?: boolean; style?: React.CSSProperties; onClick?: () => void
}) {
  const vs = {
    primary:   { bg: T.accent,     fg: '#fff',      border: 'transparent' },
    secondary: { bg: '#fff',        fg: T.ink,       border: T.hairline },
    soft:      { bg: T.accentSoft,  fg: T.accentInk, border: 'transparent' },
    ghost:     { bg: 'transparent', fg: T.accentInk, border: 'transparent' },
  }
  const szs = {
    sm: { h: 34, fs: 12.5, px: 14 },
    md: { h: 44, fs: 14.5, px: 18 },
  }
  const v = vs[variant]; const sz = szs[size]
  return (
    <button onClick={onClick} style={{
      height: sz.h, padding: `0 ${sz.px}px`, borderRadius: 999,
      background: v.bg, color: v.fg, border: `1px solid ${v.border}`,
      fontWeight: 600, fontSize: sz.fs, letterSpacing: -0.1, cursor: 'pointer',
      width: full ? '100%' : undefined,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      fontFamily: 'inherit',
      ...style,
    }}>
      {children}
    </button>
  )
}

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: 10.5, color: color ?? T.muted,
      fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' as const,
    }}>
      {children}
    </div>
  )
}

function Topbar({ eyebrow, title, accent, right }: {
  eyebrow: string; title: string; accent?: string; right?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
      <div>
        <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 500, letterSpacing: 0.2 }}>{eyebrow}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 3, lineHeight: 1.1, color: T.ink }}>
          {accent && <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{accent} </span>}
          {title}
        </div>
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

// ─── SCREEN D1: Beranda ───────────────────────────────────────────
function ScreenHome({ data, year, month, activeNurse, setActiveTab }: {
  data: Record<number, DayEntry>; year: number; month: number
  activeNurse: Nurse | null; setActiveTab: (t: TabId) => void
}) {
  const today = new Date()
  const todayEntry = data[today.getDate()]
  const sv = todayEntry?.shift ? SV[todayEntry.shift] : null

  // Build Mon–Sun week containing today
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = new Date(today); monday.setDate(today.getDate() - mondayOffset)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const e = (d.getFullYear() === year && d.getMonth() === month) ? data[d.getDate()] : undefined
    return { d, isToday, e }
  })

  const stats = computeStats(data)

  return (
    <div style={{ flex: 1, padding: '26px 28px', minWidth: 0, overflowY: 'auto' }}>
      <Topbar
        eyebrow={`${HARI_FULL[today.getDay()]}, ${today.getDate()} ${BULAN[today.getMonth()]} ${today.getFullYear()}`}
        accent="Selamat pagi,"
        title={activeNurse?.name.split(' ')[0] ?? 'Perawat'}
        right={
          <>
            <TBtn variant="secondary" size="sm">Cetak jadwal</TBtn>
            <TBtn variant="primary" size="sm" onClick={() => setActiveTab('swap')}>⇄ Ajukan tukar</TBtn>
          </>
        }
      />

      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Today's shift */}
        <div style={{
          background: sv?.bg ?? T.hairlineSoft, borderRadius: 20,
          padding: '24px 26px', color: sv?.ink ?? T.muted,
          position: 'relative', overflow: 'hidden', minHeight: 188,
        }}>
          <div style={{
            position: 'absolute', top: -10, right: -8,
            fontSize: 180, opacity: 0.14, lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
          }}>{sv?.icon ?? '—'}</div>
          <MonoLabel color={sv ? sv.ink + 'cc' : undefined}>
            {todayEntry?.shift ? 'Hari ini · Shift aktif' : 'Hari ini'}
          </MonoLabel>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.7, marginTop: 8, lineHeight: 1 }}>
            {sv ? `Shift ${sv.label}` : 'Belum ada jadwal'}
          </div>
          {sv && (
            <div style={{ fontSize: 15, marginTop: 8, opacity: 0.85 }}>
              {sv.time}
              {todayEntry?.keterangan && ` · ${todayEntry.keterangan}`}
            </div>
          )}
          {((todayEntry?.infus ?? 0) > 0 || (todayEntry?.rnp ?? 0) > 0) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {(todayEntry?.infus ?? 0) > 0 && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>
                  💉 {todayEntry!.infus} infus
                </span>
              )}
              {(todayEntry?.rnp ?? 0) > 0 && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>
                  🛏 {todayEntry!.rnp} RNP
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
            <div style={{ flex: 1 }} />
            <TBtn
              variant="secondary" size="sm"
              style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0)' }}
              onClick={() => setActiveTab('shift')}
            >
              Lihat detail
            </TBtn>
          </div>
        </div>

        {/* Incoming swap request */}
        <TCard pad={20} style={{ minHeight: 188 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MonoLabel>Permintaan masuk</MonoLabel>
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.accentInk,
              background: T.accentSoft, padding: '3px 8px', borderRadius: 7,
            }}>2 BARU</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TAvatar name="Maya Lestari" size={40} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>Maya Lestari</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>23 menit lalu</div>
            </div>
          </div>
          <div style={{
            marginTop: 12, padding: '10px 12px', background: T.bgWarm,
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
          }}>
            <ShiftPill code="M" size="xs" />
            <span style={{ color: T.muted }}>Jum 24</span>
            <span style={{ color: T.mutedSoft, fontSize: 14 }}>⇄</span>
            <ShiftPill code="S" size="xs" />
            <span style={{ color: T.muted }}>Sab 25</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <TBtn variant="secondary" size="sm" style={{ flex: 1 }}>Tolak</TBtn>
            <TBtn variant="primary" size="sm" style={{ flex: 1.4 }}>Setuju</TBtn>
          </div>
        </TCard>
      </div>

      {/* Weekly mini strip */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <MonoLabel>Minggu ini</MonoLabel>
          <span
            style={{ fontSize: 12, color: T.accentInk, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab('cal')}
          >
            Buka kalender bulan →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {week.map(({ d, isToday, e }, i) => {
            const wsv = e?.shift ? SV[e.shift] : null
            const dayName = HARI_SHORT[d.getDay()]
            return (
              <div key={i} style={{
                padding: '12px 10px', borderRadius: 14,
                background: isToday ? (wsv?.bg ?? T.hairlineSoft) : (wsv?.bgSoft ?? T.surfaceAlt),
                border: isToday ? `2px solid ${wsv?.ink ?? T.muted}` : '1px solid transparent',
                color: wsv?.ink ?? T.muted,
                minHeight: 88, display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' as const }}>{dayName}</span>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{d.getDate()}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>{wsv?.icon ?? '—'}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{wsv?.label ?? 'Bebas'}</span>
                </div>
                {wsv && !['Libur', 'Cuti'].includes(e?.shift ?? '') && (
                  <div style={{ fontSize: 9.5, opacity: 0.65 }}>{wsv.time}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        {[
          { lbl: `Shift ${BULAN[month]}`,  val: String(stats.shiftCount), sub: 'shift tercatat' },
          { lbl: 'Infus',                   val: String(stats.totalInfus), sub: 'pasien infus' },
          { lbl: 'RNP',                     val: String(stats.totalRnp),   sub: 'pasien RNP' },
          { lbl: 'Estimasi Fee',             val: formatRp(stats.totalFee), sub: 'bulan ini' },
        ].map(st => (
          <TCard key={st.lbl} pad={16} style={{ flex: 1 }}>
            <MonoLabel>{st.lbl}</MonoLabel>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, letterSpacing: -0.4, color: T.ink }}>
              {st.val}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{st.sub}</div>
          </TCard>
        ))}
      </div>
    </div>
  )
}

// ─── SCREEN D2: Jadwal bulanan ────────────────────────────────────
function ScreenCal({ data, year, month, setYear, setMonth, onSave, activeNurse, adminNurses, selectedId, setSelectedId, isPerawat, isFetchingPerawat }: {
  data: Record<number, DayEntry>; year: number; month: number
  setYear: (y: number) => void; setMonth: (m: number) => void
  onSave: (day: number, entry: DayEntry) => void
  activeNurse: Nurse | null; adminNurses: Nurse[]
  selectedId: string | null; setSelectedId: (id: string) => void
  isPerawat: boolean; isFetchingPerawat: boolean
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [form, setForm]   = useState<DayEntry>(blankEntry())
  const [dirty, setDirty] = useState(false)

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)
  const calCells = useMemo(() => {
    const offset = (dow(year, month, 1) + 6) % 7
    const cells: (number | null)[] = [...Array(offset).fill(null), ...days]
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month, days])

  useEffect(() => {
    if (selectedDay) { setForm(data[selectedDay] ?? blankEntry()); setDirty(false) }
  }, [selectedDay, data])

  function prevMonth() { if (month === 0) { setYear(year - 1); setMonth(11) } else setMonth(month - 1) }
  function nextMonth() { if (month === 11) { setYear(year + 1); setMonth(0) } else setMonth(month + 1) }

  function handleSave() {
    if (!selectedDay) return
    onSave(selectedDay, form); setDirty(false)
    toast.success(`Tgl ${selectedDay} ${BULAN[month]} tersimpan`)
  }

  const today = new Date()
  const weeks = useMemo(() => {
    const rows = []
    for (let i = 0; i < calCells.length; i += 7) rows.push(calCells.slice(i, i + 7))
    return rows
  }, [calCells])

  return (
    <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
      {/* Calendar area */}
      <div style={{ flex: 1, padding: '26px 28px', overflowY: 'auto', minWidth: 0 }}>
        <Topbar
          eyebrow="Jadwal kerja"
          accent={BULAN[month]}
          title={String(year)}
          right={
            <>
              {!isPerawat && adminNurses.length > 0 && (
                <div style={{ display: 'flex', gap: 5 }}>
                  {adminNurses.slice(0, 4).map(n => (
                    <button key={n.id} onClick={() => setSelectedId(n.id)} style={{
                      height: 30, padding: '0 11px', borderRadius: 999, cursor: 'pointer',
                      background: n.id === selectedId ? T.ink : '#fff',
                      color:      n.id === selectedId ? '#fff' : T.inkSoft,
                      border: `1px solid ${n.id === selectedId ? T.ink : T.hairline}`,
                      fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
                    }}>{n.name.split(' ')[0]}</button>
                  ))}
                </div>
              )}
              <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${T.hairline}`, background: '#fff', color: T.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>‹</button>
              <button onClick={() => { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()) }}
                style={{ height: 32, padding: '0 12px', borderRadius: 16, border: `1px solid ${T.hairline}`, background: '#fff', color: T.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Hari ini
              </button>
              <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${T.hairline}`, background: '#fff', color: T.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>›</button>
            </>
          }
        />

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' as const }}>
          {['P', 'S', 'M', 'Libur'].map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.muted }}>
              <div style={{ width: 13, height: 13, borderRadius: 4, background: SV[k].bg, flexShrink: 0 }} />
              <span style={{ color: T.inkSoft, fontWeight: 500 }}>{SV[k].label}</span>
              <span style={{ color: T.mutedSoft, fontSize: 10.5 }}>{SV[k].time}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${T.hairlineSoft}`, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.hairlineSoft}` }}>
            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((d, i) => (
              <div key={i} style={{
                padding: '11px 14px', fontSize: 10.5, color: T.muted,
                fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const,
                borderRight: i < 6 ? `1px solid ${T.hairlineSoft}` : 'none',
              }}>{d}</div>
            ))}
          </div>
          {/* Weeks */}
          {weeks.map((wk, wi) => (
            <div key={wi} style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: wi < weeks.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              {wk.map((cell, ci) => {
                const sv = cell && data[cell]?.shift ? SV[data[cell].shift] : null
                const isToday = cell ? (today.getFullYear() === year && today.getMonth() === month && today.getDate() === cell) : false
                const isSel = cell === selectedDay
                return (
                  <div key={ci} onClick={() => cell && setSelectedDay(prev => prev === cell ? null : cell)}
                    style={{
                      borderRight: ci < 6 ? `1px solid ${T.hairlineSoft}` : 'none',
                      minHeight: 90, padding: '10px 12px',
                      background: !cell ? T.bg : isSel ? (sv?.bg ?? T.accentSoft) : (sv?.bgSoft ?? T.surfaceAlt),
                      position: 'relative', cursor: cell ? 'pointer' : 'default',
                      outline: isSel ? `2px solid ${T.accent}` : isToday ? `2px solid ${T.muted}` : 'none',
                      outlineOffset: -2, transition: 'background 0.1s',
                    }}>
                    {cell && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: isSel ? 700 : 600, color: sv?.ink ?? T.muted }}>
                          {cell}
                        </div>
                        {isToday && (
                          <div style={{
                            position: 'absolute', top: 6, right: 8,
                            fontSize: 8.5, fontWeight: 700, color: T.accentInk,
                            background: T.accentSoft, padding: '2px 5px', borderRadius: 4, letterSpacing: 0.4,
                          }}>HARI INI</div>
                        )}
                        {sv && (
                          <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10 }}>
                            <ShiftPill code={data[cell].shift} size="xs" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 11.5, color: T.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {BULAN[month]} {year} · {Object.values(data).filter(e => REAL_SHIFTS.has(e.shift as string)).length} hari kerja
            · {Object.values(data).filter(e => e.shift === 'Libur' || e.shift === 'Cuti').length} hari libur/cuti
          </span>
          {activeNurse && <span>Jadwal: {activeNurse.name}</span>}
        </div>
      </div>

      {/* Right panel: day input */}
      {selectedDay ? (
        <div style={{
          width: 295, borderLeft: `1px solid ${T.hairline}`,
          background: T.bgWarm, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flexShrink: 0,
        }}>
          <div>
            <MonoLabel>Input jadwal</MonoLabel>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginTop: 4 }}>
              {HARI_FULL[dow(year, month, selectedDay)]}, {selectedDay} {BULAN[month]}
            </div>
          </div>

          {/* Shift buttons */}
          <div>
            <MonoLabel>Shift</MonoLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {SHIFT_OPTIONS.map(o => {
                const sv = SV[o.value as string]
                const sel = form.shift === o.value
                return (
                  <button key={o.value}
                    onClick={() => { setForm(f => ({ ...f, shift: o.value })); setDirty(true) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 13px', borderRadius: 11, cursor: 'pointer', textAlign: 'left',
                      background: sel ? sv.bg : '#fff',
                      color: sel ? sv.ink : T.inkSoft,
                      border: `1.5px solid ${sel ? sv.ink + '60' : T.hairlineSoft}`,
                      fontWeight: sel ? 600 : 500, fontSize: 13, fontFamily: 'inherit',
                    }}>
                    <span>{sv.icon}</span>
                    <span style={{ flex: 1 }}>{sv.label}</span>
                    {sel && <span style={{ fontSize: 10, opacity: 0.6 }}>✓</span>}
                  </button>
                )
              })}
              {/* Clear */}
              {form.shift && (
                <button onClick={() => { setForm(f => ({ ...f, shift: '' })); setDirty(true) }}
                  style={{ fontSize: 11.5, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 2px', fontFamily: 'inherit' }}>
                  ✕ Hapus shift
                </button>
              )}
            </div>
          </div>

          {/* Infus & RNP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([['infus', '💉', 'Infus'], ['rnp', '🛏', 'RNP']] as const).map(([key, icon, label]) => (
              <div key={key}>
                <MonoLabel>{icon} {label}</MonoLabel>
                <input type="number" min={0} value={form[key] || ''} placeholder="0"
                  onChange={e => { setForm(f => ({ ...f, [key]: Math.max(0, parseInt(e.target.value) || 0) })); setDirty(true) }}
                  style={{
                    width: '100%', height: 40, borderRadius: 10, marginTop: 6,
                    border: `1px solid ${T.hairline}`, padding: '0 12px',
                    fontSize: 14, fontWeight: 600, color: T.ink,
                    boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit',
                  }} />
              </div>
            ))}
          </div>

          {/* Keterangan */}
          <div>
            <MonoLabel>Keterangan</MonoLabel>
            <input type="text" value={form.keterangan} placeholder="Nama pasien / catatan"
              onChange={e => { setForm(f => ({ ...f, keterangan: e.target.value })); setDirty(true) }}
              style={{
                width: '100%', height: 40, borderRadius: 10, marginTop: 6,
                border: `1px solid ${T.hairline}`, padding: '0 12px',
                fontSize: 13, color: T.ink, boxSizing: 'border-box' as const,
                background: '#fff', fontFamily: 'inherit',
              }} />
          </div>

          {/* Fee preview */}
          {form.shift && (SHIFT_WEIGHT[form.shift] ?? 0) > 0 && (
            <div style={{ padding: '12px 14px', background: T.accentSoft, borderRadius: 12 }}>
              <div style={{ fontSize: 10.5, color: T.accentInk, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' as const }}>
                Estimasi fee hari ini
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.accentInk, marginTop: 4 }}>
                {formatRp(dailyFee(form))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <TBtn variant="secondary" size="sm" style={{ flex: 1 }}
              onClick={() => { setForm(data[selectedDay!] ?? blankEntry()); setDirty(false) }}>
              Reset
            </TBtn>
            <TBtn variant="primary" size="sm" style={{ flex: 1.6, opacity: dirty ? 1 : 0.55 }}
              onClick={handleSave}>
              ✓ Simpan
            </TBtn>
          </div>

          <button onClick={() => setSelectedDay(null)} style={{
            fontSize: 11.5, color: T.muted, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none', fontFamily: 'inherit',
          }}>
            Tutup panel
          </button>
        </div>
      ) : (
        /* Hint when no day selected */
        <div style={{
          width: 220, borderLeft: `1px solid ${T.hairline}`,
          background: T.bgWarm, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ fontSize: 32, opacity: 0.25 }}>▦</div>
          <div style={{ fontSize: 12.5, color: T.muted, textAlign: 'center', lineHeight: 1.5 }}>
            Klik tanggal di kalender<br />untuk input shift
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SCREEN D3: Detail shift hari ini ────────────────────────────
function ScreenShift({ data, year, month, setActiveTab }: {
  data: Record<number, DayEntry>; year: number; month: number; setActiveTab: (t: TabId) => void
}) {
  const today = new Date()
  const todayEntry = data[today.getDate()]
  const sv = todayEntry?.shift ? SV[todayEntry.shift] : SV.S

  const shiftHours: Record<string, [number, number]> = {
    P: [7, 14], S: [14, 21], M: [21, 24], PM: [7, 14], PS: [7, 21], SM: [14, 24],
  }
  const [shStart, shEnd] = todayEntry?.shift ? (shiftHours[todayEntry.shift] ?? [14, 21]) : [14, 21]
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div style={{ flex: 1, padding: '26px 28px', minWidth: 0, overflowY: 'auto' }}>
      <Topbar
        eyebrow={`${HARI_FULL[today.getDay()]}, ${today.getDate()} ${BULAN[today.getMonth()]} ${today.getFullYear()}`}
        accent="Shift"
        title="hari ini"
        right={
          <>
            <TBtn variant="secondary" size="sm">Catatan handover</TBtn>
            <TBtn variant="primary" size="sm" onClick={() => setActiveTab('swap')}>⇄ Ajukan tukar</TBtn>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* 24h timeline */}
        <TCard pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.hairlineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <MonoLabel>Linimasa hari</MonoLabel>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: T.ink }}>
                {today.getDate()} {BULAN[today.getMonth()]} · 24 jam
              </div>
            </div>
            {todayEntry?.shift && <ShiftPill code={todayEntry.shift} size="md" showTime />}
          </div>
          <div style={{ padding: '10px 18px 18px', maxHeight: 480, overflowY: 'auto' }}>
            {hours.map(h => {
              const inMyShift = h >= shStart && h < shEnd
              return (
                <div key={h} style={{ display: 'flex', alignItems: 'flex-start', minHeight: 22, gap: 14, borderBottom: `1px solid ${T.hairlineSoft}` }}>
                  <div style={{ width: 38, fontSize: 10.5, color: T.muted, paddingTop: 3, fontFamily: 'monospace', flexShrink: 0 }}>
                    {h.toString().padStart(2, '0')}:00
                  </div>
                  <div style={{ flex: 1, height: 22, position: 'relative' }}>
                    {h === shStart && (
                      <div style={{
                        position: 'absolute', top: 2, left: 0, right: 0,
                        height: (shEnd - shStart) * 22 - 4,
                        background: sv.bg, color: sv.ink,
                        borderRadius: 8, padding: '6px 12px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2,
                      }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>Shift {sv.label}</div>
                        <div style={{ fontSize: 10.5, opacity: 0.7 }}>{todayEntry?.keterangan || 'Jadwal aktif'}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TCard>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TCard pad={16}>
            <MonoLabel>Tim shift · 4 orang</MonoLabel>
            <div style={{ marginTop: 12 }}>
              {['Sari Wulandari', 'Andi Pratama', 'Maya Lestari', 'Rini Hapsari'].map((name, i, arr) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none',
                }}>
                  <TAvatar name={name} size={32} ring={i === 0} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                      {name}
                      {i === 0 && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: T.accentInk, marginLeft: 6, background: T.accentSoft, padding: '1px 6px', borderRadius: 4 }}>KAMU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>Perawat IGD</div>
                  </div>
                </div>
              ))}
            </div>
          </TCard>

          <TCard pad={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <MonoLabel>Catatan handover</MonoLabel>
              <span style={{ fontSize: 10.5, color: T.mutedSoft }}>13:55</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <TAvatar name="Eko Saputra" size={26} />
              <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6 }}>
                Pasien Bed 3 perlu obat jam 16:00. Pasien Bed 7 menunggu hasil lab. Ruang IGD relatif tenang.
              </div>
            </div>
          </TCard>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN D4: Tukar shift — cari rekan ─────────────────────────
function ScreenSwap({ setActiveTab }: { setActiveTab: (t: TabId) => void }) {
  const candidates = [
    { name: 'Andi Pratama',  role: 'Perawat Umum', tenure: '5 thn', myDay: 'Rab 22', mine: 'S', theirDay: 'Kam 23', theirs: 'P',     fit: 95, note: 'Jam istirahat aman · sudah pernah tukar 3×' },
    { name: 'Dewi Anjani',   role: 'Perawat Umum', tenure: '1 thn', myDay: 'Rab 22', mine: 'S', theirDay: 'Sab 25', theirs: 'S',     fit: 88, note: 'Cocok jam, beda hari' },
    { name: 'Bayu Saputra',  role: 'Perawat IGD',  tenure: '6 thn', myDay: 'Rab 22', mine: 'S', theirDay: 'Sen 27', theirs: 'P',     fit: 72, note: 'Beda minggu, perlu cek lembur' },
    { name: 'Maya Lestari',  role: 'Perawat IGD',  tenure: '2 thn', myDay: 'Rab 22', mine: 'S', theirDay: 'Jum 24', theirs: 'M',     fit: 64, note: 'Sore ↔ malam, jeda istirahat ketat' },
    { name: 'Rini Hapsari',  role: 'Perawat Anak', tenure: '4 thn', myDay: 'Rab 22', mine: 'S', theirDay: 'Min 26', theirs: 'Libur', fit: 30, note: 'Tidak ideal · libur tidak diganti' },
  ]

  function fitStyle(f: number) {
    if (f >= 80) return { bg: SV.S.bg, fg: SV.S.ink }
    if (f >= 60) return { bg: SV.P.bg, fg: SV.P.ink }
    return { bg: SV.Cuti.bg, fg: SV.Cuti.ink }
  }

  return (
    <div style={{ flex: 1, padding: '26px 28px', minWidth: 0, overflowY: 'auto' }}>
      <Topbar
        eyebrow="Tukar shift · untuk Rabu 22 (Sore)"
        accent="Cari"
        title="rekan untuk tukar"
        right={
          <>
            <TBtn variant="secondary" size="sm" onClick={() => setActiveTab('home')}>Tutup</TBtn>
            <TBtn variant="primary" size="sm" onClick={() => setActiveTab('confirm')}>Lanjut konfirmasi</TBtn>
          </>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', background: '#fff', borderRadius: 12,
          border: `1px solid ${T.hairline}`, flex: 1, maxWidth: 320,
        }}>
          <span style={{ color: T.mutedSoft, fontSize: 14 }}>⌕</span>
          <span style={{ fontSize: 13, color: T.muted }}>Cari nama perawat…</span>
        </div>
        {['Semua bagian', 'IGD', 'Minggu ini', 'Cocok jam'].map((lbl, i) => (
          <div key={lbl} style={{
            padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
            background: i === 0 ? T.ink : '#fff',
            color: i === 0 ? T.bg : T.inkSoft,
            border: `1px solid ${i === 0 ? T.ink : T.hairline}`,
            fontSize: 12, fontWeight: 600,
          }}>{lbl}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: T.muted }}>Urutkan: <b style={{ color: T.ink }}>Skor kecocokan</b></div>
      </div>

      {/* Table */}
      <TCard pad={0} style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 1.6fr 1.4fr 90px',
          padding: '11px 18px', background: T.bgWarm, borderBottom: `1px solid ${T.hairlineSoft}`,
          fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.6, textTransform: 'uppercase' as const,
        }}>
          <div>Rekan</div><div>Shift kamu</div><div>Tawaran</div><div>Catatan</div>
          <div style={{ textAlign: 'right' as const }}>Skor</div>
        </div>
        {candidates.map((c, i) => {
          const fc = fitStyle(c.fit)
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 1.6fr 1.4fr 90px',
              padding: '13px 18px', alignItems: 'center',
              borderBottom: i < candidates.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TAvatar name={c.name} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                    {c.name}
                    {i === 0 && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: T.accentInk, marginLeft: 6, background: T.accentSoft, padding: '2px 6px', borderRadius: 4 }}>SARAN</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{c.role} · {c.tenure}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShiftPill code={c.mine} size="xs" />
                <span style={{ fontSize: 11, color: T.muted }}>{c.myDay}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShiftPill code={c.theirs} size="xs" />
                <span style={{ fontSize: 11, color: T.muted }}>{c.theirDay}</span>
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{c.note}</div>
              <div style={{ textAlign: 'right' as const }}>
                <span style={{ padding: '4px 10px', borderRadius: 8, background: fc.bg, color: fc.fg, fontSize: 15, fontWeight: 700 }}>
                  {c.fit}<span style={{ fontSize: 9, opacity: 0.7 }}>%</span>
                </span>
              </div>
            </div>
          )
        })}
      </TCard>
      <div style={{ marginTop: 10, fontSize: 11.5, color: T.muted, textAlign: 'right' as const }}>
        5 rekan ditemukan · skor berdasarkan jeda istirahat, beban jam, & kesamaan unit
      </div>
    </div>
  )
}

// ─── SCREEN D5: Konfirmasi tukar ──────────────────────────────────
function ScreenConfirm({ setActiveTab }: { setActiveTab: (t: TabId) => void }) {
  const before = ['P', 'P', 'S',    'Libur', 'M', 'M', 'Libur']
  const after  = ['P', 'P', 'Libur','S',     'M', 'M', 'Libur']
  const days   = [{ d: 'Sen', n: 20 }, { d: 'Sel', n: 21 }, { d: 'Rab', n: 22 }, { d: 'Kam', n: 23 }, { d: 'Jum', n: 24 }, { d: 'Sab', n: 25 }, { d: 'Min', n: 26 }]
  const marks  = [2, 3]

  function Strip({ codes }: { codes: string[] }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {codes.map((code, i) => {
          const sv = SV[code]
          return (
            <div key={i} style={{
              borderRadius: 12, background: sv.bg, color: sv.ink,
              padding: '10px 8px', textAlign: 'center' as const,
              border: marks.includes(i) ? `2px solid ${T.accent}` : '2px solid transparent',
              minHeight: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.65, letterSpacing: 0.4, textTransform: 'uppercase' as const }}>{days[i].d}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{days[i].n}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: 0.3 }}>{sv.label.toUpperCase()}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, padding: '26px 28px', minWidth: 0, overflowY: 'auto' }}>
      <Topbar
        eyebrow="Tukar shift · langkah 2 dari 2"
        accent="Konfirmasi"
        title="dampak tukar"
        right={
          <>
            <TBtn variant="secondary" size="sm" onClick={() => setActiveTab('swap')}>‹ Ubah pilihan</TBtn>
            <TBtn variant="primary" size="sm">Kirim ke Andi →</TBtn>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TCard pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <MonoLabel>Sebelum</MonoLabel>
              <span style={{ fontSize: 11, color: T.muted }}>20 – 26 Mei 2026</span>
            </div>
            <Strip codes={before} />
          </TCard>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: T.hairline }} />
            <div style={{ padding: '6px 14px', borderRadius: 999, background: T.accentSoft, color: T.accentInk, fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>
              ⇣ TUKAR DENGAN ANDI PRATAMA ⇣
            </div>
            <div style={{ flex: 1, height: 1, background: T.hairline }} />
          </div>

          <TCard pad={20} style={{ border: `1.5px solid ${T.accentSoft}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <MonoLabel color={T.accentInk}>Setelah tukar</MonoLabel>
              <span style={{ fontSize: 11, color: T.muted }}>Berlaku setelah Andi setuju</span>
            </div>
            <Strip codes={after} />
          </TCard>

          <TCard pad={18}>
            <MonoLabel>Pesan untuk Andi (opsional)</MonoLabel>
            <div style={{ marginTop: 10, background: T.bgWarm, borderRadius: 12, padding: '12px 14px', minHeight: 60, fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>
              Halo Andi, aku perlu pulang lebih awal Rabu untuk urusan keluarga. Terima kasih banyak ya!
            </div>
          </TCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TCard pad={16}>
            <MonoLabel>Validasi otomatis</MonoLabel>
            <div style={{ marginTop: 12 }}>
              {[
                { ok: true,  t: 'Jeda istirahat ≥ 10 jam · terpenuhi' },
                { ok: true,  t: 'Total jam minggu ini tidak berubah' },
                { ok: true,  t: 'Tidak bentrok dengan cuti' },
                { ok: true,  t: 'Andi tidak punya shift di hari yang sama' },
                { ok: false, t: 'Andi belum konfirmasi · menunggu jawaban' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    background: c.ok ? SV.S.bg : SV.P.bg, color: c.ok ? SV.S.ink : SV.P.ink,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{c.ok ? '✓' : '○'}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.4 }}>{c.t}</div>
                </div>
              ))}
            </div>
          </TCard>

          <TCard pad={16}>
            <MonoLabel>Tukar dengan</MonoLabel>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <TAvatar name="Andi Pratama" size={44} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Andi Pratama</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>Perawat Umum · 5 tahun</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: T.bgWarm, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Skor kecocokan</span>
              <span style={{ padding: '2px 10px', borderRadius: 7, background: SV.S.bg, color: SV.S.ink, fontSize: 13, fontWeight: 700 }}>95%</span>
            </div>
          </TCard>

          <div style={{ padding: '12px 14px', background: T.accentSoft, borderRadius: 12, display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 14, color: T.accentInk }}>ⓘ</span>
            <div style={{ fontSize: 12, color: T.accentInk, lineHeight: 1.5 }}>
              Setelah Andi setuju, <b>kepala perawat</b> menerima notifikasi persetujuan akhir.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN D6: Statistik ─────────────────────────────────────────
function ScreenStat({ data, year, month }: {
  data: Record<number, DayEntry>; year: number; month: number
}) {
  const stats = computeStats(data)
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)

  // Group by week
  const weekBars = useMemo(() => {
    const bars: { wk: string; counts: Record<string, number> }[] = []
    let wkNum = 1; let wkData: Record<string, number> = {}
    days.forEach((d, i) => {
      const dayOfW = new Date(year, month, d).getDay()
      const e = data[d]
      if (e?.shift) wkData[e.shift] = (wkData[e.shift] || 0) + 1
      if (dayOfW === 6 || i === days.length - 1) {
        bars.push({ wk: `Mg ${wkNum++}`, counts: { ...wkData } }); wkData = {}
      }
    })
    return bars
  }, [data, year, month, days])

  const maxBars = Math.max(...weekBars.map(w => Object.values(w.counts).reduce((a, b) => a + b, 0)), 1)
  const totalDays = days.length
  const compKeys = ['P', 'S', 'M', 'Libur', 'Cuti'] as const

  return (
    <div style={{ flex: 1, padding: '26px 28px', minWidth: 0, overflowY: 'auto' }}>
      <Topbar
        eyebrow="Statistik kerja"
        accent={BULAN[month]}
        title={String(year)}
        right={
          <>
            <div style={{ display: 'flex', background: '#fff', borderRadius: 17, border: `1px solid ${T.hairline}`, padding: 3 }}>
              {['Minggu', 'Bulan', 'Tahun'].map((v, i) => (
                <div key={v} style={{
                  padding: '5px 13px', borderRadius: 13, fontSize: 12, fontWeight: 600,
                  background: i === 1 ? T.bgWarm : 'transparent',
                  color: i === 1 ? T.ink : T.muted, cursor: 'pointer',
                }}>{v}</div>
              ))}
            </div>
            <TBtn variant="secondary" size="sm">Ekspor</TBtn>
          </>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { lbl: 'Total shift',  val: String(stats.shiftCount), sub: 'shift terhitung' },
          { lbl: 'Total infus',  val: String(stats.totalInfus), sub: 'pasien infus' },
          { lbl: 'Total RNP',    val: String(stats.totalRnp),   sub: `billable: ${stats.rnpBillable}` },
          { lbl: 'Estimasi fee', val: formatRp(stats.totalFee), sub: 'sebelum potongan' },
        ].map(st => (
          <TCard key={st.lbl} pad={18}>
            <MonoLabel>{st.lbl}</MonoLabel>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: -0.4, color: T.ink }}>{st.val}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{st.sub}</div>
          </TCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Weekly bar chart */}
        <TCard pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <MonoLabel>Shift per minggu</MonoLabel>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3, color: T.ink }}>{BULAN[month]} {year}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: T.muted }}>
              {(['P', 'S', 'M'] as const).map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: SV[k].bg }} />
                  {SV[k].label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, paddingLeft: 28, position: 'relative' }}>
            {[0, Math.ceil(maxBars / 2), maxBars].map(y => (
              <div key={y} style={{
                position: 'absolute', left: 0, right: 0,
                bottom: maxBars > 0 ? `${(y / maxBars) * 180}px` : 0,
                borderTop: `1px dashed ${T.hairlineSoft}`,
                fontSize: 9.5, color: T.mutedSoft, fontFamily: 'monospace',
              }}>
                <span style={{ position: 'absolute', left: 0, bottom: 2, background: '#fff', paddingRight: 4 }}>{y}</span>
              </div>
            ))}
            {weekBars.map((w, i) => {
              const total = Object.values(w.counts).reduce((a, b) => a + b, 0)
              return (
                <div key={w.wk} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', maxWidth: 48, display: 'flex', flexDirection: 'column-reverse', height: 180 }}>
                    {(['P', 'S', 'M', 'Libur', 'Cuti'] as const).map(k => {
                      const cnt = w.counts[k] || 0
                      const h = maxBars > 0 ? (cnt / maxBars) * 180 : 0
                      return cnt > 0 ? (
                        <div key={k} style={{ width: '100%', background: SV[k].bg, height: h, minHeight: 3, borderTop: '1px solid #fff' }} />
                      ) : null
                    })}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.muted }}>{w.wk}·{total}</div>
                </div>
              )
            })}
          </div>
        </TCard>

        {/* Shift composition */}
        <TCard pad={20}>
          <MonoLabel>Komposisi shift</MonoLabel>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3, marginBottom: 18, color: T.ink }}>{BULAN[month]} {year}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {compKeys.map(k => {
              const count = stats.byShift[k] || 0
              const pct = totalDays > 0 ? (count / totalDays) * 100 : 0
              return (
                <div key={k}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: SV[k].dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: T.inkSoft }}>{SV[k].label}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{count} hari</div>
                  </div>
                  <div style={{ height: 5, background: T.hairlineSoft, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: SV[k].dot, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
          {stats.totalFee > 0 && (
            <div style={{ marginTop: 18, padding: '12px 14px', background: T.accentSoft, borderRadius: 12 }}>
              <MonoLabel color={T.accentInk}>Estimasi total fee</MonoLabel>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.accentInk, marginTop: 4 }}>{formatRp(stats.totalFee)}</div>
              <div style={{ fontSize: 11, color: T.accentInk, opacity: 0.7, marginTop: 2 }}>
                {stats.shiftCount} shift × Rp{(FEE_PER_SHIFT / 1000).toFixed(0)}rb + infus + RNP
              </div>
            </div>
          )}
        </TCard>
      </div>

      {/* Health row */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { t: 'Shift bulan ini',  v: String(stats.shiftCount), sub: 'dari total hari kerja' },
          { t: 'Infus dilayani',   v: String(stats.totalInfus), sub: 'pasien infus tercatat' },
          { t: 'RNP billable',     v: String(stats.rnpBillable), sub: `mulai pasien ke-${RNP_THRESHOLD + 1}` },
        ].map((c, i) => (
          <TCard key={i} pad={14}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.3 }}>{c.t}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: T.inkSoft }}>{c.v}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.sub}</div>
          </TCard>
        ))}
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────
function InnerSidebar({ active, setActive, userName, userSubtitle }: {
  active: TabId; setActive: (t: TabId) => void; userName: string; userSubtitle: string
}) {
  const nav: { id: TabId; g: string; l: string; badge?: number }[] = [
    { id: 'home',    g: '⌂',  l: 'Beranda' },
    { id: 'cal',     g: '▦',  l: 'Jadwal' },
    { id: 'shift',   g: '◐',  l: 'Shift hari ini' },
    { id: 'swap',    g: '⇄',  l: 'Tukar shift', badge: 2 },
    { id: 'stat',    g: '◔',  l: 'Statistik' },
  ]

  return (
    <div style={{
      width: 220, background: T.bgWarm, borderRight: `1px solid ${T.hairline}`,
      padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 2,
      flexShrink: 0, height: '100%', boxSizing: 'border-box' as const, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: T.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontStyle: 'italic', fontWeight: 700, fontSize: 15, flexShrink: 0,
        }}>s</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, letterSpacing: -0.2 }}>Shift</div>
          <div style={{ fontSize: 10, color: T.muted }}>Jadwal Perawat</div>
        </div>
      </div>

      {nav.map(n => {
        const on = n.id === active || (n.id === 'swap' && active === 'confirm')
        return (
          <button key={n.id} onClick={() => setActive(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, width: '100%', textAlign: 'left' as const,
            background: on ? '#fff' : 'transparent',
            color: on ? T.ink : T.muted,
            fontSize: 13.5, fontWeight: on ? 600 : 500,
            border: on ? `1px solid ${T.hairlineSoft}` : '1px solid transparent',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: 14, opacity: on ? 0.95 : 0.7, width: 16, textAlign: 'center' as const }}>{n.g}</span>
            <span style={{ flex: 1 }}>{n.l}</span>
            {n.badge != null && (
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accentInk, background: T.accentSoft, padding: '2px 7px', borderRadius: 8 }}>{n.badge}</span>
            )}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* User card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 10,
        borderRadius: 12, background: '#fff', border: `1px solid ${T.hairlineSoft}`, marginTop: 8,
      }}>
        <TAvatar name={userName} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{userName}</div>
          <div style={{ fontSize: 10, color: T.muted }}>{userSubtitle}</div>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────
export default function JadwalPerawatPage() {
  const now = new Date()
  const { user } = useAuth()

  const isPerawat  = user?.role === 'perawat'
  const canSeeRekap = user ? REKAP_ROLES.includes(user.role) : false

  const selfNurse: Nurse | null = isPerawat && user ? { id: `user_${user.id}`, name: user.name } : null

  const [activeTab,  setActiveTab]  = useState<TabId>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [data,       setData]       = useState<Record<number, DayEntry>>({})

  const { data: perawatUsers = [], isLoading: isFetchingPerawat } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['users', 'perawat-list'],
    queryFn: async () => {
      const res = await api.get('/users?role=perawat&per_page=100')
      return (res.data.data ?? []) as { id: number; name: string }[]
    },
    enabled: !isPerawat,
    staleTime: 60_000,
  })

  const adminNurses: Nurse[] = useMemo(
    () => perawatUsers.map(u => ({ id: `user_${u.id}`, name: u.name })),
    [perawatUsers]
  )

  useEffect(() => {
    if (!isPerawat && !selectedId && adminNurses.length > 0) setSelectedId(adminNurses[0].id)
  }, [adminNurses, isPerawat, selectedId])

  const activeNurseId = isPerawat ? selfNurse?.id ?? null : selectedId
  const activeNurse   = isPerawat ? selfNurse : adminNurses.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    if (activeNurseId) setData(loadSched(activeNurseId, year, month))
    else setData({})
  }, [activeNurseId, year, month])

  function handleSave(day: number, entry: DayEntry) {
    if (!activeNurseId) return
    const updated = { ...data, [day]: entry }
    setData(updated); saveSched(activeNurseId, year, month, updated)
  }

  const userName    = user?.name ?? 'Perawat'
  const userSubtitle = isPerawat ? 'Perawat' : (user?.role?.replace('_', ' ') ?? 'Admin')

  return (
    <div
      className="-m-4 md:-m-6"
      style={{
        display: 'flex', height: '100%', overflow: 'hidden',
        fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif)",
        background: T.bg, color: T.ink, WebkitFontSmoothing: 'antialiased',
      }}
    >
      <InnerSidebar
        active={activeTab} setActive={setActiveTab}
        userName={userName} userSubtitle={userSubtitle}
      />

      <div style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        {activeTab === 'home' && (
          <ScreenHome data={data} year={year} month={month} activeNurse={activeNurse} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'cal' && (
          <ScreenCal
            data={data} year={year} month={month} setYear={setYear} setMonth={setMonth}
            onSave={handleSave} activeNurse={activeNurse} adminNurses={adminNurses}
            selectedId={selectedId} setSelectedId={setSelectedId}
            isPerawat={isPerawat} isFetchingPerawat={isFetchingPerawat}
          />
        )}
        {activeTab === 'shift'   && <ScreenShift   data={data} year={year} month={month} setActiveTab={setActiveTab} />}
        {activeTab === 'swap'    && <ScreenSwap    setActiveTab={setActiveTab} />}
        {activeTab === 'confirm' && <ScreenConfirm setActiveTab={setActiveTab} />}
        {activeTab === 'stat'    && <ScreenStat    data={data} year={year} month={month} />}
      </div>
    </div>
  )
}
