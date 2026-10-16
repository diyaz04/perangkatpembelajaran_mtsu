"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

interface DashboardHeroBannerProps {
  nama: string;
  roleLabel?: string;
  imageSrc?: string;
}

export function DashboardHeroBanner({
  nama,
  roleLabel = "Administrator",
  imageSrc = "/banner-madrasah.png",
}: DashboardHeroBannerProps) {
  // Format first name or title nicely
  const displayName = nama || roleLabel;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-[#d8f3e5] via-[#e8f7ee] to-[#edf9f3] p-5 sm:p-7 md:p-8 shadow-xs">
      {/* Gambar Madrasah di Sisi Kanan dengan Fade Gradien Halus */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 md:w-[48%] pointer-events-none select-none overflow-hidden hidden sm:block">
        <div className="relative w-full h-full">
          {/* Masking Gradient dari kiri ke kanan agar foto menyatu alami dengan background hijau muda */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,1) 50%)",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,1) 50%)",
            }}
          >
            <Image
              src={imageSrc}
              alt="Gedung MTs KH A Wahab Muhsin"
              fill
              className="object-cover object-right-top opacity-95"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Subtle green overlay tone */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#d8f3e5]/70 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Konten Hero Kiri */}
      <div className="relative z-10 max-w-2xl space-y-4">
        {/* Badge Fase & Kurikulum */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/10 text-emerald-800 border border-emerald-600/20 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Fase D · KBC
        </div>

        {/* Judul & Salam */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Assalamu&apos;alaikum, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Sistem Administrasi Pembelajaran Kurikulum Berbasis Cinta (KBC) · MTs KH A Wahab Muhsin
          </p>
        </div>

        {/* Tulisan Cursive / Slogan "Bersama Mewujudkan Pendidikan Berkualitas" */}
        <div className="pt-0.5">
          <p className="font-script text-lg sm:text-2xl font-bold text-emerald-800 tracking-wide select-none -rotate-1 origin-left">
            Bersama Mewujudkan Pendidikan Berkualitas
          </p>
        </div>

        {/* Card Putih Sambutan Bawah */}
        <div className="pt-1">
          <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-xl p-2.5 sm:p-3 shadow-xs border border-white/90 max-w-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                Ahlan wa Sahlan di Dashboard Terpadu Perangkat Pembelajaran KMA 1503/2025
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Panel Terintegrasi Guru & Pimpinan MTs KH A Wahab Muhsin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
