"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

  const currentTitle = routeTitles[pathname] || "Perangkat Ajar";
  const namaGuru = profile?.nama_lengkap ?? userEmail?.split("@")[0] ?? "Guru";
  const initials = namaGuru
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-slate-600 hover:text-slate-900 -ml-1" />
        <Separator orientation="vertical" className="h-4 bg-slate-200" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href="/dashboard" />}
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-900"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathname !== "/dashboard" && pathname !== "/" && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs sm:text-sm font-medium text-slate-900">
                    {currentTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: User Profile Menu */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full p-1 hover:bg-slate-50 transition-colors focus:outline-none"
              />
            }
          >
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-900 leading-tight">
                {namaGuru}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight capitalize">
                {profile?.role ? profile.role.replace("_", " ") : "Guru"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-slate-200 shadow-md">
            <div className="px-2.5 py-2 text-xs text-slate-500 font-normal border-b border-slate-100 mb-1">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Akun Aktif</span>
              <strong className="text-slate-900 block truncate mt-0.5">{userEmail}</strong>
            </div>
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href="/profil" className="flex items-center gap-2 w-full text-slate-700 text-sm" />}
              >
                <User className="h-4 w-4 text-slate-400" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/pengaturan" className="flex items-center gap-2 w-full text-slate-700 text-sm" />}
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Pengaturan
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 text-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
