"use client";
import { useCallback, useEffect, useState } from "react";
import { rp, SubjectIcon } from "@/components/TutorCard";
import { AlertCircle, MessageCircle, Ticket, Wallet } from "lucide-react";
interface TReq { id: string; subject: string; level: string; area: string; note: string; slotsLeft: number; unlocked: boolean; parentName: string | null; whatsapp: string | null }
const PRODUCTS = [["lead1", "1 lead", 15000, "Rp15.000/lead"], ["lead5", "5 lead", 65000, "Rp13.000/lead"], ["lead10", "10 lead", 125000, "Rp12.500/lead"], ["plan", "Tutor Plan", 99000, "8 lead/bulan · badge Pro · prioritas"]] as const;
export default function TutorApp() {
  const [id, setId] = useState("t1"); const [me, setMe] = useState<{ name: string; area: string; subjects: string[]; balance: number } | null>(null);
  const [reqs, setReqs] = useState<TReq[]>([]); const [msg, setMsg] = useState(""); const [pay, setPay] = useState<{ orderId: string; qris: string; label: string; amount: number } | null>(null);
  const load = useCallback(async () => { setMe(await (await fetch("/api/tutor-me?tutorId=" + id)).json()); setReqs(await (await fetch("/api/requests?tutorId=" + id)).json()); }, [id]);
  useEffect(() => { load(); }, [load]);
  async function unlock(rid: string) { const r = await fetch(`/api/requests/${rid}/contact`, { method: "POST", body: JSON.stringify({ tutorId: id }) }); const j = await r.json(); setMsg(r.ok ? (j.charged ? "1 lead terpakai. CV Anda terkirim ke orang tua." : "") : j.error); load(); }
  async function buy(p: typeof PRODUCTS[number]) { const j = await (await fetch("/api/orders", { method: "POST", body: JSON.stringify({ tutorId: id, product: p[0], key: crypto.randomUUID() }) })).json(); setPay({ orderId: j.order.id, qris: j.qris, label: p[1], amount: p[2] }); }
  async function simulatePaid() { const r = await fetch("/api/webhooks/payment", { method: "PUT", body: JSON.stringify({ orderId: pay!.orderId }) }); setMsg(r.ok ? "Pembayaran terkonfirmasi." : (await r.json()).error); setPay(null); load(); }
  return (<>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="h1">Papan permintaan</h1><p className="muted mt-1">Bayar per lead. Tanpa komisi atas biaya les.</p></div>
      <div className="w-36"><label className="label" htmlFor="who">Demo sebagai</label><select id="who" className="field" value={id} onChange={(e) => setId(e.target.value)}>{["t1","t2","t3","t4","t5","t6","t7","t8"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div></div>
    {me && me.balance < 1 && <p className="panel mt-5 flex items-start gap-2 border-cta bg-notice p-3 text-sm"><AlertCircle size={18} className="mt-0.5 shrink-0 text-cta" aria-hidden />Lead Anda habis. Beli lead atau Tutor Plan di bawah untuk membuka permintaan.</p>}
    {me && <div className="panel my-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-md bg-sunken text-accent"><SubjectIcon subject={me.subjects[0]} /></span><div><p className="font-semibold">{me.name}</p><p className="muted">{me.area} · {me.subjects.join(", ")}</p></div></div><p className="flex items-center gap-2 whitespace-nowrap"><Ticket size={22} className="text-cta" aria-hidden /><span><span className="text-3xl font-bold leading-none">{me.balance}</span><span className="muted">lead tersisa</span></span></p></div>}
    {msg && <p role="status" className="panel mb-4 p-3 text-sm">{msg}</p>}
    <section aria-label="Permintaan"><h2 className="mb-2 font-semibold">Permintaan di area Anda</h2>
      {reqs.length === 0 && <div className="panel p-6 text-center muted">Belum ada permintaan yang cocok.</div>}
      <ul className="space-y-2">{reqs.map((r) => <li key={r.id} className="panel flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <div className="min-w-0 basis-full flex-1 sm:basis-0"><p className="font-medium">{r.subject} <span className="font-normal text-subtle">· {r.level} · {r.area}</span></p><p className="muted truncate">{r.note || "Tanpa catatan"}</p><p className="mt-1 text-xs text-subtle">{r.slotsLeft} dari 10 slot tersisa</p></div>
        {r.unlocked ? <a className="btn-primary w-full sm:w-auto" target="_blank" rel="noreferrer" href={`https://wa.me/${r.whatsapp}?text=${encodeURIComponent(`Halo ${r.parentName}, saya tutor ${r.subject} dari Lesin. Boleh kita atur percobaan pertama?`)}`}><MessageCircle size={18} aria-hidden />WhatsApp {r.parentName}</a>
          : <button className="btn-cta w-full sm:w-auto" disabled={r.slotsLeft < 1} onClick={() => me && me.balance < 1 ? document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" }) : unlock(r.id)}>{r.slotsLeft < 1 ? "Penuh" : me && me.balance < 1 ? "Beli lead dulu" : "Buka · 1 lead"}</button>}
      </li>)}</ul></section>
    <section id="packs" aria-label="Beli lead" className="mt-8 scroll-mt-4"><h2 className="mb-2 flex items-center gap-2 font-semibold"><Wallet size={18} aria-hidden />Beli lead</h2>
      <ul className="grid gap-2 sm:grid-cols-2">{PRODUCTS.map((p) => <li key={p[0]}><button onClick={() => buy(p)} className="panel flex w-full items-center justify-between p-4 text-left hover:border-accent row-hover"><span><span className="font-semibold">{p[1]}</span><br /><span className="text-xs text-subtle">{p[3]}</span></span><span className="font-bold text-accent">{rp(p[2])}</span></button></li>)}</ul>
      <p className="mt-2 text-xs text-subtle">Lead beli tidak kedaluwarsa. Lead Tutor Plan hangus di akhir bulan. Bukan uang elektronik dan tidak bisa ditarik.</p></section>
    {pay && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true"><div className="panel w-full max-w-sm rounded-b-none p-6 text-center shadow-sheet sm:rounded-b-lg"><h2 className="text-lg font-semibold">Bayar {pay.label}</h2><p className="text-2xl font-semibold">{rp(pay.amount)}</p>
      <div className="mx-auto my-4 grid h-36 w-36 place-items-center rounded-md border border-dashed border-line-strong text-xs text-subtle">QRIS simulasi<br />{pay.qris}</div>
      <p className="muted mb-4 text-xs">Menunggu pembayaran. Kedaluwarsa 30 menit. Lead bertambah setelah pembayaran dikonfirmasi gateway.</p>
      <div className="flex justify-center gap-2"><button className="btn-secondary" onClick={() => setPay(null)}>Batal</button><button className="btn-primary" onClick={simulatePaid}>Simulasikan bayar</button></div></div></div>}
  </>);
}
