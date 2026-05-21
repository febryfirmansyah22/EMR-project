export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'rgb(74, 119, 178)',
        fontFamily: "var(--font-work-sans, 'Work Sans', 'Inter', sans-serif)",
      }}
    >
      <div className="px-6 md:px-10 py-8 md:py-10 max-w-[1280px] mx-auto">
        {/* Top label */}
        <div className="text-center mb-5">
          <span className="inline-block font-black tracking-[0.22em] text-sm md:text-base uppercase text-primary-700">
            OMARA EMR &nbsp;·&nbsp; Sistem Rekam Medis Klinik
          </span>
        </div>

        {/* Main hero card */}
        <section
          className="overflow-hidden relative"
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 40px -16px rgba(0, 61, 155, 0.18)',
          }}
        >
          {/* ─── NAV ─── */}
          <nav className="relative z-30 flex items-center justify-between px-8 md:px-12 pt-7 pb-3">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-100 grid place-items-center relative">
                <span
                  className="material-symbols-outlined text-primary-700"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24", fontSize: '22px' }}
                >
                  medical_services
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary-700 ring-2 ring-white" />
              </div>
              <div className="leading-none">
                <p className="font-black text-primary-700 text-[15px] tracking-wide">OMARA</p>
                <p className="font-bold text-primary-500 text-[15px] tracking-wide">EMR</p>
              </div>
            </a>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-9 text-[15px] font-medium text-[#091E42]">
              <a href="/" className="hover:text-primary-700">Beranda</a>
              <a href="#fitur" className="hover:text-primary-700 flex items-center gap-1">
                Fitur
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
              </a>
              <a href="#modul" className="hover:text-primary-700 flex items-center gap-1">
                Modul
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
              </a>
              <a href="#harga" className="hover:text-primary-700">Harga</a>
              <a href="#pelanggan" className="hover:text-primary-700">Pelanggan</a>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="hidden md:inline-flex text-[15px] font-semibold text-[#091E42] hover:text-primary-700"
              >
                Masuk
              </a>
              <a
                href="/login"
                className="px-5 py-2.5 rounded-full bg-primary-500 hover:bg-primary-700 text-white text-[14px] font-semibold transition"
                style={{ boxShadow: '0 4px 12px rgba(0,82,204,0.25)' }}
              >
                Coba Gratis
              </a>
            </div>
          </nav>

          {/* ─── HERO BODY ─── */}
          <div className="relative grid grid-cols-12 gap-6 px-8 md:px-12 pb-12 pt-2 min-h-[560px]">
            {/* Decorative dashed ring — back left */}
            <svg
              className="absolute -left-32 -top-6 w-[420px] h-[420px] opacity-60 pointer-events-none"
              viewBox="0 0 400 400"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="200" cy="200" r="180" stroke="#BBD2FF" strokeWidth="1.5" strokeDasharray="4 6" />
              <circle cx="200" cy="200" r="120" fill="#EAF1FF" />
            </svg>

            {/* LEFT: copy */}
            <div className="col-span-12 md:col-span-6 relative z-10 flex flex-col justify-center py-6">
              <p className="text-primary-500 font-bold text-[13px] tracking-[0.18em] uppercase mb-4">
                Untuk Klinik Pratama &amp; FKTP
              </p>
              <h1
                className="text-[44px] md:text-[60px] leading-[1.02] font-black tracking-tight text-primary-700"
                style={{ textWrap: 'pretty' } as React.CSSProperties}
              >
                Klinik &amp;<br />
                <span className="text-primary-500">Apotek</span> dalam<br />
                satu sistem.
              </h1>
              <p
                className="mt-6 text-[15px] md:text-[16px] leading-relaxed max-w-[440px]"
                style={{ color: '#434654', textWrap: 'pretty' } as React.CSSProperties}
              >
                Dari pendaftaran hingga klaim BPJS — kelola antrean, SOAP, resep elektronik,
                farmasi, dan kasir dalam satu alur kerja yang ringkas. Dirancang bersama
                dokter, untuk dokter Indonesia.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex items-center gap-5">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary-700 hover:bg-primary-500 text-white text-[15px] font-semibold transition"
                  style={{ boxShadow: '0 8px 24px rgba(0,61,155,0.25)' }}
                >
                  Selengkapnya
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </a>
                <a href="#demo" className="inline-flex items-center gap-3 group">
                  <span className="w-11 h-11 rounded-full bg-white border border-primary-100 grid place-items-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition shadow-md">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24", fontSize: '20px' }}
                    >
                      play_arrow
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold text-[#091E42]">Tonton Demo</span>
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-8 pt-6 border-t border-primary-100 flex items-center gap-6 max-w-[440px]">
                <div>
                  <p className="text-[22px] font-black text-primary-700 leading-none">320+</p>
                  <p className="text-[12px] mt-1" style={{ color: '#434654' }}>Klinik aktif</p>
                </div>
                <div className="h-9 w-px bg-primary-100" />
                <div>
                  <p className="text-[22px] font-black text-primary-700 leading-none">2.4 jt</p>
                  <p className="text-[12px] mt-1" style={{ color: '#434654' }}>Rekam medis</p>
                </div>
                <div className="h-9 w-px bg-primary-100" />
                <div>
                  <p className="text-[22px] font-black text-primary-700 leading-none">99.9%</p>
                  <p className="text-[12px] mt-1" style={{ color: '#434654' }}>Uptime SLA</p>
                </div>
              </div>
            </div>

            {/* RIGHT: decorative disc + photo slot + badges */}
            <div className="col-span-12 md:col-span-6 relative min-h-[480px]">
              {/* Big primary blue disc (back) */}
              <svg
                className="absolute -right-24 -top-16 w-[640px] h-[640px] pointer-events-none"
                viewBox="0 0 640 640"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="disc-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0052cc" />
                    <stop offset="100%" stopColor="#003d9b" />
                  </linearGradient>
                  <linearGradient id="ribbon-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3a7fdc" />
                    <stop offset="100%" stopColor="#0052cc" />
                  </linearGradient>
                </defs>
                <circle cx="340" cy="300" r="290" fill="url(#disc-grad)" />
                <circle cx="340" cy="300" r="290" fill="none" stroke="#3a7fdc" strokeWidth="2" opacity="0.5" />
              </svg>

              {/* Ribbon / swoosh overlay */}
              <svg
                className="absolute -left-16 top-1/2 -translate-y-1/2 w-[720px] h-[520px] pointer-events-none"
                viewBox="0 0 720 520"
                aria-hidden="true"
              >
                <path
                  d="M -40 380 C 200 360, 240 120, 480 140 C 640 155, 720 280, 700 420"
                  fill="none"
                  stroke="#9CC0FF"
                  strokeWidth="44"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <path
                  d="M -40 380 C 200 360, 240 120, 480 140 C 640 155, 720 280, 700 420"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="20"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M 60 460 C 240 440, 320 200, 560 220"
                  fill="none"
                  stroke="url(#ribbon-grad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>

              {/* Photo slot — circular pill, clipped */}
              <div
                className="absolute top-4 right-2 md:right-6 w-[420px] h-[480px] overflow-hidden shadow-2xl"
                style={{ borderRadius: '240px 240px 220px 220px / 240px 240px 220px 220px' }}
              >
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-3"
                  style={{ background: 'linear-gradient(160deg, #E4EFFF, #B9D0FF)' }}
                >
                  <span
                    className="material-symbols-outlined text-primary-400"
                    style={{ fontSize: '56px', opacity: 0.5 }}
                  >
                    person
                  </span>
                  <p className="text-[13px] font-medium text-primary-500 opacity-60">Foto dokter / nakes</p>
                </div>
              </div>

              {/* Floating badge — BPJS & Satusehat */}
              <div
                className="absolute top-12 -left-2 md:left-2 bg-white rounded-2xl px-4 py-3 flex items-center gap-3 z-20"
                style={{ boxShadow: '0 12px 32px -8px rgba(0, 61, 155, 0.25)' }}
              >
                <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: 'rgba(54,179,126,0.15)' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24",
                      fontSize: '22px',
                      color: '#36B37E',
                    }}
                  >
                    verified
                  </span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold leading-none" style={{ color: '#434654' }}>
                    Bridging
                  </p>
                  <p className="text-[14px] font-bold text-[#091E42] mt-1 leading-none">BPJS &amp; Satusehat</p>
                </div>
              </div>

              {/* Floating stat card — Antrean Hari Ini */}
              <div
                className="absolute bottom-8 left-0 md:left-4 bg-white rounded-2xl p-4 z-20 w-[220px]"
                style={{ boxShadow: '0 12px 32px -8px rgba(0, 61, 155, 0.25)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: '#434654' }}>
                    Antrean Hari Ini
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#36B37E', background: 'rgba(54,179,126,0.1)' }}>
                    LIVE
                  </span>
                </div>
                <div className="flex items-end gap-1.5 mt-3">
                  <div className="text-[32px] font-black text-primary-700 leading-none">42</div>
                  <div className="text-[12px] mb-1" style={{ color: '#434654' }}>pasien</div>
                </div>
                <div className="mt-3 flex items-end gap-1 h-8">
                  <span className="flex-1 bg-primary-100 rounded-sm" style={{ height: '50%' }} />
                  <span className="flex-1 bg-primary-100 rounded-sm" style={{ height: '75%' }} />
                  <span className="flex-1 bg-primary-200 rounded-sm" style={{ height: '60%' }} />
                  <span className="flex-1 bg-primary-500 rounded-sm" style={{ height: '92%' }} />
                  <span className="flex-1 bg-primary-100 rounded-sm" style={{ height: '70%' }} />
                  <span className="flex-1 bg-primary-100 rounded-sm" style={{ height: '40%' }} />
                  <span className="flex-1 bg-primary-100 rounded-sm" style={{ height: '30%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── FEATURE TILES ─── */}
          <div id="modul" className="relative px-8 md:px-12 pb-12 pt-2 grid grid-cols-12 gap-4">
            {/* Tile 1 — Antrean & Pendaftaran */}
            <a href="/dashboard" className="col-span-12 sm:col-span-6 md:col-span-3 group">
              <div className="rounded-2xl bg-white border border-primary-100 p-6 hover:border-primary-500 hover:-translate-y-1 transition-all shadow-sm h-full">
                <div className="w-16 h-16 rounded-xl bg-primary-50 grid place-items-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="material-symbols-outlined text-primary-700" style={{ fontSize: '34px' }}>queue</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: '#434654' }}>Modul 01</p>
                <p className="text-[18px] font-black text-primary-700 mt-1">Antrean &amp; Pendaftaran</p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: '#434654', textWrap: 'pretty' } as React.CSSProperties}>
                  NIK lewat KTP-el, antrean per-poli, panggilan ke layar ruang tunggu.
                </p>
              </div>
            </a>

            {/* Tile 2 — Resep Elektronik (highlighted) */}
            <a href="/dashboard" className="col-span-12 sm:col-span-6 md:col-span-3 group">
              <div
                className="rounded-2xl bg-primary-500 p-6 hover:-translate-y-1 transition-all text-white relative overflow-hidden h-full"
                style={{ boxShadow: '0 8px 24px rgba(0,82,204,0.3)' }}
              >
                <svg className="absolute -right-8 -bottom-8 w-32 h-32 opacity-20" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="2" />
                  <circle cx="50" cy="50" r="32" fill="white" />
                </svg>
                <div className="w-16 h-16 rounded-xl grid place-items-center mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>prescriptions</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>Modul 02</p>
                <p className="text-[18px] font-black mt-1">Resep Elektronik</p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: 'rgba(255,255,255,0.85)', textWrap: 'pretty' } as React.CSSProperties}>
                  Tanda tangan digital, peringatan interaksi obat, terhubung ke apotek.
                </p>
              </div>
            </a>

            {/* Tile 3 — Farmasi & Stok */}
            <a href="/dashboard" className="col-span-12 sm:col-span-6 md:col-span-3 group">
              <div className="rounded-2xl bg-white border border-primary-100 p-6 hover:border-primary-500 hover:-translate-y-1 transition-all shadow-sm h-full">
                <div className="w-16 h-16 rounded-xl bg-primary-50 grid place-items-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="material-symbols-outlined text-primary-700" style={{ fontSize: '34px' }}>medication</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: '#434654' }}>Modul 03</p>
                <p className="text-[18px] font-black text-primary-700 mt-1">Farmasi &amp; Stok</p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: '#434654', textWrap: 'pretty' } as React.CSSProperties}>
                  Pick &amp; pack, FIFO batch, alert stok kritis, scan barcode item.
                </p>
              </div>
            </a>

            {/* Tile 4 — Laporan & Klaim */}
            <a href="/dashboard" className="col-span-12 sm:col-span-6 md:col-span-3 group">
              <div className="rounded-2xl bg-white border border-primary-100 p-6 hover:border-primary-500 hover:-translate-y-1 transition-all shadow-sm h-full">
                <div className="w-16 h-16 rounded-xl bg-primary-50 grid place-items-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="material-symbols-outlined text-primary-700" style={{ fontSize: '34px' }}>assessment</span>
                </div>
                <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: '#434654' }}>Modul 04</p>
                <p className="text-[18px] font-black text-primary-700 mt-1">Laporan &amp; Klaim</p>
                <p className="text-[13px] leading-relaxed mt-2" style={{ color: '#434654', textWrap: 'pretty' } as React.CSSProperties}>
                  Dashboard owner, top-diagnosa, ekspor klaim BPJS, FRS &amp; LP-LPLPO.
                </p>
              </div>
            </a>
          </div>

          {/* ─── FOOTER STRIP ─── */}
          <div
            className="border-t border-primary-100 px-8 md:px-12 py-5 grid grid-cols-12 gap-6 items-center"
            style={{ background: 'linear-gradient(to bottom, white, rgba(235,244,255,0.3))' }}
          >
            <div className="col-span-12 md:col-span-6 flex items-center gap-3 text-[#091E42]">
              <span className="material-symbols-outlined text-primary-500" style={{ fontSize: '20px' }}>mail</span>
              <span className="text-[14px]">halo@omara-emr.id</span>
              <span className="mx-1 text-primary-200">·</span>
              <span className="material-symbols-outlined text-primary-500" style={{ fontSize: '20px' }}>call</span>
              <span className="text-[14px]">+62 21 5022-1700</span>
            </div>
            <div className="col-span-12 md:col-span-6 flex items-center justify-end gap-4">
              <span className="text-[14px]" style={{ color: '#434654' }}>Pelajari lebih lanjut →</span>
              <a
                href="#"
                className="px-5 py-2 rounded-full bg-primary-700 hover:bg-primary-500 text-white text-[13px] font-semibold transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>language</span>
                omara-emr.id
              </a>
            </div>
          </div>
        </section>

        {/* Caption */}
        <p className="text-center text-[13px] mt-6" style={{ color: 'rgba(9,30,66,0.7)' }}>
          Lihat 5 layar aplikasi ·{' '}
          <a href="/dashboard" className="text-primary-700 font-semibold hover:underline">
            Buka demo modul →
          </a>
        </p>
      </div>
    </div>
  )
}
