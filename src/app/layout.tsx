import type { Metadata } from "next";
import { Inter as InterFont } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = InterFont({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Perangkat Pembelajaran MTs KH A Wahab Muhsin",
    default: "Perangkat Pembelajaran MTs KH A Wahab Muhsin",
  },
  description:
    "Sistem Perangkat Pembelajaran Terpadu MTs KH A Wahab Muhsin Tasikmalaya berbasis Kurikulum Berbasis Cinta (KBC) dan Pembelajaran Mendalam sesuai KMA 1503 Tahun 2025.",
  icons: {
    icon: "/logo-mts.png",
    shortcut: "/favicon.ico",
    apple: "/logo-mts.png",
  },
  keywords: [
    "Perangkat Pembelajaran MTs KH A Wahab Muhsin",
    "MTs KH A Wahab Muhsin",
    "KBC",
    "Kurikulum Berbasis Cinta",
    "KMA 1503",
    "ATP",
    "Prota",
    "Prosem",
    "Modul Ajar",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${inter.className}`}>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
