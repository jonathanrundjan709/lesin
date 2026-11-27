"use client";
import { useEffect, useState } from "react";
import { TutorRow, TutorView } from "@/components/TutorCard";
import { HandCoins, MessageCircle, ShieldCheck, SearchX, CheckCircle2 } from "lucide-react";
const AREAS = ["Tebet", "Kebayoran Baru"]; const SUBJECTS = ["Matematika", "Fisika", "Kimia", "Biologi", "IPA", "Bahasa Inggris", "Bahasa Indonesia", "Calistung", "UTBK"]; const LEVELS = ["SD", "SMP", "SMA", "Umum"];
export default function Home() {
  const [f, setF] = useState({ area: "", subject: "", level: "" });
  const [tutors, setTutors] = useState<TutorView[] | null>(null);
  const [sel, setSel] = useState<string[]>([]); const [open, setOpen] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(); fetch("/api/tutors?" + q).then((r) => r.json()).then(setTutors); }, [f]);
  const toggle = (id: string) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  const Sel = ({ k, label, opts }: { k: keyof typeof f; label: string; opts: string[] }) => (
    <div><label className="label" htmlFor={k}>{label}</label><select id={k} className="field" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">Semua</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>);
  return (<>
    <h1 className="h1">Cari guru les privat dekat rumah</h1>
    <p className="muted mt-1 text-base">Pilih sampai 3 tutor, kirim satu permintaan, lanjut di WhatsApp.</p>
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">{[[HandCoins, "Gratis untuk orang tua"], [ShieldCheck, "Tutor terverifikasi"], [MessageCircle, "Tanpa komisi, chat di WhatsApp"]].map(([I, l]) => { const Icon = I as typeof HandCoins; return <li key={l as string} className="inline-flex items-center gap-1.5"><Icon size={18} className="text-accent" aria-hidden />{l as string}</li>; })}</ul>
    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1"><Sel k="area" label="Area" opts={AREAS} /><Sel k="subject" label="Mata pelajaran" opts={SUBJECTS} /><Sel k="level" label="Jenjang" opts={LEVELS} /></div>
    <p className="muted mb-3" aria-live="polite">{tutors ? `${tutors.length} tutor` : "Memuat…"} · nama, foto, dan nomor disembunyikan sampai tutor merespons</p>
    {tutors?.length === 0 && <div className="panel p-8 text-center"><SearchX size={32} className="mx-auto mb-2 text-subtle" aria-hidden /><p className="font-semibold">Belum ada tutor untuk filter ini</p><p className="muted mt-1">Coba pilih "Semua" pada mata pelajaran atau jenjang.</p><button className="btn-secondary mt-3" onClick={() => setF({ area: "", subject: "", level: "" })}>Reset filter</button></div>}
    <ul className="space-y-2">{tutors?.map((t) => <TutorRow key={t.id} t={t} selected={sel.includes(t.id)} onToggle={() => toggle(t.id)} disabled={sel.length >= 3} />)}</ul>
    {sel.length > 0 && <div className="fixed inset-x-0 bottom-[3.5rem] z-20 border-t border-line bg-surface p-3 shadow-sheet md:bottom-0"><div className="mx-auto flex max-w-3xl items-center justify-between">
      <span className="text-sm font-medium">{sel.length} dari 3 tutor dipilih</span><button className="btn-primary" onClick={() => setOpen(true)}>Kirim permintaan</button></div></div>}
    {open && <RequestForm ids={sel} f={f} onClose={() => setOpen(false)} onDone={() => { setOpen(false); setDone(true); setSel([]); }} />}
    {done && <p role="status" className="panel fixed inset-x-4 top-4 z-40 mx-auto flex max-w-md items-start gap-2 border-accent p-3 text-sm shadow-sheet"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden /><span>Permintaan terkirim, aktif 14 hari. Tutor akan menghubungi lewat WhatsApp.</span> <button className="ml-1 underline" onClick={() => setDone(false)}>Tutup</button></p>}
  </>);
}
function RequestForm({ ids, f, onClose, onDone }: { ids: string[]; f: { area: string; subject: string; level: string }; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ parentName: "", whatsapp: "", subject: f.subject || "Matematika", level: f.level || "SMP", area: f.area || "Tebet", note: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/requests", { method: "POST", body: JSON.stringify({ ...v, tutorIds: ids }) }); setBusy(false); r.ok ? onDone() : setErr((await r.json()).error); }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const Opt = ({ k, label, opts }: { k: string; label: string; opts: string[] }) => <div><label className="label">{label}</label><select className="field" value={(v as Record<string, string>)[k]} onChange={set(k)}>{opts.map((s) => <option key={s}>{s}</option>)}</select></div>;
  return (<div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Kirim permintaan">
    <form onSubmit={submit} className="panel max-h-[92vh] w-full max-w-md space-y-3 overflow-y-auto rounded-b-none p-5 shadow-sheet sm:rounded-b-lg">
      <h2 className="text-lg font-semibold">Kirim permintaan ke {ids.length} tutor</h2>
      <div><label className="label">Nama</label><input required className="field" value={v.parentName} onChange={set("parentName")} /></div>
      <div><label className="label">WhatsApp</label><input required inputMode="tel" pattern="[0-9+ ]{9,16}" className="field" value={v.whatsapp} onChange={set("whatsapp")} placeholder="0812…" /><p className="muted mt-1 text-xs">Hanya terlihat oleh tutor yang membuka permintaan (maks. 10).</p></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1"><Opt k="subject" label="Mapel" opts={["Matematika","Fisika","Kimia","Biologi","IPA","Bahasa Inggris","Bahasa Indonesia","Calistung","UTBK"]} /><Opt k="level" label="Jenjang" opts={["SD","SMP","SMA","Umum"]} /><Opt k="area" label="Area" opts={["Tebet","Kebayoran Baru"]} /></div>
      <div><label className="label">Catatan</label><textarea className="field" rows={3} value={v.note} onChange={set("note")} placeholder="Kelas, kesulitan, jadwal" /></div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim"}</button></div>
    </form></div>);
}
