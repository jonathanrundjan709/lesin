import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Lesin — Guru les privat dekat rumah", description: "Orang tua cari guru gratis. Tutor bayar per lead. Tanpa komisi." };
export const viewport: Viewport = { themeColor: "#17705a", width: "device-width", initialScale: 1 };
const nav = [["/", "Cari guru"], ["/hub", "Lesson hub"], ["/tutor", "Untuk tutor"]];
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body>
    <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-pine-700"><img src="/icon.svg" alt="" className="h-7 w-7" />Lesin</Link>
        <nav className="flex gap-1 text-sm font-medium">{nav.map(([h, l]) => <Link key={h} href={h} className="rounded-full px-3 py-1.5 hover:bg-pine-100">{l}</Link>)}</nav>
      </div></header>
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">{children}</main>
    <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-ink/50">Lesin tidak memungut komisi atas biaya les. Percobaan pertama sebaiknya didampingi orang tua.</footer>
  </body></html>);
}
