"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn, Menu, X, LayoutDashboard, Compass, Layers, Heart, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface LandingNavbarProps {
  user: { email?: string } | null;
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#fitur", label: "Alur Perangkat", icon: Compass },
    { href: "#siklus-3m", label: "Struktur 3M", icon: Layers },
    { href: "#panca-cinta", label: "Panca Cinta", icon: Heart },
    { href: "#validasi", label: "Supervisi Digital", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo & Identitas Madrasah */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
            <Image
              src="/logo-mts.png"
              alt="Logo MTs KH A Wahab Muhsin"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-xs sm:text-base tracking-tight text-slate-900 leading-tight truncate">
              MTs KH A Wahab Muhsin
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 leading-tight truncate">
              Sistem Perangkat Pembelajaran KBC
            </span>
          </div>
        </Link>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Tombol Aksi Desktop & Toggle Mobile */}
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className={
                buttonVariants({ size: "sm" }) +
                " bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm rounded-lg hidden sm:flex items-center gap-1.5 h-8 sm:h-9 px-3"
              }
            >
              <span>Dashboard Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className={
                buttonVariants({ size: "sm" }) +
                " bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm rounded-lg px-3 hidden sm:flex items-center gap-1.5 h-8 sm:h-9"
              }
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sistem</span>
            </Link>
          )}

          {/* Hamburger Menu Toggle Button (Mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  <Icon className="w-4 h-4 text-emerald-700" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard Perangkat</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Portal Guru</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
