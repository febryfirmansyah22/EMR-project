'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
} from 'recharts'

/* ────────────────────────────────────────────────────────────────────────────
   COLOR PALETTE
   ──────────────────────────────────────────────────────────────────────────── */
const NAVY      = '#0F2540'
const NAVY_2    = '#1E3A5F'
const DEEP_BLUE = '#1B3A6E'
const MID_BLUE  = '#3B82F6'
const LITE_BLUE = '#93C5FD'

/* ────────────────────────────────────────────────────────────────────────────
   DATA TYPES
   ──────────────────────────────────────────────────────────────────────────── */
type MonthRow = {
  no: number; bulan: string;
  total_rajal: number; rajal_umum: number; rajal_bpjs: number;
  rujukan: number; persen_rujukan: number | null;
  tindakan: number; obs_umum: number;
  total_ranap: number; ranap_umum: number;
  bpjs_total: number; bpjs_ranap: number; bpjs_obs: number;
  rujukan_ranap: number; rujukan_ranap_bpjs: number; rujukan_ranap_umum: number;
  rujukan_notes: string;
  mati: number; mati_notes: string;
  lab: number; peserta_bpjs: number; total: number;
}

function blankRow(no: number, bulan: string): MonthRow {
  return {
    no, bulan,
    total_rajal: 0, rajal_umum: 0, rajal_bpjs: 0,
    rujukan: 0, persen_rujukan: null,
    tindakan: 0, obs_umum: 0,
    total_ranap: 0, ranap_umum: 0,
    bpjs_total: 0, bpjs_ranap: 0, bpjs_obs: 0,
    rujukan_ranap: 0, rujukan_ranap_bpjs: 0, rujukan_ranap_umum: 0,
    rujukan_notes: '',
    mati: 0, mati_notes: '',
    lab: 0, peserta_bpjs: 0, total: 0,
  }
}

const INITIAL_DATA: MonthRow[] = [
  { no:1,  bulan:'Januari',   total_rajal:479, rajal_umum:360, rajal_bpjs:119, rujukan:13, persen_rujukan:8.6,  tindakan:20, obs_umum:26, total_ranap:82,  ranap_umum:12, bpjs_total:70, bpjs_ranap:54, bpjs_obs:16, rujukan_ranap:2, rujukan_ranap_bpjs:2, rujukan_ranap_umum:0, rujukan_notes:'', mati:0, mati_notes:'', lab:25, peserta_bpjs:518, total:607 },
  { no:2,  bulan:'Februari',  total_rajal:408, rajal_umum:340, rajal_bpjs:68,  rujukan:15, persen_rujukan:11.6, tindakan:9,  obs_umum:41, total_ranap:98,  ranap_umum:20, bpjs_total:78, bpjs_ranap:57, bpjs_obs:21, rujukan_ranap:3, rujukan_ranap_bpjs:3, rujukan_ranap_umum:0, rujukan_notes:'', mati:0, mati_notes:'', lab:15, peserta_bpjs:521, total:556 },
  { no:3,  bulan:'Maret',     total_rajal:565, rajal_umum:467, rajal_bpjs:98,  rujukan:6,  persen_rujukan:6.1,  tindakan:21, obs_umum:43, total_ranap:99,  ranap_umum:8,  bpjs_total:91, bpjs_ranap:60, bpjs_obs:31, rujukan_ranap:2, rujukan_ranap_bpjs:2, rujukan_ranap_umum:0, rujukan_notes:'', mati:0, mati_notes:'', lab:25, peserta_bpjs:549, total:728 },
  { no:4,  bulan:'April',     total_rajal:579, rajal_umum:456, rajal_bpjs:123, rujukan:10, persen_rujukan:8.1,  tindakan:15, obs_umum:34, total_ranap:110, ranap_umum:27, bpjs_total:83, bpjs_ranap:67, bpjs_obs:16, rujukan_ranap:5, rujukan_ranap_bpjs:5, rujukan_ranap_umum:0, rujukan_notes:'', mati:0, mati_notes:'', lab:21, peserta_bpjs:549, total:738 },
  blankRow(5,  'Mei'),
  blankRow(6,  'Juni'),
  blankRow(7,  'Juli'),
  blankRow(8,  'Agustus'),
  blankRow(9,  'September'),
  blankRow(10, 'Oktober'),
  blankRow(11, 'November'),
  blankRow(12, 'Desember'),
]

/* ────────────────────────────────────────────────────────────────────────────
   XLSX PARSER
   ──────────────────────────────────────────────────────────────────────────── */
function normalizeHeader(h: string): string {
  return String(h).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function parseXlsx(workbook: XLSX.WorkBook): MonthRow[] | null {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 })
  if (!rows.length) return null
  const headerMap: Record<string, string> = {}
  Object.keys(rows[0]).forEach(k => { headerMap[normalizeHeader(k)] = k })
  const get = (row: any, ...aliases: string[]) => {
    for (const a of aliases) {
      const orig = headerMap[a]
      if (orig !== undefined && row[orig] !== undefined && row[orig] !== '') return row[orig]
    }
    return 0
  }
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return BULAN.map((bulan, i) => {
    const row = rows.find(r => normalizeHeader(String(get(r, 'bulan', 'month') || '')) === normalizeHeader(bulan)) || rows[i]
    if (!row) return blankRow(i + 1, bulan)
    const toNum = (v: any) => { const n = Number(String(v).replace(/[^0-9.-]/g, '')); return isNaN(n) ? 0 : n }
    const persen = get(row, 'persen_rujukan', 'ruj', 'persen', 'percent_ruj')
    return {
      no: i + 1, bulan,
      total_rajal:         toNum(get(row, 'total_rajal', 'rajal_total')),
      rajal_umum:          toNum(get(row, 'rajal_umum')),
      rajal_bpjs:          toNum(get(row, 'rajal_bpjs')),
      rujukan:             toNum(get(row, 'rujukan', 'bujulkan')),
      persen_rujukan:      persen ? toNum(persen) : null,
      tindakan:            toNum(get(row, 'tindakan')),
      obs_umum:            toNum(get(row, 'obs_umum', 'observasi_umum', 'obs')),
      total_ranap:         toNum(get(row, 'total_ranap', 'ranap_total')),
      ranap_umum:          toNum(get(row, 'ranap_umum')),
      bpjs_total:          toNum(get(row, 'bpjs_total', 'brjs_total')),
      bpjs_ranap:          toNum(get(row, 'bpjs_ranap', 'brjs_ranap')),
      bpjs_obs:            toNum(get(row, 'bpjs_obs', 'brjs_obs')),
      rujukan_ranap:       toNum(get(row, 'jml_ruj_ranap', 'rujukan_ranap')),
      rujukan_ranap_bpjs:  toNum(get(row, 'rujukan_ranap_bpjs', 'ruj_ranap_bpjs')),
      rujukan_ranap_umum:  toNum(get(row, 'rujukan_ranap_umum', 'ruj_ranap_umum')),
      rujukan_notes:       String(get(row, 'rujukan_notes') || ''),
      mati:                toNum(get(row, 'mati')),
      mati_notes:          String(get(row, 'mati_notes') || ''),
      lab:                 toNum(get(row, 'lab')),
      peserta_bpjs:        toNum(get(row, 'peserta_bpjs', 'peserta_brjs')),
      total:               toNum(get(row, 'total')),
    }
  })
}

/* ────────────────────────────────────────────────────────────────────────────
   INPUT MANUAL FORM STATE
   ──────────────────────────────────────────────────────────────────────────── */
type FormState = {
  total_rajal: string; rajal_umum: string; rajal_bpjs: string;
  rujukan: string; tindakan: string; obs_umum: string;
  total_ranap: string; ranap_umum: string;
  bpjs_total: string; bpjs_ranap: string; bpjs_obs: string;
  rujukan_ranap: string; rujukan_ranap_bpjs: string; rujukan_ranap_umum: string;
  rujukan_notes: string;
  mati: string; mati_notes: string;
  lab: string; peserta_bpjs: string;
}

function rowToForm(row: MonthRow): FormState {
  const s = (n: number) => (n === 0 ? '' : String(n))
  return {
    total_rajal: s(row.total_rajal), rajal_umum: s(row.rajal_umum), rajal_bpjs: s(row.rajal_bpjs),
    rujukan: s(row.rujukan), tindakan: s(row.tindakan), obs_umum: s(row.obs_umum),
    total_ranap: s(row.total_ranap), ranap_umum: s(row.ranap_umum),
    bpjs_total: s(row.bpjs_total), bpjs_ranap: s(row.bpjs_ranap), bpjs_obs: s(row.bpjs_obs),
    rujukan_ranap: s(row.rujukan_ranap), rujukan_ranap_bpjs: s(row.rujukan_ranap_bpjs),
    rujukan_ranap_umum: s(row.rujukan_ranap_umum), rujukan_notes: row.rujukan_notes,
    mati: s(row.mati), mati_notes: row.mati_notes,
    lab: s(row.lab), peserta_bpjs: s(row.peserta_bpjs),
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   INPUT MANUAL DIALOG
   ──────────────────────────────────────────────────────────────────────────── */
function InputManualDialog({
  open, monthIdx, monthlyData, onClose, onSave,
}: {
  open: boolean
  monthIdx: number
  monthlyData: MonthRow[]
  onClose: () => void
  onSave: (idx: number, updated: MonthRow) => void
}) {
  const [selIdx, setSelIdx] = useState(monthIdx)
  const [form, setForm] = useState<FormState>(() => rowToForm(monthlyData[monthIdx]))

  useEffect(() => {
    setSelIdx(monthIdx)
    setForm(rowToForm(monthlyData[monthIdx]))
  }, [monthIdx, open])

  function handleMonthChange(idx: number) {
    setSelIdx(idx)
    setForm(rowToForm(monthlyData[idx]))
  }

  function set(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const toN = (v: string) => { const x = parseFloat(String(v).replace(',', '.')); return isNaN(x) ? 0 : x }

  // Auto-calcs (live)
  const rajal_bpjs_n = toN(form.rajal_bpjs)
  const rujukan_n    = toN(form.rujukan)
  const persen_ruj   = rajal_bpjs_n > 0 ? ((rujukan_n / rajal_bpjs_n) * 100).toFixed(1) : null
  const total_kunjungan = toN(form.total_rajal) + toN(form.obs_umum) + toN(form.tindakan) + toN(form.total_ranap)

  function handleSave() {
    const rajal_bpjs  = toN(form.rajal_bpjs)
    const rujukan     = toN(form.rujukan)
    const total_rajal = toN(form.total_rajal)
    const obs_umum    = toN(form.obs_umum)
    const tindakan    = toN(form.tindakan)
    const total_ranap = toN(form.total_ranap)
    const persen_rujukan = rajal_bpjs > 0 ? parseFloat(((rujukan / rajal_bpjs) * 100).toFixed(1)) : null
    const total = total_rajal + obs_umum + tindakan + total_ranap

    const updated: MonthRow = {
      ...monthlyData[selIdx],
      total_rajal, rajal_umum: toN(form.rajal_umum), rajal_bpjs,
      rujukan, persen_rujukan,
      tindakan, obs_umum,
      total_ranap, ranap_umum: toN(form.ranap_umum),
      bpjs_total: toN(form.bpjs_total), bpjs_ranap: toN(form.bpjs_ranap), bpjs_obs: toN(form.bpjs_obs),
      rujukan_ranap: toN(form.rujukan_ranap),
      rujukan_ranap_bpjs: toN(form.rujukan_ranap_bpjs),
      rujukan_ranap_umum: toN(form.rujukan_ranap_umum),
      rujukan_notes: form.rujukan_notes,
      mati: toN(form.mati), mati_notes: form.mati_notes,
      lab: toN(form.lab), peserta_bpjs: toN(form.peserta_bpjs),
      total,
    }
    onSave(selIdx, updated)
    toast.success(`Data ${monthlyData[selIdx].bulan} berhasil disimpan`)
    onClose()
  }

  /* Reusable sub-components scoped to this dialog */
  const NF = ({ label, fkey, help }: { label: string; fkey: keyof FormState; help?: string }) => (
    <div className="space-y-1">
      <Label className="text-[12px] font-semibold text-[#334155]">{label}</Label>
      {help && <p className="text-[10px] text-[#94A3B8]">{help}</p>}
      <Input
        type="number"
        min={0}
        value={(form as any)[fkey]}
        onChange={e => set(fkey, e.target.value)}
        className="h-8 text-[13px]"
        placeholder="0"
      />
    </div>
  )

  const AutoField = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <Label className="text-[12px] font-semibold text-[#334155]">{label}</Label>
      <div className="flex h-8 items-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 text-[13px] font-bold text-[#1D4ED8]">
        {value}
      </div>
    </div>
  )

  const SectionHead = ({ title, icon }: { title: string; icon: string }) => (
    <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1.5">
      <span className="material-symbols-outlined icon-fill text-[15px] text-[#3B82F6]">{icon}</span>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">{title}</h4>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-[#E2E8F0] shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-[#0F2540]">
            <span className="material-symbols-outlined icon-fill text-[18px] text-[#3B82F6]">edit_note</span>
            Input Data Manual
          </DialogTitle>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-[12px] font-semibold text-[#475569] shrink-0">Pilih Bulan:</label>
            <select
              value={selIdx}
              onChange={e => handleMonthChange(Number(e.target.value))}
              className="flex-1 h-8 rounded-md border border-[#c3c6d6] bg-white px-2 text-[13px] font-semibold text-[#0F2540] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
            >
              {monthlyData.map((m, i) => (
                <option key={i} value={i}>
                  {m.bulan}{m.total > 0 ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* ── 1. Rawat Jalan ── */}
          <div className="space-y-3">
            <SectionHead title="1. Rawat Jalan (Rajal)" icon="person" />
            <div className="grid grid-cols-3 gap-3">
              <NF label="Rajal Seluruhnya" fkey="total_rajal" />
              <NF label="Rajal Umum" fkey="rajal_umum" />
              <NF label="Rajal BPJS" fkey="rajal_bpjs" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NF label="Rujukan BPJS" fkey="rujukan" />
              <AutoField
                label="% Rujukan (auto)"
                value={persen_ruj !== null ? `${persen_ruj}%` : '—'}
              />
            </div>
          </div>

          {/* ── 2. Tindakan & Observasi ── */}
          <div className="space-y-3">
            <SectionHead title="2. Tindakan & Observasi" icon="medical_services" />
            <div className="grid grid-cols-2 gap-3">
              <NF label="Tindakan" fkey="tindakan" />
              <NF label="Observasi Umum" fkey="obs_umum" />
            </div>
          </div>

          {/* ── 3. Rawat Inap ── */}
          <div className="space-y-3">
            <SectionHead title="3. Rawat Inap (Ranap)" icon="hotel" />
            <div className="grid grid-cols-2 gap-3">
              <NF label="Total Ranap" fkey="total_ranap" />
              <NF label="Ranap Umum" fkey="ranap_umum" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NF label="BPJS Total Ranap" fkey="bpjs_total" />
              <NF label="BPJS Ranap" fkey="bpjs_ranap" />
              <NF label="BPJS Obs" fkey="bpjs_obs" />
            </div>
          </div>

          {/* ── 4. Rujukan Ranap ── */}
          <div className="space-y-3">
            <SectionHead title="4. Rujukan Ranap" icon="transfer_within_a_station" />
            <div className="grid grid-cols-3 gap-3">
              <NF label="Total Rujukan Ranap" fkey="rujukan_ranap" />
              <NF label="Rujukan BPJS" fkey="rujukan_ranap_bpjs" />
              <NF label="Rujukan Umum" fkey="rujukan_ranap_umum" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#334155]">Komentar Rujukan Ranap</label>
              <Textarea
                value={form.rujukan_notes}
                onChange={e => set('rujukan_notes', e.target.value)}
                placeholder="Catatan rujukan ranap (opsional)..."
                className="min-h-[60px] text-[13px] resize-none"
              />
            </div>
          </div>

          {/* ── 5. Kematian ── */}
          <div className="space-y-3">
            <SectionHead title="5. Kematian Ranap" icon="sentiment_sad" />
            <div className="grid grid-cols-3 gap-3">
              <NF label="Jumlah Kematian Ranap" fkey="mati" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#334155]">Komentar Kematian</label>
              <Textarea
                value={form.mati_notes}
                onChange={e => set('mati_notes', e.target.value)}
                placeholder="Catatan kematian ranap (opsional)..."
                className="min-h-[60px] text-[13px] resize-none"
              />
            </div>
          </div>

          {/* ── 6. Lab & Kepesertaan ── */}
          <div className="space-y-3">
            <SectionHead title="6. Lab & Kepesertaan BPJS" icon="science" />
            <div className="grid grid-cols-2 gap-3">
              <NF label="Jumlah Pasien Lab" fkey="lab" />
              <NF label="Jumlah Peserta BPJS" fkey="peserta_bpjs" />
            </div>
          </div>

          {/* ── Auto-calc summary ── */}
          <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill text-[16px] text-[#2563EB]">calculate</span>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">Kalkulasi Otomatis</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AutoField
                label="% Rujukan BPJS"
                value={persen_ruj !== null ? `${persen_ruj}%` : '—'}
              />
              <AutoField
                label="Total Kunjungan Pasien"
                value={total_kunjungan.toLocaleString('id-ID')}
              />
            </div>
            <p className="text-[10px] text-[#3B82F6] leading-relaxed">
              Total = Rajal ({toN(form.total_rajal)}) + Obs ({toN(form.obs_umum)}) + Tindakan ({toN(form.tindakan)}) + Ranap ({toN(form.total_ranap)})
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-4 border-t border-[#E2E8F0] shrink-0 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0052CC] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#003D99]"
          >
            <span className="material-symbols-outlined text-[15px]">save</span>
            Simpan Data
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   UI BLOCKS
   ──────────────────────────────────────────────────────────────────────────── */
function Banner({
  onExportPDF, onUploadClick, onInputManual, fileName,
}: {
  onExportPDF: () => void
  onUploadClick: () => void
  onInputManual: () => void
  fileName: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 sm:px-6 py-4 sm:py-5 text-white shadow-lg no-print-buttons"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-10"
           style={{
             backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
             backgroundSize: '40px 40px',
           }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="material-symbols-outlined icon-fill text-[#67E8F9]" style={{ fontSize: 22 }}>
              medical_services
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] sm:text-[20px] font-bold leading-tight tracking-tight truncate">Klinik OMARA</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-[12px] text-white/70 truncate">
              <span className="material-symbols-outlined text-[13px] shrink-0">monitoring</span>
              <span className="truncate">Sistem Laporan Kunjungan Pasien · 2026</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#15803D]"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={onInputManual}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#6D28D9]"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Input Manual
          </button>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-[12px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20"
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            Upload
          </button>
        </div>
      </div>
      {fileName && (
        <p className="relative mt-2 text-[11px] text-white/60">
          Data source: <span className="font-medium text-white/80">{fileName}</span>
        </p>
      )}
    </div>
  )
}

function FileInfoBar({ fileName, filledMonths }: { fileName: string; filledMonths: MonthRow[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-[12px] sm:text-[13px] text-[#1E3A8A]">
      <span className="material-symbols-outlined icon-fill text-[18px] text-[#3B82F6] shrink-0">description</span>
      <span className="font-semibold break-all">{fileName}</span>
      <span className="text-[#475569] hidden sm:inline">·</span>
      <span className="text-[#475569]">
        {filledMonths.length} bulan data tersedia
        {filledMonths.length > 0 && ` (${filledMonths[0].bulan} – ${filledMonths[filledMonths.length - 1].bulan})`}.
      </span>
      <span className="text-[#475569] hidden sm:inline">
        Klik <span className="font-semibold text-[#1E3A8A]">Upload</span> atau <span className="font-semibold text-[#1E3A8A]">Input Manual</span> untuk mengisi data.
      </span>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: {
  label: string; value: string | number; sub?: string; icon: string;
}) {
  return (
    <div className="relative rounded-lg border border-[#E2E8F0] bg-white p-4 transition-shadow hover:shadow-card">
      <div className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg bg-[#F1F5F9]">
        <span className="material-symbols-outlined icon-fill text-[18px] text-[#475569]">{icon}</span>
      </div>
      <p className="pr-10 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</p>
      <p className="mt-1.5 text-[24px] font-bold leading-none text-[#0F2540] num-tabular">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-[#64748B]">{sub}</p>}
    </div>
  )
}

function HighlightCard({ label, value, icon, tone }: {
  label: string; value: string; icon: string;
  tone: 'mint' | 'cyan' | 'blue';
}) {
  const styles = {
    mint: { bg: '#ECFDF5', icon_bg: '#D1FAE5', icon_color: '#059669' },
    cyan: { bg: '#ECFEFF', icon_bg: '#CFFAFE', icon_color: '#0891B2' },
    blue: { bg: '#EFF6FF', icon_bg: '#DBEAFE', icon_color: '#2563EB' },
  }[tone]
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-4 py-3"
      style={{ backgroundColor: styles.bg }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: styles.icon_bg }}>
        <span className="material-symbols-outlined icon-fill text-[18px]" style={{ color: styles.icon_color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
        <p className="mt-0.5 text-[14px] font-bold text-[#0F2540] leading-tight">{value}</p>
      </div>
    </div>
  )
}

function ChartCard({ title, icon, children, className = '' }: {
  title: string; icon: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[#E2E8F0] bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined icon-fill text-[16px] text-[#3B82F6]">{icon}</span>
        <h3 className="text-[13px] font-semibold text-[#0F2540]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[11px] shadow-md">
      {label && <p className="mb-1 font-semibold text-[#0F2540]">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#475569]">{p.name}:</span>
          <span className="font-semibold text-[#0F2540]">{p.value?.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  )
}

type TabKey = 'overview' | 'rajal' | 'ranap' | 'detail'
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview',    icon: 'grid_view' },
  { key: 'rajal',    label: 'Rawat Jalan', icon: 'arrow_upward' },
  { key: 'ranap',    label: 'Rawat Inap',  icon: 'hotel' },
  { key: 'detail',   label: 'Detail',      icon: 'table_rows' },
]

function TabsBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 no-print">
      <div className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] p-1 whitespace-nowrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
              active === t.key
                ? 'bg-white text-[#0F2540] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F2540]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [monthlyData, setMonthlyData] = useState<MonthRow[]>(INITIAL_DATA)
  const [fileName, setFileName] = useState('laporan_kunjungan_pasien_2026.xlsx')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Input manual dialog state
  const [inputDialogOpen, setInputDialogOpen] = useState(false)
  const [editingMonthIdx, setEditingMonthIdx] = useState(0)

  /* ─── Derived stats ──────────────────────────────────────────── */
  const filledMonths = useMemo(() => monthlyData.filter(m => m.total > 0), [monthlyData])
  const totals = useMemo(() => ({
    total_rajal:        filledMonths.reduce((s, m) => s + m.total_rajal, 0),
    rajal_umum:         filledMonths.reduce((s, m) => s + m.rajal_umum, 0),
    rajal_bpjs:         filledMonths.reduce((s, m) => s + m.rajal_bpjs, 0),
    rujukan:            filledMonths.reduce((s, m) => s + m.rujukan, 0),
    tindakan:           filledMonths.reduce((s, m) => s + m.tindakan, 0),
    obs_umum:           filledMonths.reduce((s, m) => s + m.obs_umum, 0),
    total_ranap:        filledMonths.reduce((s, m) => s + m.total_ranap, 0),
    ranap_umum:         filledMonths.reduce((s, m) => s + m.ranap_umum, 0),
    bpjs_total:         filledMonths.reduce((s, m) => s + m.bpjs_total, 0),
    bpjs_ranap:         filledMonths.reduce((s, m) => s + m.bpjs_ranap, 0),
    bpjs_obs:           filledMonths.reduce((s, m) => s + m.bpjs_obs, 0),
    rujukan_ranap:      filledMonths.reduce((s, m) => s + m.rujukan_ranap, 0),
    rujukan_ranap_bpjs: filledMonths.reduce((s, m) => s + m.rujukan_ranap_bpjs, 0),
    rujukan_ranap_umum: filledMonths.reduce((s, m) => s + m.rujukan_ranap_umum, 0),
    mati:               filledMonths.reduce((s, m) => s + m.mati, 0),
    lab:                filledMonths.reduce((s, m) => s + m.lab, 0),
    total:              filledMonths.reduce((s, m) => s + m.total, 0),
  }), [filledMonths])

  const bulanTertinggi = useMemo(() =>
    filledMonths.length ? filledMonths.reduce((a, b) => (a.total >= b.total ? a : b)) : null,
    [filledMonths]
  )
  const avgRujukanBpjs = filledMonths.length
    ? (filledMonths.reduce((s, m) => s + (m.persen_rujukan ?? 0), 0) / filledMonths.length).toFixed(1)
    : '0.0'
  const proporsiBpjsRajal = totals.total_rajal > 0 ? Math.round((totals.rajal_bpjs / totals.total_rajal) * 100) : 0
  const proporsiUmumRajal = 100 - proporsiBpjsRajal
  const avgRajalPerBulan  = filledMonths.length ? Math.round(totals.total_rajal / filledMonths.length) : 0
  const avgRanapPerBulan  = filledMonths.length ? Math.round(totals.total_ranap / filledMonths.length) : 0

  /* ─── Chart datasets ─────────────────────────────────────────── */
  const barTotalKunjungan     = filledMonths.map(m => ({ name: m.bulan, value: m.total }))
  const lineRajalRanap        = filledMonths.map(m => ({ name: m.bulan, 'Rawat Jalan': m.total_rajal, 'Rawat Inap': m.total_ranap }))
  const donutData = [
    { name: `Rajal · ${totals.total_rajal.toLocaleString('id-ID')}`,  value: totals.total_rajal,  gradId: 'g-rajal',     legendColor: '#3B82F6' },
    { name: `Ranap · ${totals.total_ranap.toLocaleString('id-ID')}`,  value: totals.total_ranap,  gradId: 'g-ranap',     legendColor: '#8B5CF6' },
    { name: `Tindakan · ${totals.tindakan.toLocaleString('id-ID')}`,  value: totals.tindakan,     gradId: 'g-tindakan',  legendColor: '#06B6D4' },
    { name: `Observasi · ${totals.obs_umum.toLocaleString('id-ID')}`, value: totals.obs_umum,     gradId: 'g-observasi', legendColor: '#818CF8' },
  ]
  const stackedRajal            = filledMonths.map(m => ({ name: m.bulan, Umum: m.rajal_umum, BPJS: m.rajal_bpjs }))
  const stackedRanap            = filledMonths.map(m => ({ name: m.bulan, Umum: m.ranap_umum, BPJS: m.bpjs_ranap }))
  const groupedLabTindakanObs   = filledMonths.map(m => ({ name: m.bulan, Lab: m.lab, Tindakan: m.tindakan, Observasi: m.obs_umum }))
  const persenRujukanArea       = filledMonths.map(m => ({ name: m.bulan, value: m.persen_rujukan ?? 0 }))

  /* ─── Handlers ───────────────────────────────────────────────── */
  function handleExportPDF() {
    toast.info('Buka dialog cetak — pilih "Save as PDF" pada destination', { duration: 3000 })
    setTimeout(() => window.print(), 300)
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleOpenInputManual(idx?: number) {
    // Default: open to first empty month, or month 0
    const defaultIdx = idx ?? (monthlyData.findIndex(m => m.total === 0) ?? 0)
    setEditingMonthIdx(Math.max(0, defaultIdx))
    setInputDialogOpen(true)
  }

  function handleSaveMonth(idx: number, updated: MonthRow) {
    setMonthlyData(data => data.map((r, i) => (i === idx ? updated : r)))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format file harus .xlsx, .xls, atau .csv')
      e.target.value = ''
      return
    }
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const parsed = parseXlsx(wb)
      if (!parsed) {
        toast.error('File tidak berisi data yang valid')
      } else {
        setMonthlyData(parsed)
        setFileName(file.name)
        const valid = parsed.filter(m => m.total > 0).length
        toast.success(`Data dimuat: ${valid} bulan dari ${file.name}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal membaca file: ' + (err as Error).message)
    }
    e.target.value = ''
  }

  return (
    <div ref={printRef} className="space-y-4">
      {/* ─── 3D donut + Print styles ───────────────────────── */}
      <style jsx global>{`
        /* 3D Donut effect — perspective tilt + soft shadow */
        .donut-3d-wrapper { perspective: 1200px; }
        .donut-3d-wrapper .recharts-pie {
          transform: rotateX(38deg);
          transform-origin: 50% 50%;
          transform-box: fill-box;
          transition: transform 0.4s ease;
        }
        .donut-3d-wrapper:hover .recharts-pie { transform: rotateX(28deg); }
        .donut-3d-wrapper .recharts-pie-sector path { transition: transform 0.2s ease; }
        .donut-3d-wrapper .recharts-pie-sector:hover path {
          transform: scale(1.04);
          transform-origin: center;
          transform-box: fill-box;
        }
        .donut-3d-wrapper .recharts-legend-wrapper {
          font-feature-settings: "kern" 1;
          -webkit-font-smoothing: antialiased;
        }
        .donut-3d-wrapper .recharts-legend-item { margin-right: 14px !important; }

        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white !important; }
          .no-print, .no-print-buttons button, [data-slot="sidebar"], header { display: none !important; }
          aside, nav[aria-label="Breadcrumb"] { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          html.dark .bg-white { background-color: white !important; color: #0F2540 !important; }
          html.dark .text-\\[\\#0F2540\\], html.dark .text-\\[\\#64748B\\] { color: #0F2540 !important; }
          .recharts-wrapper { page-break-inside: avoid; }
          .rounded-lg, .rounded-xl { page-break-inside: avoid; }
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Input Manual Dialog */}
      <InputManualDialog
        open={inputDialogOpen}
        monthIdx={editingMonthIdx}
        monthlyData={monthlyData}
        onClose={() => setInputDialogOpen(false)}
        onSave={handleSaveMonth}
      />

      {/* Banner */}
      <Banner
        onExportPDF={handleExportPDF}
        onUploadClick={handleUploadClick}
        onInputManual={() => handleOpenInputManual()}
        fileName={fileName}
      />

      {/* File info bar */}
      <FileInfoBar fileName={fileName} filledMonths={filledMonths} />

      {/* Tabs */}
      <TabsBar active={tab} onChange={setTab} />

      {/* ════════════════════ Overview ════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="TOTAL KUNJUNGAN" value={totals.total.toLocaleString('id-ID')} sub={`${filledMonths.length} bulan tercatat`} icon="groups" />
            <StatCard label="TOTAL RAJAL"     value={totals.total_rajal.toLocaleString('id-ID')} sub={`${avgRajalPerBulan} /bulan`} icon="person" />
            <StatCard label="TOTAL RANAP"     value={totals.total_ranap.toLocaleString('id-ID')} sub={`${avgRanapPerBulan} /bulan`} icon="hotel" />
            <StatCard label="TINDAKAN"        value={totals.tindakan.toLocaleString('id-ID')} sub={`Lab: ${totals.lab}`} icon="medical_services" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <HighlightCard tone="mint" icon="emoji_events" label="Bulan tertinggi" value={bulanTertinggi ? `${bulanTertinggi.bulan} · ${bulanTertinggi.total} pasien` : '—'} />
            <HighlightCard tone="cyan" icon="percent"      label="Rata-rata rujukan BPJS" value={`${avgRujukanBpjs}%`} />
            <HighlightCard tone="blue" icon="groups"       label="Proporsi BPJS (Rajal)" value={`${proporsiBpjsRajal}% BPJS · ${proporsiUmumRajal}% Umum`} />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <ChartCard title="Total Kunjungan per Bulan" icon="bar_chart" className="lg:col-span-3">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barTotalKunjungan} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="value" name="Kunjungan" fill={MID_BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Komposisi Kunjungan" icon="donut_large" className="lg:col-span-2">
              <div className="donut-3d-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      <linearGradient id="g-rajal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#93C5FD" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E3A8A" />
                      </linearGradient>
                      <linearGradient id="g-ranap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C4B5FD" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#5B21B6" />
                      </linearGradient>
                      <linearGradient id="g-tindakan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#67E8F9" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#0E7490" />
                      </linearGradient>
                      <linearGradient id="g-observasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A5B4FC" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#3730A3" />
                      </linearGradient>
                      <radialGradient id="g-shine" cx="50%" cy="20%" r="80%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                        <stop offset="60%" stopColor="rgba(255,255,255,0.06)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </radialGradient>
                      <filter id="donutShadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                        <feOffset dx="0" dy="6" result="offsetblur" />
                        <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <Pie data={donutData} cx="50%" cy="48%" innerRadius={56} outerRadius={98}
                      dataKey="value" paddingAngle={2} stroke="rgba(255,255,255,0.85)" strokeWidth={2} filter="url(#donutShadow)">
                      {donutData.map((d, i) => <Cell key={i} fill={`url(#${d.gradId})`} />)}
                    </Pie>
                    <Pie data={donutData} cx="50%" cy="48%" innerRadius={56} outerRadius={98}
                      dataKey="value" paddingAngle={2} stroke="none" isAnimationActive={false} style={{ pointerEvents: 'none' }}>
                      {donutData.map((_, i) => <Cell key={i} fill="url(#g-shine)" />)}
                    </Pie>
                    <Tooltip content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] shadow-md">
                          <p className="font-semibold text-[#0F2540]">{payload[0].payload.name}</p>
                        </div>
                      )
                    }} />
                    <Legend iconType="circle" iconSize={11} wrapperStyle={{ paddingTop: 12 }}
                      formatter={(value) => (
                        <span style={{ color: '#475569', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.01em', marginRight: 6 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Tren Rajal vs Ranap" icon="trending_up">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineRajalRanap}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Rawat Jalan" stroke={DEEP_BLUE} strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: DEEP_BLUE, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Rawat Inap"  stroke={LITE_BLUE} strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: LITE_BLUE, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ════════════════════ Rawat Jalan ════════════════════ */}
      {tab === 'rajal' && (
        <div className="space-y-4">
          <ChartCard title="Rawat Jalan — Umum vs BPJS" icon="arrow_upward">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stackedRajal} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Umum" stackId="a" fill={DEEP_BLUE} />
                <Bar dataKey="BPJS" stackId="a" fill={LITE_BLUE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Persentase Rujukan BPJS" icon="percent">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={persenRujukanArea}>
                <defs>
                  <linearGradient id="gradRujukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={MID_BLUE} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={MID_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" name="% Rujukan" stroke={MID_BLUE} strokeWidth={2.5}
                  fill="url(#gradRujukan)" dot={{ r: 5, fill: '#fff', stroke: MID_BLUE, strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ════════════════════ Rawat Inap ════════════════════ */}
      {tab === 'ranap' && (
        <div className="space-y-4">
          <ChartCard title="Rawat Inap — Umum vs BPJS" icon="hotel">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stackedRanap} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Umum" stackId="a" fill={DEEP_BLUE} />
                <Bar dataKey="BPJS" stackId="a" fill={LITE_BLUE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Lab, Tindakan & Observasi" icon="science">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupedLabTindakanObs} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Lab"       fill={DEEP_BLUE} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tindakan"  fill={MID_BLUE}  radius={[4, 4, 0, 0]} />
                <Bar dataKey="Observasi" fill={LITE_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ════════════════════ Detail ════════════════════ */}
      {tab === 'detail' && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined icon-fill text-[16px] text-[#3B82F6]">table_chart</span>
              <h3 className="text-[13px] font-semibold text-[#0F2540]">Rekap Lengkap 2026</h3>
            </div>
            <span className="text-[11px] text-[#94A3B8]">
              <span className="material-symbols-outlined text-[13px] align-text-bottom">touch_app</span>
              {' '}Klik baris untuk edit
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]">
                  {['No','Bulan','Total Rajal','Rajal Umum','Rajal BPJS','Rujukan','% Ruj','Tindakan','Obs Umum','Total Ranap','Ranap Umum','BPJS Total','BPJS Ranap','BPJS Obs','Jml Ruj Ranap','Mati','Lab','Peserta BPJS','Total'].map((h, i) => (
                    <th key={i} className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${i <= 1 ? 'text-left' : 'text-right'} whitespace-nowrap`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => {
                  const isEmpty      = row.total === 0
                  const isHighlight  = bulanTertinggi && row.bulan === bulanTertinggi.bulan
                  return (
                    <tr
                      key={row.no}
                      className={`border-b border-[#F1F5F9] cursor-pointer transition-colors hover:bg-[#F0F7FF] ${isEmpty ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}
                      onClick={() => { setEditingMonthIdx(row.no - 1); setInputDialogOpen(true) }}
                      title={`Klik untuk edit data ${row.bulan}`}
                    >
                      <td className="px-3 py-2.5 text-left">{row.no}</td>
                      <td className="px-3 py-2.5 text-left">
                        {isHighlight ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                            <span className="material-symbols-outlined icon-fill text-[12px]">star</span>
                            {row.bulan}
                          </span>
                        ) : row.bulan}
                        {row.rujukan_notes && <span className="ml-1 inline-block size-1.5 rounded-full bg-[#7C3AED]" title={row.rujukan_notes} />}
                        {row.mati_notes    && <span className="ml-1 inline-block size-1.5 rounded-full bg-[#EF4444]" title={row.mati_notes} />}
                      </td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.total_rajal}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.rajal_umum}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.rajal_bpjs}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.rujukan}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{row.persen_rujukan === null ? '—' : `${row.persen_rujukan}%`}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.tindakan}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.obs_umum}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.total_ranap}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.ranap_umum}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.bpjs_total}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.bpjs_ranap}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.bpjs_obs}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.rujukan_ranap}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.mati}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.lab}</td>
                      <td className="px-3 py-2.5 text-right num-tabular">{isEmpty ? '—' : row.peserta_bpjs}</td>
                      <td className="px-3 py-2.5 text-right font-semibold num-tabular text-[#0F2540]">{isEmpty ? '—' : row.total}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F1F5F9] font-semibold text-[#0F2540]">
                  <td className="px-3 py-3 text-left" colSpan={2}>Rekap Total 2026</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.total_rajal}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.rajal_umum}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.rajal_bpjs}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.rujukan}</td>
                  <td className="px-3 py-3 text-right num-tabular">—</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.tindakan}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.obs_umum}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.total_ranap}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.ranap_umum}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.bpjs_total}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.bpjs_ranap}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.bpjs_obs}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.rujukan_ranap}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.mati}</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.lab}</td>
                  <td className="px-3 py-3 text-right num-tabular">—</td>
                  <td className="px-3 py-3 text-right num-tabular">{totals.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 pb-1 text-center">
        <p className="text-[11px] text-[#94A3B8]">
          &copy; 2026 Klinik OMARA · Built with care
        </p>
      </div>
    </div>
  )
}
