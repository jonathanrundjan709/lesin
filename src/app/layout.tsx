import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
export const metadata: Metadata = { title: "Lesin — Guru les privat dekat rumah", description: "Orang tua cari guru gratis. Tutor bayar per lead. Tanpa komisi." };
export const viewport: Viewport = { themeColor: "#0f766e", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body>
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
      <Link href="/" className="text-lg font-semibold text-teal-700">Lesin</Link><Nav /></div></header>
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">{children}</main>
  </body></html>);
}
