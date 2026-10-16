"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  School,
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
  useSidebar,
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
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  }

  const mainNav = [
    {
      title: "Dashboard",
      href: "/dashboard",
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

  React.useEffect(() => {
    const routesToPrefetch = [
      ...mainNav.map((n) => n.href),
      ...adminNav.map((n) => n.href),
      ...systemNav.map((n) => n.href),
    ];
    routesToPrefetch.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {}
    });
  }, [router, userRole]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#04281e] bg-[#063b2c] text-white"
    >
      {/* Watermark Siluet Kubah / Arsitektur Madrasah di Latar Bawah */}
      <div className="absolute -bottom-8 -left-6 w-48 h-56 pointer-events-none opacity-10 text-emerald-300">
        <svg viewBox="0 0 200 240" fill="currentColor" className="w-full h-full">
          <path d="M100 20 C85 60 40 85 40 130 L40 240 L160 240 L160 130 C160 85 115 60 100 20 Z" />
          <path d="M100 0 L103 15 L97 15 Z" />
          <circle cx="100" cy="18" r="4" />
          <path d="M70 140 C70 120 130 120 130 140 L130 240 L70 240 Z" fill="#04281e" />
          <path d="M20 120 C20 100 40 90 40 120 L40 240 L10 240 L10 130 Z" />
          <path d="M160 120 C160 90 180 100 180 120 L180 130 L190 240 L160 240 Z" />
        </svg>
      </div>

      {/* Header Madrasah Sesuai Mockup */}
      <SidebarHeader className="border-b border-[#04281e] p-4 bg-[#053326]/50">
        <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs overflow-hidden">
            <Image
              src="/logo-mts.png"
              alt="Logo MTs"
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-bold text-sm text-white tracking-tight truncate">
              Perangkat Pembelajaran
            </span>
            <span className="text-[11px] font-medium text-emerald-200/80 truncate">
              MTs KH A Wahab Muhsin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigasi Menu */}
      <SidebarContent className="px-2 py-3 space-y-4 relative z-10">
        {/* Menu Utama */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wider px-3 mb-1">
            Perangkat Pembelajaran
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} prefetch={true} />}
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={handleNavClick}
                      className={
                        isActive
                          ? "bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl shadow-xs px-3 py-2.5 h-10 transition-colors"
                          : "text-slate-200 hover:bg-emerald-900/60 hover:text-white rounded-xl px-3 py-2.5 h-10 transition-colors"
                      }
                    >
                      <Icon className={isActive ? "text-white" : "text-slate-300"} />
                      <span className="text-xs">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Khusus Verifikasi & Admin */}
        {adminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wider px-3 mb-1">
              Pengawasan & Kelola
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} prefetch={true} />}
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={handleNavClick}
                        className={
                          isActive
                            ? "bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl shadow-xs px-3 py-2.5 h-10 transition-colors"
                            : "text-slate-200 hover:bg-emerald-900/60 hover:text-white rounded-xl px-3 py-2.5 h-10 transition-colors"
                        }
                      >
                        <Icon className={isActive ? "text-white" : "text-slate-300"} />
                        <span className="text-xs">{item.title}</span>
                        <SidebarMenuBadge>
                          <span className="text-[10px] font-medium py-0.5 px-2 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                            {item.badge}
                          </span>
                        </SidebarMenuBadge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Konfigurasi Sistem */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wider px-3 mb-1">
            Sistem
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} prefetch={true} />}
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={handleNavClick}
                      className={
                        isActive
                          ? "bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-xl shadow-xs px-3 py-2.5 h-10 transition-colors"
                          : "text-slate-200 hover:bg-emerald-900/60 hover:text-white rounded-xl px-3 py-2.5 h-10 transition-colors"
                      }
                    >
                      <Icon className={isActive ? "text-white" : "text-slate-300"} />
                      <span className="text-xs">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Info Madrasah & Logout Sesuai Mockup */}
      <SidebarFooter className="border-t border-[#04281e] p-3 group-data-[collapsible=icon]:hidden space-y-2.5 relative z-10 bg-[#053326]/50">
        <div className="rounded-xl bg-[#04281e]/90 border border-emerald-800/80 p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <School className="w-4 h-4" />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-bold text-xs text-white leading-tight uppercase truncate">
              {profile?.role ? profile.role.replace("_", " ") : "ADMIN"} - KMA 1503/2025
            </p>
            <p className="text-[11px] text-emerald-200/90 leading-tight mt-1">
              Fase D (MTs) · MTs KH A Wahab Muhsin
            </p>
          </div>
        </div>

        {/* Tombol Logout Maroon Gelap Sesuai Mockup */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-200 hover:text-white bg-[#4a1c24] hover:bg-[#5c232c] border border-rose-900/70 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun (Logout)</span>
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
