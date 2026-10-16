import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CalendarRange,
  LayoutList,
  FileText,
  ShieldCheck,
  Printer,
  Sparkles,
  Heart,
  ArrowRight,
  LogIn,
  CheckCircle2,
  GraduationCap,
  Award,
  Layers,
  Compass,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Perangkat Pembelajaran MTs KH A Wahab Muhsin",
  description:
    "Sistem Perangkat Pembelajaran Terpadu MTs KH A Wahab Muhsin Tasikmalaya berlandaskan Kurikulum Berbasis Cinta (KBC) dan Pembelajaran Mendalam sesuai KMA 1503 Tahun 2025.",
};

export default async function LandingPage() {
  // Cek apakah ada sesi user aktif
  let user = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    // Abaikan jika env atau client belum tersedia
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* NAVBAR HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl bg-white p-1 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <Image
                src="/logo-mts.png"
                alt="Logo MTs KH A Wahab Muhsin"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-slate-900 leading-tight">
                MTs KH A Wahab Muhsin
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                Sistem Perangkat Pembelajaran KBC
              </span>
            </div>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-emerald-700 transition-colors">
              Alur Perangkat
            </a>
            <a href="#siklus-3m" className="hover:text-emerald-700 transition-colors">
              Struktur 3M
            </a>
            <a href="#panca-cinta" className="hover:text-emerald-700 transition-colors">
              Panca Cinta
            </a>
            <a href="#validasi" className="hover:text-emerald-700 transition-colors">
              Supervisi Digital
            </a>
          </nav>

          {/* Tombol Masuk / Dashboard */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className={
                  buttonVariants({ size: "sm" }) +
                  " bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm rounded-lg flex items-center gap-2 h-9 px-3.5"
                }
              >
                <span>Ke Dashboard Saya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className={
                  buttonVariants({ size: "sm" }) +
                  " bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm rounded-lg px-4 flex items-center gap-1.5 h-9"
                }
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ke Sistem</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION DENGAN IKON BERGERAK */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 bg-gradient-to-b from-white via-emerald-50/25 to-slate-50 border-b border-slate-200">
        {/* Dekorasi Cahaya Latar Belakang */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Teks Hero (7 Kolom) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge Regulasi */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span>Standar KMA 1503 Tahun 2025 • Kurikulum Berbasis Cinta (KBC)</span>
              </div>

              {/* Judul Utama */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Sistem Perangkat Pembelajaran{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-700 block mt-1">
                    MTs KH A Wahab Muhsin
                  </span>
                </h1>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Platform administrasi pembelajaran guru madrasah terintegrasi untuk penyusunan, telaah, dan validasi digital dokumen ATP, Prota, Prosem, serta Modul Ajar (RPP) berbasis nilai Panca Cinta & Pembelajaran Mendalam.
                </p>
              </div>

              {/* Call to Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    className={
                      buttonVariants({ size: "lg" }) +
                      " bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md rounded-xl px-6 h-12 flex items-center gap-2"
                    }
                  >
                    <span>Buka Dashboard Perangkat</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className={
                      buttonVariants({ size: "lg" }) +
                      " bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md rounded-xl px-7 h-12 transition-all hover:scale-[1.02] flex items-center gap-2"
                    }
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem Guru</span>
                  </Link>
                )}

                <a
                  href="#fitur"
                  className={
                    buttonVariants({ variant: "outline", size: "lg" }) +
                    " border-slate-300 text-slate-800 font-semibold text-sm hover:bg-white rounded-xl px-5 h-12 flex items-center gap-2"
                  }
                >
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Jelajahi Fitur</span>
                </a>
              </div>

              {/* Key Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80">
                <div className="p-2.5 rounded-lg bg-white/70 border border-slate-200">
                  <div className="text-xl font-black text-emerald-800">4 Dokumen</div>
                  <div className="text-[11px] font-medium text-slate-500">ATP, Prota, Prosem, RPP</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/70 border border-slate-200">
                  <div className="text-xl font-black text-emerald-800">Siklus 3M</div>
                  <div className="text-[11px] font-medium text-slate-500">Memahami, Aplikasi, Refleksi</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/70 border border-slate-200">
                  <div className="text-xl font-black text-emerald-800">Panca Cinta</div>
                  <div className="text-[11px] font-medium text-slate-500">5 Pilar Karakter KBC</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/70 border border-slate-200">
                  <div className="text-xl font-black text-emerald-800">KMA 1503</div>
                  <div className="text-[11px] font-medium text-slate-500">Regulasi Resmi Kemenag</div>
                </div>
              </div>
            </div>

            {/* Kolom Visual & Ikon Bergerak (5 Kolom) */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[460px] sm:min-h-[500px]">
              {/* Cincin Orbit Berputar Lambat */}
              <div className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full border border-dashed border-emerald-300/80 animate-spin-slow pointer-events-none" />
              <div className="absolute w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-emerald-200/50 pointer-events-none" />

              {/* CENTERPIECE: LOGO RESMI MADRASAH DENGAN PULSE GLOW */}
              <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white shadow-2xl p-4 border-2 border-emerald-500 animate-pulse-glow flex items-center justify-center">
                <Image
                  src="/logo-mts.png"
                  alt="Logo MTs KH A Wahab Muhsin"
                  width={150}
                  height={150}
                  className="object-contain"
                  priority
                />
              </div>

              {/* ================================================================= */}
              {/* IKON BERGERAK 1: ANALISIS CP & ATP (Melayang Kiri Atas) */}
              {/* ================================================================= */}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 animate-float-slow">
                <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl shadow-lg border border-emerald-100 hover:scale-105 transition-transform cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Analisis CP & ATP
                    </span>
                    <span className="block text-[10px] text-emerald-700 font-semibold">
                      Fase D • Alur Belajar
                    </span>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* IKON BERGERAK 2: PROTA & PROSEM (Melayang Kanan Atas) */}
              {/* ================================================================= */}
              <div className="absolute top-0 right-2 sm:top-2 sm:right-2 z-20 animate-float-reverse">
                <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl shadow-lg border border-amber-100 hover:scale-105 transition-transform cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Prota & Prosem
                    </span>
                    <span className="block text-[10px] text-amber-700 font-semibold">
                      Distribusi Pekan & JP
                    </span>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* IKON BERGERAK 3: MODUL AJAR KBC (Melayang Kiri Bawah) */}
              {/* ================================================================= */}
              <div className="absolute bottom-6 left-0 sm:bottom-8 sm:left-2 z-20 animate-float-fast">
                <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl shadow-lg border border-rose-100 hover:scale-105 transition-transform cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Modul Ajar KBC
                    </span>
                    <span className="block text-[10px] text-rose-700 font-semibold">
                      Sintaks 3M & Nilai Cinta
                    </span>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* IKON BERGERAK 4: SUPERVISI & VALIDASI (Melayang Kanan Bawah) */}
              {/* ================================================================= */}
              <div className="absolute bottom-4 right-0 sm:bottom-6 sm:right-2 z-20 animate-float-slow">
                <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl shadow-lg border border-blue-100 hover:scale-105 transition-transform cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Validasi Digital
                    </span>
                    <span className="block text-[10px] text-blue-700 font-semibold">
                      Kepala MTs & Waka
                    </span>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* IKON BERGERAK 5: CETAK & EKSPOR RESMI (Melayang Tengah Bawah) */}
              {/* ================================================================= */}
              <div className="absolute -bottom-6 sm:-bottom-8 z-20 animate-float-reverse">
                <div className="flex items-center gap-2 bg-emerald-800 text-white px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-600 text-xs font-bold">
                  <Printer className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Siap Cetak PDF & DOCX Standar Kemenag</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4 PILAR PERANGKAT PEMBELAJARAN */}
      {/* ========================================================================= */}
      <section id="fitur" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 uppercase tracking-wider text-[11px]">
              Arsitektur Dokumen Guru
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4 Pilar Dokumen Administrasi Pembelajaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Disusun secara berurutan dan terintegrasi otomatis agar memudahkan guru madrasah dalam merencanakan pembelajaran yang mendalam, bermakna, dan menggembirakan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: ATP */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">
                1. Analisis CP & ATP
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemetaan elemen Capaian Pembelajaran Fase D, perumusan Tujuan Pembelajaran (TP), dan alur bertahap antar tingkat kelas (VII, VIII, IX).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bank Data KMA 1503</span>
              </div>
            </div>

            {/* Card 2: Prota */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CalendarRange className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">
                2. Program Tahunan (Prota)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kalkulasi pekan efektif semester ganjil dan genap, alokasi jam pelajaran (JP), dan distribusi cadangan waktu evaluasi madrasah.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kalkulasi Otomatis JP</span>
              </div>
            </div>

            {/* Card 3: Prosem */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LayoutList className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">
                3. Program Semester (Prosem)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Matriks distribusi materi dan alokasi JP per pekan kalender pendidikan MTs KH A Wahab Muhsin, siap ditelaah dan diekspor.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-blue-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matriks Pekan Kalender</span>
              </div>
            </div>

            {/* Card 4: Modul Ajar (RPP) KBC */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1.5">
                4. Modul Ajar / RPP KBC
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Desain pembelajaran mendalam siklus 3M (Memahami, Mengaplikasi, Merefleksi) terintegrasi Panca Cinta, asesmen, dan LKPD proyek/praktik.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-rose-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Format Tabel 3.5 & 3.6 KBC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SIKLUS 3M & KURIKULUM BERBASIS CINTA (KBC) */}
      {/* ========================================================================= */}
      <section id="siklus-3m" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[11px]">
                Pedagogi Pembelajaran Mendalam
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Siklus 3M yang Berkesadaran, Bermakna, dan Menggembirakan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Setiap RPP di MTs KH A Wahab Muhsin dirancang agar tidak hanya mengejar ketuntasan materi, tetapi menghidupkan pengalaman batin dan intelektual murid melalui 3 tahapan pembelajaran:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Memahami (Understanding)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Eksplorasi konsep esensial dengan kesadaran penuh (mindful) dan pertanyaan pemantik yang merangsang nalar kritis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Mengaplikasi (Applying)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Penerapan konsep secara kontekstual melalui proyek kolaboratif, penyelidikan, unjuk karya, dan studi kasus nyata.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Merefleksi (Reflecting)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Evaluasi pengalaman belajar dan pemaknaan hikmah spiritual untuk menumbuhkan komitmen pengamalan akhlakul karimah.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panca Cinta Cards Grid */}
            <div id="panca-cinta" className="lg:col-span-7">
              <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    5 Pilar Nilai Karakter Panca Cinta (KBC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fondasi karakter yang terinternalisasi di setiap langkah RPP dan rubrik asesmen murid madrasah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="font-bold text-xs text-emerald-950 block">[PC1] Cinta Allah dan Rasul</span>
                    <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                      Menumbuhkan tauhid, ketulusan niat, dan kesadaran ibadah dalam setiap kegiatan belajar.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                    <span className="font-bold text-xs text-blue-950 block">[PC2] Cinta Ilmu</span>
                    <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                      Rasa ingin tahu yang tinggi, kegemaran membaca, riset kritis, dan adab memuliakan guru.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
                    <span className="font-bold text-xs text-rose-950 block">[PC3] Cinta Diri dan Sesama</span>
                    <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                      Menjaga integritas pribadi, empati sosial, gotong royong, dan budaya saling memuliakan teman.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
                    <span className="font-bold text-xs text-teal-950 block">[PC4] Cinta Lingkungan</span>
                    <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                      Kepedulian terhadap kebersihan madrasah, pelestarian alam sekitar, dan gaya hidup ramah bumi.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 sm:col-span-2">
                    <span className="font-bold text-xs text-amber-950 block">[PC5] Cinta Bangsa</span>
                    <span className="text-[11px] text-slate-600 leading-snug block mt-0.5">
                      Jiwa nasionalisme, moderasi beragama, dan kontribusi nyata bagi kemajuan umat dan Negara Kesatuan Republik Indonesia.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ALUR SUPERVISI & VALIDASI DIGITAL BERJENJANG */}
      {/* ========================================================================= */}
      <section id="validasi" className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-[11px]">
              Alur Supervisi Akademik
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Proses Validasi Terstruktur & Berjenjang
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Menjamin kepatuhan dokumen kurikulum dengan standar Kemenag sebelum disahkan secara resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Guru Menyusun</h4>
              <p className="text-xs text-slate-600">
                Penyusunan dokumen dengan panduan instan, sintaks pedagogi, dan bank data materi KBC.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-black flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Pengajuan Validasi</h4>
              <p className="text-xs text-slate-600">
                Pengiriman dokumen secara digital ke validator madrasah dengan riwayat timeline transparan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Telaah & Catatan</h4>
              <p className="text-xs text-slate-600">
                Waka Kurikulum menelaah indikator kelayakan dan memberikan catatan pembinaan bila perlu perbaikan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-black flex items-center justify-center mx-auto text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900">Persetujuan & Cetak</h4>
              <p className="text-xs text-slate-600">
                Pengesahan resmi Kepala Madrasah, siap diekspor ke format DOCX atau cetak PDF ber-KOP resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM CTA BANNER */}
      {/* ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 mx-auto flex items-center justify-center shadow-lg">
            <Image
              src="/logo-mts.png"
              alt="Logo MTs"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            Siap Menyusun Perangkat Pembelajaran?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Masuk dengan akun terdaftar guru atau tim kurikulum MTs KH A Wahab Muhsin untuk memulai penyusunan administrasi semester ini.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className={
                buttonVariants({ size: "lg" }) +
                " bg-white hover:bg-slate-100 text-emerald-900 font-black text-sm rounded-xl px-8 h-12 shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
              }
            >
              <span>Buka Portal Pembelajaran</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Info Madrasah */}
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shrink-0 flex items-center justify-center">
                  <Image
                    src="/logo-mts.png"
                    alt="Logo MTs KH A Wahab Muhsin"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">MTs KH A Wahab Muhsin</h4>
                  <p className="text-[11px] text-emerald-400">Madrasah Tsanawiyah Terakreditasi A</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Jl. Sukahideng No. 01, Desa Sukarame, Kecamatan Sukarame, Kabupaten Tasikmalaya, Jawa Barat.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-amber-400">
                <span>IMAN</span>
                <span>•</span>
                <span>ISLAM</span>
                <span>•</span>
                <span>IHSAN</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Tautan Cepat
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <Link href="/login" className="hover:text-emerald-400 transition-colors">
                    Login Guru & Staf
                  </Link>
                </li>
                <li>
                  <a href="#fitur" className="hover:text-emerald-400 transition-colors">
                    Alur 4 Perangkat Ajar
                  </a>
                </li>
                <li>
                  <a href="#siklus-3m" className="hover:text-emerald-400 transition-colors">
                    Pedagogi Siklus 3M
                  </a>
                </li>
                <li>
                  <a href="#panca-cinta" className="hover:text-emerald-400 transition-colors">
                    Nilai Karakter Panca Cinta
                  </a>
                </li>
              </ul>
            </div>

            {/* Regulasi */}
            <div className="md:col-span-3 space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Landasan Regulasi
              </h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Keputusan Menteri Agama (KMA) Nomor 1503 Tahun 2025 tentang Pedoman Kurikulum Madrasah & Petunjuk Teknis Kurikulum Berbasis Cinta (KBC).
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>
              © {new Date().getFullYear()} MTs KH A Wahab Muhsin Tasikmalaya. Hak cipta dilindungi.
            </span>
            <span className="text-emerald-500 font-semibold">
              Sistem Perangkat Pembelajaran Terpadu Fase D
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
