"use client";
export interface TutorView { id: string; subjects: string[]; levels: string[]; area: string; rate: number; education: string; years: number; rating: number; reviews: number; verified: boolean; plan: boolean; match: number; bio: string; mode: string[] }
export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
export function TutorRow({ t, selected, onToggle, disabled }: { t: TutorView; selected: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <li className={`panel flex flex-wrap items-center gap-x-4 gap-y-3 p-4 ${selected ? "border-accent ring-1 ring-accent" : ""}`}>
      <div className="min-w-0 basis-full flex-1 sm:basis-0">
        <p className="font-medium">{t.subjects.join(", ")} <span className="font-normal text-subtle">· {t.area}</span></p>
        <p className="muted">{t.education} · {t.years} th · ★ {t.rating} ({t.reviews}){t.verified ? " · Terverifikasi" : ""}</p>
        <p className="mt-1.5 flex flex-wrap gap-1">{t.levels.map((l) => <span key={l} className="tag">{l}</span>)}</p>
      </div>
      <p className="flex-1 sm:flex-none sm:text-right"><span className="text-base font-semibold">{rp(t.rate)}</span><span className="text-xs text-subtle"> / sesi</span></p>
      <button className={selected ? "btn-primary w-28" : "btn-secondary w-28"} onClick={onToggle} disabled={disabled && !selected} aria-pressed={selected}>{selected ? "Dipilih" : "Pilih"}</button>
    </li>);
}
