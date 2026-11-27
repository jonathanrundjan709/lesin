"use client";
export interface TutorView { id: string; subjects: string[]; levels: string[]; area: string; rate: number; education: string; years: number; rating: number; reviews: number; verified: boolean; plan: boolean; match: number; bio: string; mode: string[] }
export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
export function TutorRow({ t, selected, onToggle, disabled }: { t: TutorView; selected: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <li className={`panel flex items-center gap-4 p-4 ${selected ? "border-teal-700 ring-1 ring-teal-700" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t.subjects.join(", ")} <span className="font-normal text-stone-500">· {t.area}</span></p>
        <p className="muted">{t.education} · {t.years} th · ★ {t.rating} ({t.reviews}){t.verified ? " · Terverifikasi" : ""}</p>
        <p className="mt-1.5 flex flex-wrap gap-1">{t.levels.map((l) => <span key={l} className="tag">{l}</span>)}</p>
      </div>
      <div className="text-right"><p className="font-semibold">{rp(t.rate)}</p><p className="text-xs text-stone-500">per sesi</p></div>
      <button className={selected ? "btn-primary w-24" : "btn-secondary w-24"} onClick={onToggle} disabled={disabled && !selected} aria-pressed={selected}>{selected ? "Dipilih" : "Pilih"}</button>
    </li>);
}
