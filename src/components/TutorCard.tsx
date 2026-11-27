"use client";
export interface TutorView { id: string; subjects: string[]; levels: string[]; area: string; rate: number; education: string; years: number; rating: number; reviews: number; verified: boolean; plan: boolean; match: number; bio: string; mode: string[] }
export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
export function TutorCard({ t, selected, onToggle, disabled }: { t: TutorView; selected: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <article className={`card rise p-4 transition ${selected ? "ring-2 ring-pine-500" : ""}`}>
      <div className="flex items-start gap-3">
        <div aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pine-100 text-pine-700 blur-[2px] select-none">🎓</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Tutor {t.area}</h3>
            {t.verified && <span className="chip">✓ Terverifikasi</span>}
            {t.plan && <span className="chip bg-saffron-100 text-ink">Pro</span>}
          </div>
          <p className="text-sm text-ink/65">{t.education} · {t.years} th mengajar</p>
        </div>
        <div className="text-right"><div className="text-lg font-bold text-pine-700">{t.match}%</div><div className="text-[11px] text-ink/50">cocok</div></div>
      </div>
      <p className="mt-3 text-sm text-ink/80">{t.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{t.subjects.map((s) => <span key={s} className="chip">{s}</span>)}{t.levels.map((s) => <span key={s} className="chip bg-ink/5 text-ink/70">{s}</span>)}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm"><b>★ {t.rating}</b> <span className="text-ink/50">({t.reviews})</span> · <b>{rp(t.rate)}</b><span className="text-ink/50">/sesi</span></div>
        <button className={selected ? "btn-primary" : "btn-ghost"} onClick={onToggle} disabled={disabled && !selected} aria-pressed={selected}>{selected ? "✓ Dipilih" : "Pilih"}</button>
      </div>
    </article>);
}
