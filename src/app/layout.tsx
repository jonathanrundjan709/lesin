import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { TopNav, BottomNav } from "@/components/Nav";
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = { title: "Lesin — Guru les privat dekat rumah", description: "Orang tua cari guru gratis. Tutor bayar per lead. Tanpa komisi." };
export const viewport: Viewport = { themeColor: "#5b4bff", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="id" className={font.variable}><body className="font-sans">
    <header className="border-b border-line bg-surface"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
      <Link href="/" className="flex min-h-target items-center gap-2 text-lg font-bold text-accent"><img src="/icon.svg" alt="" className="h-7 w-7" />Lesin</Link><TopNav /></div></header>
    <main className="mx-auto max-w-3xl px-4 pb-40 pt-6 md:pb-28">{children}</main>
    <BottomNav />
  </body></html>);
}
