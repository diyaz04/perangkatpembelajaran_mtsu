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
    template: "%s | Perangkat Ajar KBC",
    default: "Perangkat Ajar KBC — MTs KH A Wahab Muhsin",
  },
  description:
    "Aplikasi penyusunan perangkat pembelajaran terintegrasi Kurikulum Berbasis Cinta (KBC) dan Pembelajaran Mendalam sesuai KMA 1503/2025 untuk MTs KH A Wahab Muhsin Tasikmalaya.",
  keywords: [
    "KBC",
    "Kurikulum Berbasis Cinta",
    "Perangkat Pembelajaran",
    "MTs",
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
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
