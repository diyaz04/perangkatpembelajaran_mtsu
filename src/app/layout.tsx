import type { Metadata } from "next";
import { Inter as InterFont, Caveat as CaveatFont } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = InterFont({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = CaveatFont({
  subsets: ["latin"],
  variable: "--font-caveat",
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
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/logo-mts.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
      { url: "/logo-mts.png?v=2" },
    ],
  },
  manifest: "/manifest.json",
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
    <html lang="id" className={`${inter.variable} ${caveat.variable} ${inter.className}`}>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
