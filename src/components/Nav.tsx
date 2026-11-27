"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
import { Search, CalendarDays, Briefcase } from "lucide-react";
const items = [["/", "Cari guru", Search], ["/hub", "Lesson hub", CalendarDays], ["/tutor", "Untuk tutor", Briefcase]] as const;
export function TopNav() {
  const p = usePathname();
  return (<nav aria-label="Utama" className="hidden gap-1 md:flex">{items.map(([h, l, Icon]) => <Link key={h} href={h} aria-current={p === h ? "page" : undefined}
    className={`flex min-h-target items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${p === h ? "bg-sunken text-accent" : "text-subtle hover:bg-sunken hover:text-ink"}`}><Icon size={18} aria-hidden />{l}</Link>)}</nav>);
}
export function BottomNav() {
  const p = usePathname();
  return (<nav aria-label="Utama" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
    {items.map(([h, l, Icon]) => <Link key={h} href={h} aria-current={p === h ? "page" : undefined}
      className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 text-xs font-medium ${p === h ? "text-accent" : "text-subtle"}`}><Icon size={22} aria-hidden strokeWidth={p === h ? 2.4 : 1.8} />{l}</Link>)}</nav>);
}
