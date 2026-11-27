"use client";
import { useEffect, useState } from "react";
import { TutorCard, TutorView } from "@/components/TutorCard";
const AREAS = ["Tebet", "Kebayoran Baru"]; const SUBJECTS = ["Matematika", "Fisika", "Kimia", "Biologi", "IPA", "Bahasa Inggris", "Bahasa Indonesia", "Calistung", "UTBK"]; const LEVELS = ["SD", "SMP", "SMA", "Umum"];
export default function Home() {
  const [f, setF] = useState({ area: "", subject: "", level: "", mode: "" });
  const [tutors, setTutors] = useState<TutorView[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(); fetch("/api/tutors?" + q).then((r) => r.json()).then(setTutors); }, [f]);
  const toggle = (id: string) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  const Sel = ({ k, label, opts }: { k: keyof typeof f; label: string; opts: string[] }) => (
    <div><label className="label" htmlFor={k}>{label}</label><select id={k} className="field" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">Semua</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>);
  return (<>
    <section className="rise mb-8 rounded-xl2 bg-pine-900 p-6 text-white sm:p-10">
      <p className="mb-2 text-sm font-semibold text-saffron-400">Gratis untuk orang tua</p>
      <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">Guru les privat,<br />dekat rumah Anda.</h1>
      <p className="mt-3 max-w-xl text-pine-100">Bandingkan CV tutor terverifikasi, kirim permintaan ke maksimal 3 tutor, lalu lanjut di WhatsApp. Tanpa biaya, tanpa komisi.</p>
    </section>
    <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
      <Sel k="area" label="Area" opts={AREAS} /><Sel k="subject" label="Mata pelajaran" opts={SUBJECTS} /><Sel k="level" label="Jenjang" opts={LEVELS} />
      <Sel k="mode" label="Mode" opts={["home", "online"]} />
    </div>
    <p className="mb-3 text-sm text-ink/60" aria-live="polite">{tutors ? `${tutors.length} tutor cocok` : "Memuat…"} · nama, foto & nomor WhatsApp disamarkan sampai tutor merespons</p>
    {tutors && tutors.length === 0 && <div className="card p-8 text-center text-ink/70">Belum ada tutor di filter ini. Coba ubah area atau mata pelajaran.</div>}
    <div className="grid gap-4 sm:grid-cols-2">{tutors?.map((t) => <TutorCard key={t.id} t={t} selected={sel.includes(t.id)} onToggle={() => toggle(t.id)} disabled={sel.length >= 3} />)}</div>
    {sel.length > 0 && (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 p-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <span className="text-sm"><b>{sel.length}/3</b> tutor dipilih</span>
        <button className="btn-primary" onClick={() => setOpen(true)}>Kirim permintaan gratis →</button></div></div>)}
    {open && <RequestForm ids={sel} area={f.area} subject={f.subject} level={f.level} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setDone(true); setSel([]); }} />}
    {done && <div role="status" className="fixed inset-x-4 top-20 z-40 mx-auto max-w-md rounded-xl2 bg-pine-600 p-4 text-white shadow-card">✓ Permintaan terkirim. Aktif 14 hari — tutor akan menghubungi Anda lewat WhatsApp. <button className="ml-2 underline" onClick={() => setDone(false)}>Tutup</button></div>}
  </>);
}
function RequestForm({ ids, area, subject, level, onClose, onDone }: { ids: string[]; area: string; subject: string; level: string; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ parentName: "", whatsapp: "", subject: subject || "Matematika", level: level || "SMP", area: area || "Tebet", note: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/requests", { method: "POST", body: JSON.stringify({ ...v, tutorIds: ids }) }); setBusy(false);
    r.ok ? onDone() : setErr((await r.json()).error); }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (<div className="fixed inset-0 z-40 grid place-items-end bg-ink/50 sm:place-items-center" role="dialog" aria-modal="true" aria-label="Kirim permintaan">
    <form onSubmit={submit} className="card rise w-full max-w-md space-y-3 rounded-b-none p-5 sm:rounded-b-xl2">
      <h2 className="font-display text-xl font-bold">Permintaan ke {ids.length} tutor</h2>
      <div><label className="label">Nama</label><input required className="field" value={v.parentName} onChange={set("parentName")} placeholder="Ibu Ratna" /></div>
      <div><label className="label">WhatsApp</label><input required inputMode="tel" pattern="[0-9+ ]{9,16}" className="field" value={v.whatsapp} onChange={set("whatsapp")} placeholder="0812…" /><p className="mt-1 text-xs text-ink/50">Hanya dibuka untuk tutor yang membuka permintaan ini (maks. 10).</p></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label">Mapel</label><select className="field" value={v.subject} onChange={set("subject")}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label">Jenjang</label><select className="field" value={v.level} onChange={set("level")}>{LEVELS.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label">Area</label><select className="field" value={v.area} onChange={set("area")}>{AREAS.map((s) => <option key={s}>{s}</option>)}</select></div></div>
      <div><label className="label">Catatan</label><textarea className="field" rows={3} value={v.note} onChange={set("note")} placeholder="Kelas, kesulitan, jadwal…" /></div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Batal</button><button className="btn-primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim gratis"}</button></div>
    </form></div>);
}
