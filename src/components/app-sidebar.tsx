"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  LayoutList,
  FileText,
  CheckSquare,
  Database,
  Library,
  Settings,
  GraduationCap,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/database";

interface AppSidebarProps {
  userEmail?: string;
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  }

  const mainNav = [
    {
      title: "Beranda",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Analisis CP & ATP",
      href: "/atp",
      icon: BookOpen,
    },
    {
      title: "Prota",
      href: "/prota",
      icon: Calendar,
    },
    {
      title: "Prosem",
      href: "/prosem",
      icon: LayoutList,
    },
    {
      title: "RPP / Modul Ajar",
      href: "/modul-ajar",
      icon: FileText,
    },
  ];

  const userRole = profile?.role ?? "guru";

  interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const adminNav: NavItem[] = [];
  if (userRole === "admin" || userRole === "kepala" || userRole === "waka_kurikulum") {
    adminNav.push({
      title: "Validasi",
      href: "/validasi",
      icon: CheckSquare,
      badge: "Persetujuan",
    });
  }
  if (userRole === "admin" || userRole === "waka_kurikulum") {
    adminNav.push({
      title: "Bank Data Fase D",
      href: "/master-data/bank-data",
      icon: Library,
      badge: "Kemenag",
    });
  }
  if (userRole === "admin") {
    adminNav.push({
      title: "Master Data",
      href: "/master-data",
      icon: Database,
      badge: "Admin",
    });
  }

  const systemNav = [
    {
      title: "Pengaturan",
      href: "/pengaturan",
      icon: Settings,
    },
  ];

  // Prefetch rute navigasi utama di latar belakang agar tersimpan di memori browser (Client Cache)
  React.useEffect(() => {
    const routesToPrefetch = [
      ...mainNav.map((n) => n.href),
      ...adminNav.map((n) => n.href),
      ...systemNav.map((n) => n.href),
    ];
    routesToPrefetch.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        // Abaikan jika prefetch gagal di browser tertentu
      }
    });
  }, [router, userRole]);

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      {/* Header Madrasah */}
      <SidebarHeader className="border-b border-slate-200 p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-base shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-semibold text-sm text-slate-900 tracking-tight truncate">
              Perangkat Ajar KBC
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              MTs KH A Wahab Muhsin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigasi Dokumen & Menu */}
      <SidebarContent>
        {/* Menu Utama */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider px-3">
            Perangkat Pembelajaran
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem
                    key={item.href}
                    onMouseEnter={() => {
                      try {
                        router.prefetch(item.href);
                      } catch {}
                    }}
                  >
                    <SidebarMenuButton
                      render={<Link href={item.href} prefetch={true} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 hover:text-emerald-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    >
                      <Icon className={isActive ? "text-emerald-700" : "text-slate-400"} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Khusus Verifikasi & Admin (Hanya tampil jika memiliki hak akses) */}
        {adminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider px-3">
              Pengawasan & Kelola
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem
                      key={item.href}
                      onMouseEnter={() => {
                        try {
                          router.prefetch(item.href);
                        } catch {}
                      }}
                    >
                      <SidebarMenuButton
                        render={<Link href={item.href} prefetch={true} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className={
                          isActive
                            ? "bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 hover:text-emerald-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      >
                        <Icon className={isActive ? "text-emerald-700" : "text-slate-400"} />
                        <span>{item.title}</span>
                        <SidebarMenuBadge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 h-4 bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {item.badge}
                          </Badge>
                        </SidebarMenuBadge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Konfigurasi */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider px-3">
            Sistem
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem
                    key={item.href}
                    onMouseEnter={() => {
                      try {
                        router.prefetch(item.href);
                      } catch {}
                    }}
                  >
                    <SidebarMenuButton
                      render={<Link href={item.href} prefetch={true} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 hover:text-emerald-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    >
                      <Icon className={isActive ? "text-emerald-700" : "text-slate-400"} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Info Madrasah & Logout */}
      <SidebarFooter className="border-t border-slate-200 p-3 group-data-[collapsible=icon]:hidden space-y-2">
        <div className="rounded-md bg-slate-50 border border-slate-100 p-2.5 text-xs">
          <p className="font-semibold text-slate-800">
            {profile?.role ? profile.role.replace("_", " ").toUpperCase() : "GURU"} · KMA 1503/2025
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fase D (MTs) · MTs KH A Wahab Muhsin
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun (Logout)</span>
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
