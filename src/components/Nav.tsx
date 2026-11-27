"use client";
import Link from "next/link"; import { usePathname } from "next/navigation";
const items = [["/", "Cari guru"], ["/hub", "Lesson hub"], ["/tutor", "Untuk tutor"]];
export function Nav() {
  const p = usePathname();
  return (<nav className="flex gap-1 text-sm">{items.map(([h, l]) => <Link key={h} href={h} aria-current={p === h ? "page" : undefined}
    className={`flex min-h-target items-center rounded-md px-3 ${p === h ? "bg-sunken-strong font-medium" : "text-subtle hover:bg-sunken"}`}>{l}</Link>)}</nav>);
}
