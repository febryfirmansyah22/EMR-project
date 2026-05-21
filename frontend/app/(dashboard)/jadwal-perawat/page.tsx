'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

/* ── Types ── */
type ShiftCode = 'P' | 'S' | 'M' | 'SM' | 'PM' | 'PS' | 'Libur' | 'Cuti' | ''

interface DayEntry { shift: ShiftCode; infus: number; rnp: number; keterangan: string }
interface Nurse    { id: string; name: string }

/* ── Constants ── */
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

const REAL_SHIFTS = new Set(['P','S','M','SM','PM','PS'])

const HARI       = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const NAVY       = '#0F2540'

const FEE_PER_SHIFT = 50_000
const FEE_PER_INFUS = 5_000
const FEE_PER_RNP   = 5_000
const RNP_THRESHOLD = 3

const REKAP_ROLES       = ['super_admin', 'admin_klinik', 'owner']
const CAN_MANAGE_NURSES = ['super_admin', 'admin_klinik']

/* ── Storage ── */
const NURSE_LIST_KEY = 'perawat_list'

function loadNurses(): Nurse[] {
  if (typeof window === 'undefined') return []
  try { const r = localStorage.getItem(NURSE_LIST_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveNurses(list: Nurse[]) {
  try { localStorage.setItem(NURSE_LIST_KEY, JSON.stringify(list)) } catch {}
}
function schedKey(nurseId: string, y: number, m: number) {
  return `jadwal_${nurseId}_${y}_${String(m + 1).padStart(2, '0')}`
}
function loadSched(nurseId: string, y: number, m: number): Record<number, DayEntry> {
  if (typeof window === 'undefined') return {}
  try { const r = localStorage.getItem(schedKey(nurseId, y, m)); return r ? JSON.parse(r) : {} } catch { return {} }
}
function saveSched(nurseId: string, y: number, m: number, data: Record<number, DayEntry>) {
  try { localStorage.setItem(schedKey(nurseId, y, m), JSON.stringify(data)) } catch {}
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

/* ── Helpers ── */
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function dayOfWeek(y: number, m: number, d: number) { return new Date(y, m, d).getDay() }
function blankEntry(): DayEntry { return { shift: '', infus: 0, rnp: 0, keterangan: '' } }
function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function initials(name: string) { return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() }

function dailyFee(entry: DayEntry): number {
  if (!REAL_SHIFTS.has(entry.shift)) return 0
  return FEE_PER_SHIFT + (entry.infus || 0) * FEE_PER_INFUS
}

function computeStats(data: Record<number, DayEntry>) {
  const entries = Object.values(data)
  const shiftCount  = entries.filter(e => REAL_SHIFTS.has(e.shift)).length
  const totalInfus  = entries.reduce((s, e) => s + (e.infus || 0), 0)
  const totalRnp    = entries.reduce((s, e) => s + (e.rnp   || 0), 0)
  const byShift: Record<string, number> = {}
  entries.forEach(e => { if (e.shift) byShift[e.shift] = (byShift[e.shift] || 0) + 1 })
  const feeShift    = shiftCount * FEE_PER_SHIFT
  const feeInfus    = totalInfus * FEE_PER_INFUS
  const rnpBillable = Math.max(0, totalRnp - RNP_THRESHOLD)
  const feeRnp      = rnpBillable * FEE_PER_RNP
  const totalFee    = feeShift + feeInfus + feeRnp
  return { shiftCount, totalInfus, totalRnp, byShift, feeShift, feeInfus, feeRnp, rnpBillable, totalFee }
}

/* ── Icon ── */
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>
}

/* ── DayCard (module-level) ── */
function DayCard({ day, year, month, entry, onSave }: {
  day: number; year: number; month: number; entry: DayEntry
  onSave: (day: number, entry: DayEntry) => void
}) {
  const [form, setForm]   = useState<DayEntry>(entry)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { setForm(entry); setDirty(false) }, [entry])

  function set<K extends keyof DayEntry>(key: K, val: DayEntry[K]) {
    setForm(f => ({ ...f, [key]: val })); setDirty(true)
  }
  function handleSave()  { onSave(day, form); setDirty(false); toast.success(`Tgl ${day} ${BULAN_NAMA[month]} tersimpan`) }
  function handleReset() { setForm(entry); setDirty(false) }

  const dow       = dayOfWeek(year, month, day)
  const badge     = form.shift ? SHIFT_BADGE[form.shift] : null
  const isWeekend = dow === 0 || dow === 6
  const today     = new Date()
  const isToday   = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  const fee       = dailyFee(form)

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${isToday ? 'border-[#0052CC]' : 'border-[#E2E8F0]'}`}>
      {/* Day header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0] ${isWeekend ? 'bg-[#FFF7ED]' : 'bg-[#F8FAFC]'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-[15px]
            ${isToday ? 'bg-[#0052CC] text-white' : isWeekend ? 'bg-[#FED7AA] text-[#9A3412]' : 'bg-[#E2E8F0] text-[#374151]'}`}>
            {day}
          </div>
          <div>
            <p className={`text-[13px] font-semibold ${isWeekend ? 'text-[#9A3412]' : 'text-[#0F2540]'}`}>{HARI[dow]}</p>
            {isToday && <p className="text-[10px] font-semibold text-[#0052CC] uppercase tracking-wide">Hari ini</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
          )}
          {fee > 0 && (
            <span className="text-[12px] font-bold text-[#059669]">{formatRp(fee)}</span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Shift</label>
            <select value={form.shift} onChange={e => set('shift', e.target.value as ShiftCode)}
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-2 text-[12px] font-semibold text-[#0F2540] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30">
              {SHIFT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Infus</label>
            <input type="number" min={0} value={form.infus || ''} placeholder="0"
              onChange={e => set('infus', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[13px] font-semibold text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">RNP</label>
            <input type="number" min={0} value={form.rnp || ''} placeholder="0"
              onChange={e => set('rnp', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[13px] font-semibold text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30" />
          </div>
        </div>
        <input type="text" value={form.keterangan} onChange={e => set('keterangan', e.target.value)}
          placeholder="Keterangan / nama pasien"
          className="w-full h-9 rounded-lg border border-[#c3c6d6] bg-white px-3 text-[12px] text-[#0F2540] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30" />
        <div className="flex gap-2 pt-0.5">
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: dirty ? '#0052CC' : NAVY }}>
            <Icon name="check" className="text-[16px]" /> Simpan
          </button>
          <button onClick={handleReset} disabled={!dirty}
            className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors">
            <Icon name="undo" className="text-[14px]" /> Ubah
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
type TabKey = 'beranda' | 'jadwal' | 'rekap'

export default function JadwalPerawatPage() {
  const now = new Date()
  const { user } = useAuth()

  const isPerawat       = user?.role === 'perawat'
  const canSeeRekap     = user ? REKAP_ROLES.includes(user.role) : false
  const canManageNurses = user ? CAN_MANAGE_NURSES.includes(user.role) : false

  /* ── Nurse: perawat pakai akun mereka sendiri, admin pakai daftar manual ── */
  const selfNurse: Nurse | null = isPerawat && user
    ? { id: `user_${user.id}`, name: user.name }
    : null

  const [nurses, setNurses]         = useState<Nurse[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [year,  setYear]            = useState(now.getFullYear())
  const [month, setMonth]           = useState(now.getMonth())
  const [data,  setData]            = useState<Record<number, DayEntry>>({})
  const [tab,   setTab]             = useState<TabKey>('jadwal')
  const [addingNurse, setAddingNurse] = useState(false)
  const [newName, setNewName]         = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)

  // Nurse yang aktif
  const activeNurseId = isPerawat ? (selfNurse?.id ?? null) : selectedId
  const activeNurse   = isPerawat ? selfNurse : (nurses.find(n => n.id === selectedId) ?? null)

  useEffect(() => { if (tab === 'rekap' && !canSeeRekap) setTab('jadwal') }, [canSeeRekap, tab])

  // Load daftar perawat (untuk admin)
  useEffect(() => {
    if (isPerawat) return
    const list = loadNurses()
    setNurses(list)
    if (list.length > 0) setSelectedId(list[0].id)
  }, [isPerawat])

  useEffect(() => {
    if (addingNurse) setTimeout(() => addInputRef.current?.focus(), 50)
  }, [addingNurse])

  // Load jadwal saat nurse/bulan berubah
  useEffect(() => {
    if (activeNurseId) setData(loadSched(activeNurseId, year, month))
    else setData({})
  }, [activeNurseId, year, month])

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0) } else setMonth(m => m+1) }

  function handleSave(day: number, entry: DayEntry) {
    if (!activeNurseId) return
    const updated = { ...data, [day]: entry }
    setData(updated); saveSched(activeNurseId, year, month, updated)
  }

  function handleAddNurse() {
    const name = newName.trim()
    if (!name) return
    const nurse: Nurse = { id: genId(), name }
    const updated = [...nurses, nurse]
    setNurses(updated); saveNurses(updated)
    setSelectedId(nurse.id)
    setNewName(''); setAddingNurse(false)
    toast.success(`Perawat ${name} ditambahkan`)
  }

  function handleDeleteNurse(id: string) {
    const nurse = nurses.find(n => n.id === id)
    if (!nurse) return
    if (!confirm(`Hapus "${nurse.name}" dari daftar?`)) return
    const updated = nurses.filter(n => n.id !== id)
    setNurses(updated); saveNurses(updated)
    if (selectedId === id) setSelectedId(updated[0]?.id ?? null)
    toast.success(`${nurse.name} dihapus`)
  }

  const days  = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)
  const stats = useMemo(() => computeStats(data), [data])

  const allNursesStats = useMemo(() => {
    if (!canSeeRekap) return []
    return nurses.map(n => ({ nurse: n, s: computeStats(loadSched(n.id, year, month)) }))
  }, [nurses, year, month, canSeeRekap])

  /* ── Empty state: hanya untuk admin yang belum tambah perawat ── */
  if (!isPerawat && nurses.length === 0) return (
    <div className="flex flex-col h-full -m-4 md:-m-6 bg-[#F8FAFC]" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      <div className="shrink-0 px-4 pt-4 pb-4 text-white" style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Icon name="calendar_month" className="icon-fill text-[22px] text-[#67E8F9]" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold">Jadwal Perawat</h1>
            <p className="text-[11px] text-white/60">Elzahrawi Medika Cihaurbeuti</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#E2E8F0] mb-4">
          <Icon name="people" className="icon-fill text-[32px] text-[#94A3B8]" />
        </div>
        <p className="text-[16px] font-bold text-[#0F2540]">Belum ada data perawat</p>
        <p className="mt-1 text-[13px] text-[#94A3B8]">
          {canManageNurses ? 'Tambahkan perawat untuk mulai mencatat jadwal.' : 'Hubungi admin untuk menambahkan data perawat.'}
        </p>
        {canManageNurses && !addingNurse && (
          <button onClick={() => setAddingNurse(true)}
            className="mt-5 flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
            <Icon name="person_add" className="text-[18px]" /> Tambah Perawat
          </button>
        )}
        {addingNurse && (
          <div className="mt-4 flex items-center gap-2">
            <input ref={addInputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNurse(); if (e.key === 'Escape') { setAddingNurse(false); setNewName('') } }}
              placeholder="Nama perawat..." className="h-10 rounded-xl border border-[#c3c6d6] bg-white px-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 w-48" />
            <button onClick={handleAddNurse} className="h-10 px-4 rounded-xl bg-[#0052CC] text-white text-[13px] font-semibold">Simpan</button>
            <button onClick={() => { setAddingNurse(false); setNewName('') }} className="h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] text-[#94A3B8]">Batal</button>
          </div>
        )}
      </div>
    </div>
  )

  /* ── MAIN RENDER ── */
  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 bg-[#F8FAFC]" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>

      {/* ── Navy header ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 text-white" style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Icon name="calendar_month" className="icon-fill text-[22px] text-[#67E8F9]" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold leading-tight">Jadwal Perawat</h1>
              {/* Perawat: tampilkan nama mereka. Admin: tampilkan klinik */}
              {isPerawat
                ? <p className="text-[12px] text-white/70 font-medium">{user?.name}</p>
                : <p className="text-[11px] text-white/60">Elzahrawi Medika Cihaurbeuti</p>
              }
            </div>
          </div>
          {/* Tombol tambah hanya untuk admin */}
          {canManageNurses && (
            <button onClick={() => setAddingNurse(a => !a)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-[12px] font-semibold ring-1 ring-white/20 transition-colors">
              <Icon name="person_add" className="text-[15px]" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </div>

        {/* Nurse chips — hanya untuk admin/owner, bukan perawat */}
        {!isPerawat && nurses.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {nurses.map(n => {
              const isSel = n.id === selectedId
              return (
                <div key={n.id} className="shrink-0 flex items-center gap-0.5">
                  <button onClick={() => setSelectedId(n.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      isSel ? 'bg-white text-[#0F2540] shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}>
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isSel ? 'bg-[#0052CC] text-white' : 'bg-white/20 text-white'}`}>
                      {initials(n.name)}
                    </span>
                    {n.name}
                  </button>
                  {isSel && canManageNurses && (
                    <button onClick={() => handleDeleteNurse(n.id)} title="Hapus perawat"
                      className="flex size-5 items-center justify-center rounded-full bg-white/15 hover:bg-red-400/80 transition-colors">
                      <Icon name="close" className="text-[11px] text-white" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add nurse form */}
        {addingNurse && (
          <div className="mt-2.5 flex items-center gap-2">
            <input ref={addInputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNurse(); if (e.key === 'Escape') { setAddingNurse(false); setNewName('') } }}
              placeholder="Nama perawat baru..."
              className="flex-1 h-9 rounded-lg border border-white/30 bg-white/10 px-3 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={handleAddNurse} className="h-9 px-3 rounded-lg bg-white text-[#0F2540] text-[12px] font-semibold">Simpan</button>
            <button onClick={() => { setAddingNurse(false); setNewName('') }} className="h-9 px-2 rounded-lg bg-white/10 text-white/70 text-[12px]">Batal</button>
          </div>
        )}

        {/* Month navigator (jadwal tab) */}
        {tab === 'jadwal' && (
          <div className="mt-3 flex items-center justify-between">
            <button onClick={prevMonth} className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Icon name="chevron_left" className="text-[20px]" />
            </button>
            <p className="text-[15px] font-semibold">{BULAN_NAMA[month]} {year}</p>
            <button onClick={nextMonth} className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Icon name="chevron_right" className="text-[20px]" />
            </button>
          </div>
        )}

        {/* Stats bar — admin/owner only */}
        {canSeeRekap && (
          <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-white/10">
            {[
              { label: 'Shift', value: stats.shiftCount },
              { label: 'Infus', value: stats.totalInfus },
              { label: 'RNP',   value: stats.totalRnp   },
            ].map(s => (
              <div key={s.label} className="px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold leading-tight">{s.value}</p>
                <p className="text-[10px] text-white/60 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Fee mini-bar untuk perawat */}
        {isPerawat && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="payments" className="icon-fill text-[15px] text-[#67E8F9]" />
              <p className="text-[11px] text-white/70">Estimasi fee bulan ini</p>
            </div>
            <p className="text-[14px] font-bold text-white">{formatRp(stats.totalFee)}</p>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* BERANDA */}
        {tab === 'beranda' && (
          <div className="p-4 space-y-4">
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
              <div className="px-5 py-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Hari Ini</p>
                <p className="mt-1 text-[20px] font-bold">{HARI[now.getDay()]}, {now.getDate()} {BULAN_NAMA[now.getMonth()]} {now.getFullYear()}</p>
                {activeNurse && <p className="mt-0.5 text-[12px] text-white/60">{activeNurse.name}</p>}
                {data[now.getDate()]?.shift ? (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {(() => { const b = SHIFT_BADGE[data[now.getDate()].shift!]; return b ? (
                      <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ backgroundColor: b.bg, color: b.text }}>Shift {data[now.getDate()].shift}</span>
                    ) : null })()}
                    {(data[now.getDate()]?.infus ?? 0) > 0 && <span className="rounded-full bg-white/20 px-3 py-1 text-[12px]">{data[now.getDate()].infus} Infus</span>}
                    {(data[now.getDate()]?.rnp   ?? 0) > 0 && <span className="rounded-full bg-white/20 px-3 py-1 text-[12px]">{data[now.getDate()].rnp} RNP</span>}
                    {dailyFee(data[now.getDate()]) > 0 && (
                      <span className="rounded-full bg-[#D1FAE5] px-3 py-1 text-[12px] font-bold text-[#065F46]">{formatRp(dailyFee(data[now.getDate()]))}</span>
                    )}
                  </div>
                ) : <p className="mt-2 text-[13px] text-white/50">Belum ada jadwal hari ini</p>}
              </div>
            </div>

            {/* Ringkasan bulan */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <p className="text-[12px] font-bold text-[#0F2540]">Ringkasan {BULAN_NAMA[month]} {year}{activeNurse ? ` · ${activeNurse.name}` : ''}</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
                {[{ label: 'Shift', v: stats.shiftCount }, { label: 'Infus', v: stats.totalInfus }, { label: 'RNP', v: stats.totalRnp }].map(s => (
                  <div key={s.label} className="px-4 py-3 text-center">
                    <p className="text-[22px] font-bold text-[#0F2540]">{s.v}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-[#F1F5F9] text-center">
                <p className="text-[12px] text-[#94A3B8]">Estimasi Fee · <span className="font-bold text-[#0052CC]">{formatRp(stats.totalFee)}</span></p>
              </div>
            </div>

            {/* 7 hari ke depan */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <Icon name="upcoming" className="icon-fill text-[16px] text-[#3B82F6]" />
                <h3 className="text-[13px] font-bold text-[#0F2540]">7 Hari ke Depan</h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(now); d.setDate(now.getDate() + i)
                  const dd = d.getDate(), mm = d.getMonth(), yy = d.getFullYear()
                  const e = (yy === year && mm === month) ? data[dd] : (activeNurseId ? loadSched(activeNurseId, yy, mm)[dd] : undefined)
                  const badge = e?.shift ? SHIFT_BADGE[e.shift] : null
                  return (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i === 0 ? 'bg-[#EFF6FF]' : ''}`}>
                      <div>
                        <p className="text-[12px] font-semibold text-[#0F2540]">{HARI[d.getDay()]}, {dd} {BULAN_NAMA[mm]}</p>
                        {e?.keterangan && <p className="text-[11px] text-[#64748B] truncate max-w-[200px]">{e.keterangan}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {e && dailyFee(e) > 0 && <span className="text-[11px] font-semibold text-[#059669]">{formatRp(dailyFee(e))}</span>}
                        {badge ? <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                               : <span className="text-[11px] text-[#CBD5E1]">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* JADWAL */}
        {tab === 'jadwal' && (
          <div className="p-3 space-y-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] px-1">
              <Icon name="edit" className="text-[13px]" /> Isi data shift lalu tap Simpan
            </p>
            {days.map(d => (
              <DayCard key={d} day={d} year={year} month={month} entry={data[d] ?? blankEntry()} onSave={handleSave} />
            ))}
          </div>
        )}

        {/* REKAP — hanya admin/owner */}
        {tab === 'rekap' && (
          <div className="space-y-4 p-4">

            {activeNurse && (
              <div className="flex items-center gap-3 rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 shadow-sm">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full font-bold text-white text-[14px]"
                     style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
                  {initials(activeNurse.name)}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#0F2540]">{activeNurse.name}</p>
                  <p className="text-[11px] text-[#94A3B8]">Perawat · {BULAN_NAMA[month]} {year}</p>
                </div>
              </div>
            )}

            {/* Fee breakdown */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-[#E2E8F0]">
              <div className="flex items-center justify-between px-4 py-3" style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
                <div className="flex items-center gap-2">
                  <Icon name="payments" className="icon-fill text-[18px] text-[#67E8F9]" />
                  <h3 className="text-[13px] font-bold text-white">Fee Kerja Perawat</h3>
                </div>
                <span className="text-[11px] text-white/60">{BULAN_NAMA[month]} {year}</span>
              </div>
              <div className="bg-white divide-y divide-[#F1F5F9]">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
                      <Icon name="calendar_today" className="icon-fill text-[16px] text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0F2540]">Fee Shift</p>
                      <p className="text-[11px] text-[#94A3B8]">{stats.shiftCount} shift × {formatRp(FEE_PER_SHIFT)}</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-[#0F2540]">{formatRp(stats.feeShift)}</p>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#F0FDF4]">
                      <Icon name="vaccines" className="icon-fill text-[16px] text-[#059669]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0F2540]">Fee Infus</p>
                      <p className="text-[11px] text-[#94A3B8]">{stats.totalInfus} infus × {formatRp(FEE_PER_INFUS)}</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-[#0F2540]">{formatRp(stats.feeInfus)}</p>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF]">
                      <Icon name="bed" className="icon-fill text-[16px] text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0F2540]">Fee Rawat Inap</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {stats.totalRnp} pasien
                        {stats.totalRnp <= RNP_THRESHOLD
                          ? ` (belum melewati batas ${RNP_THRESHOLD})`
                          : ` − ${RNP_THRESHOLD} gratis = ${stats.rnpBillable} × ${formatRp(FEE_PER_RNP)}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold text-[#0F2540]">{formatRp(stats.feeRnp)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5 bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Icon name="account_balance_wallet" className="icon-fill text-[18px] text-[#0052CC]" />
                  <p className="text-[14px] font-bold text-[#0F2540]">Total Fee</p>
                </div>
                <p className="text-[20px] font-bold text-[#0052CC]">{formatRp(stats.totalFee)}</p>
              </div>
            </div>

            {/* Shift breakdown */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <Icon name="donut_small" className="icon-fill text-[16px] text-[#3B82F6]" />
                <h3 className="text-[13px] font-bold text-[#0F2540]">Rekap Shift {BULAN_NAMA[month]}</h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {SHIFT_OPTIONS.filter(o => o.value !== '').map(o => {
                  const count = stats.byShift[o.value] || 0
                  const badge = SHIFT_BADGE[o.value]
                  return (
                    <div key={o.value} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-7 items-center justify-center rounded-full text-[11px] font-bold"
                              style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                        <span className="text-[13px] text-[#334155]">{o.label}</span>
                      </div>
                      <span className="text-[15px] font-bold text-[#0F2540]">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Catatan pasien */}
            {Object.values(data).some(e => e.keterangan) && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                  <Icon name="notes" className="icon-fill text-[16px] text-[#3B82F6]" />
                  <h3 className="text-[13px] font-bold text-[#0F2540]">Catatan Pasien</h3>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {days.filter(d => data[d]?.keterangan).map(d => {
                    const e = data[d]; const badge = e.shift ? SHIFT_BADGE[e.shift] : null
                    return (
                      <div key={d} className="flex items-start gap-3 px-4 py-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[12px] font-bold text-[#374151]">{d}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[#94A3B8]">{HARI[dayOfWeek(year, month, d)]}, {d} {BULAN_NAMA[month]}</p>
                          <p className="text-[13px] text-[#0F2540] truncate">{e.keterangan}</p>
                        </div>
                        {badge && <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                                        style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Semua perawat (admin multi-nurse) */}
            {canSeeRekap && allNursesStats.length > 1 && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                  <Icon name="group" className="icon-fill text-[16px] text-[#3B82F6]" />
                  <h3 className="text-[13px] font-bold text-[#0F2540]">Semua Perawat · {BULAN_NAMA[month]} {year}</h3>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {allNursesStats.map(({ nurse, s }) => (
                    <button key={nurse.id} onClick={() => setSelectedId(nurse.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors text-left ${nurse.id === selectedId ? 'bg-[#EFF6FF]' : ''}`}>
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-white text-[12px]"
                           style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1E3A5F 100%)` }}>
                        {initials(nurse.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0F2540] truncate">{nurse.name}</p>
                        <p className="text-[11px] text-[#94A3B8]">{s.shiftCount} shift · {s.totalInfus} infus · {s.totalRnp} RNP</p>
                      </div>
                      <p className="text-[13px] font-bold text-[#0052CC] shrink-0">{formatRp(s.totalFee)}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                  <p className="text-[12px] font-bold text-[#0F2540]">Total Semua Perawat</p>
                  <p className="text-[14px] font-bold text-[#0052CC]">{formatRp(allNursesStats.reduce((s, n) => s + n.s.totalFee, 0))}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-[#E2E8F0] bg-white">
        <div className={`grid ${canSeeRekap ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {([
            { key: 'beranda' as TabKey, label: 'Beranda', icon: 'home',           show: true },
            { key: 'jadwal'  as TabKey, label: 'Jadwal',  icon: 'calendar_month', show: true },
            { key: 'rekap'   as TabKey, label: 'Rekap',   icon: 'bar_chart',      show: canSeeRekap },
          ] satisfies { key: TabKey; label: string; icon: string; show: boolean }[]).filter(t => t.show).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition-colors ${tab === t.key ? 'text-[#0052CC]' : 'text-[#94A3B8]'}`}>
              <Icon name={t.icon} className={`text-[22px] ${tab === t.key ? 'icon-fill' : ''}`} />
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-[#0052CC]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
