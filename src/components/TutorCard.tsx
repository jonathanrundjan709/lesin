"use client";
import { Atom, BadgeCheck, Calculator, Check, FlaskConical, GraduationCap, Languages, Leaf, Microscope, Plus, Shapes, Star, type LucideIcon } from "lucide-react";
export interface TutorView { id: string; subjects: string[]; levels: string[]; area: string; rate: number; education: string; years: number; rating: number; reviews: number; verified: boolean; plan: boolean; match: number; bio: string; mode: string[] }
export const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
const ICONS: Record<string, LucideIcon> = { Matematika: Calculator, Fisika: Atom, Kimia: FlaskConical, Biologi: Leaf, IPA: Microscope, "Bahasa Inggris": Languages, "Bahasa Indonesia": Languages, Calistung: Shapes, UTBK: GraduationCap };
export function SubjectIcon({ subject, size = 22 }: { subject: string; size?: number }) { const I = ICONS[subject] ?? GraduationCap; return <I size={size} aria-hidden />; }
export function TutorRow({ t, selected, onToggle, disabled }: { t: TutorView; selected: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <li className={`panel row-hover flex flex-wrap items-center gap-x-4 gap-y-3 p-4 ${selected ? "border-accent ring-2 ring-accent" : ""}`}>
      <div className="flex min-w-0 flex-1 basis-full items-start gap-3 sm:basis-0">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-sunken text-accent"><SubjectIcon subject={t.subjects[0]} /></span>
        <div className="min-w-0">
          <p className="font-semibold">{t.subjects.join(", ")}</p>
          <p className="muted">{t.area} · {t.education}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold"><Star size={15} className="fill-star text-star" aria-hidden />{t.rating}<span className="font-normal text-subtle">({t.reviews})</span></span>
            <span className="text-subtle">{t.years} th mengajar</span>
            {t.verified && <span className="inline-flex items-center gap-1 font-medium text-accent"><BadgeCheck size={16} aria-hidden />Terverifikasi</span>}
          </p>
          <p className="mt-2 flex flex-wrap gap-1.5">{t.levels.map((l) => <span key={l} className="tag">{l}</span>)}</p>
        </div>
      </div>
      <p className="flex-1 sm:flex-none sm:text-right"><span className="text-lg font-bold">{rp(t.rate)}</span><span className="text-xs text-subtle"> / sesi</span></p>
      <button className={`${selected ? "btn-primary" : "btn-secondary"} w-32`} onClick={onToggle} disabled={disabled && !selected} aria-pressed={selected}>
        {selected ? <><Check size={18} aria-hidden />Dipilih</> : <><Plus size={18} aria-hidden />Pilih</>}</button>
    </li>);
}
