"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  PanelLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/types/database";

interface AppHeaderProps {
  userEmail?: string;
  profile: Profile | null;
}

const routeTitles: Record<string, string> = {
  "/": "Beranda",
  "/dashboard": "Dashboard",
  "/atp": "Analisis CP & ATP",
  "/prota": "Program Tahunan",
  "/prosem": "Program Semester",
  "/modul-ajar": "RPP / Modul Ajar",
  "/validasi": "Validasi Perangkat Ajar",
  "/master-data": "Master Data Regulasi",
  "/pengaturan": "Pengaturan",
  "/profil": "Profil Guru",
};

export function AppHeader({ userEmail, profile }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");

  const namaGuru = profile?.nama_lengkap ?? userEmail?.split("@")[0] ?? "Administrator";
  const initials = namaGuru
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const getRoleLabel = (r?: string) => {
    switch (r) {
      case "admin":
        return "Admin";
      case "kepala":
        return "Kepala Madrasah";
      case "waka_kurikulum":
        return "Waka Kurikulum";
      case "guru":
      default:
        return "Guru Pengampu";
    }
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    const q = encodeURIComponent(searchVal.trim());
    if (profile?.role === "admin" || profile?.role === "kepala" || profile?.role === "waka_kurikulum") {
      router.push(`/validasi?q=${q}`);
    } else {
      router.push(`/modul-ajar?q=${q}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6">
      {/* Kiri: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <SidebarTrigger className="text-slate-600 hover:text-slate-900 -ml-1 h-9 w-9 p-0 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors" />

        {/* Search Bar Input (Sesuai Desain Mockup) */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari menu, guru, mapel, atau dokumen..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-slate-100/90 hover:bg-slate-100 text-slate-800 placeholder:text-slate-400 text-xs rounded-full pl-10 pr-4 h-9.5 border-0 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          />
        </form>
      </div>

      {/* Kanan: Notifikasi & Profil User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Tombol Lonceng Notifikasi dengan Badge Merah */}
        <button
          type="button"
          onClick={() => toast.info("Tidak ada pemberitahuan baru saat ini.")}
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="Notifikasi"
        >
          <Bell className="w-4.5 h-4.5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full p-1 sm:px-2 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              />
            }
          >
            {/* Avatar Lingkaran Hijau Tua Sesuai Mockup */}
            <div className="h-9 w-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {initials}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {namaGuru}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                {getRoleLabel(profile?.role)}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white border border-slate-200 shadow-lg rounded-xl">
            <div className="px-3 py-2 text-xs text-slate-500 font-normal border-b border-slate-100 mb-1">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Masuk Sebagai
              </span>
              <strong className="text-slate-900 block truncate mt-0.5">{namaGuru}</strong>
              <span className="text-[11px] text-emerald-700 block truncate">{userEmail}</span>
            </div>
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href="/profil" className="flex items-center gap-2.5 w-full text-slate-700 text-xs font-medium py-2" />}
              >
                <User className="h-4 w-4 text-slate-400" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/pengaturan" className="flex items-center gap-2.5 w-full text-slate-700 text-xs font-medium py-2" />}
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Pengaturan Akun
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 text-xs font-semibold py-2 cursor-pointer rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Keluar Akun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
