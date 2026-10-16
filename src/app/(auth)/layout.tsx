import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo madrasah di tengah */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-md p-2 mb-3 border border-emerald-100 hover:scale-105 transition-transform"
          >
            <Image
              src="/logo-mts.png"
              alt="Logo MTs KH A Wahab Muhsin"
              width={72}
              height={72}
              className="object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Sistem Perangkat Pembelajaran
          </h1>
          <p className="text-sm font-bold text-emerald-800 mt-0.5">
            MTs KH A Wahab Muhsin
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Sukahideng, Sukarame, Tasikmalaya
          </p>
        </div>

        {children}

        {/* Link kembali ke Halaman Awal */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-700 gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
