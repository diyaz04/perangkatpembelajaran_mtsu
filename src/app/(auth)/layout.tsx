import React from "react";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo madrasah di tengah */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-sm mb-3">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Perangkat Ajar KBC
          </h1>
          <p className="text-xs font-medium text-emerald-700 mt-0.5">
            MTs KH A Wahab Muhsin
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasikmalaya, Jawa Barat
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
