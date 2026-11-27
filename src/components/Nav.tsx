"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
const items = [["/", "Cari guru"], ["/hub", "Lesson hub"], ["/tutor", "Untuk tutor"]];
export function Nav() {
  const p = usePathname();
  return (<nav className="flex gap-1 text-sm">{items.map(([h, l]) => <Link key={h} href={h} aria-current={p === h ? "page" : undefined}
    className={`rounded-md px-3 py-1.5 ${p === h ? "bg-stone-200 font-medium" : "text-stone-600 hover:bg-stone-100"}`}>{l}</Link>)}</nav>);
}
