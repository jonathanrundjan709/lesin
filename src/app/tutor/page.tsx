"use client";
import { useCallback, useEffect, useState } from "react";
import { rp } from "@/components/TutorCard";
interface TReq { id: string; subject: string; level: string; area: string; note: string; slotsLeft: number; unlocked: boolean; parentName: string | null; whatsapp: string | null }
const PRODUCTS = [["lead1", "1 lead", 15000, "Rp15.000/lead"], ["lead5", "5 lead", 65000, "Rp13.000/lead"], ["lead10", "10 lead", 125000, "Rp12.500/lead"], ["plan", "Tutor Plan", 99000, "8 lead/bulan · badge Pro · prioritas"]] as const;
export default function TutorApp() {
  const [id, setId] = useState("t1"); const [me, setMe] = useState<{ name: string; area: string; subjects: string[]; balance: number } | null>(null);
  const [reqs, setReqs] = useState<TReq[]>([]); const [msg, setMsg] = useState(""); const [pay, setPay] = useState<{ orderId: string; qris: string; label: string; amount: number } | null>(null);
  const load = useCallback(async () => { setMe(await (await fetch("/api/tutor-me?tutorId=" + id)).json()); setReqs(await (await fetch("/api/requests?tutorId=" + id)).json()); }, [id]);
  useEffect(() => { load(); }, [load]);
  async function unlock(rid: string) { const r = await fetch(`/api/requests/${rid}/contact`, { method: "POST", body: JSON.stringify({ tutorId: id }) }); const j = await r.json(); setMsg(r.ok ? (j.charged ? "✓ 1 lead terpakai. CV Anda terkirim ke orang tua." : "") : j.error); load(); }
  async function buy(p: typeof PRODUCTS[number]) { const j = await (await fetch("/api/orders", { method: "POST", body: JSON.stringify({ tutorId: id, product: p[0], key: crypto.randomUUID() }) })).json(); setPay({ orderId: j.order.id, qris: j.qris, label: p[1], amount: p[2] }); }
  async function simulatePaid() { const r = await fetch("/api/webhooks/payment", { method: "PUT", body: JSON.stringify({ orderId: pay!.orderId }) }); setMsg(r.ok ? "✓ Pembayaran terkonfirmasi (webhook bertanda tangan)." : (await r.json()).error); setPay(null); load(); }
  return (<>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-3xl font-bold">Papan permintaan</h1><p className="text-ink/60">Bayar per lead. Tanpa komisi atas biaya les.</p></div>
      <div><label className="label" htmlFor="who">Demo sebagai</label><select id="who" className="field" value={id} onChange={(e) => setId(e.target.value)}>{["t1","t2","t3","t4","t5","t6","t7","t8"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div></div>
    {me && <div className="card mb-6 flex items-center justify-between p-5"><div><p className="text-sm text-ink/60">{me.name} · {me.area}</p><p className="text-3xl font-bold text-pine-700">{me.balance} <span className="text-base font-medium text-ink/60">lead</span></p></div><span className="chip">{me.subjects.join(", ")}</span></div>}
    {msg && <p role="status" className="mb-4 rounded-xl bg-saffron-100 p-3 text-sm">{msg}</p>}
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section aria-label="Permintaan"><h2 className="mb-3 font-semibold">Permintaan di area Anda</h2>
        {reqs.length === 0 && <div className="card p-6 text-ink/60">Belum ada permintaan yang cocok.</div>}
        <ul className="space-y-3">{reqs.map((r) => <li key={r.id} className="card rise p-4">
          <div className="flex flex-wrap items-center gap-2"><b>{r.subject}</b><span className="chip">{r.level}</span><span className="chip">{r.area}</span><span className="ml-auto text-xs text-ink/50">{r.slotsLeft} slot tersisa</span></div>
          <p className="mt-2 text-sm">{r.note || "—"}</p>
          {r.unlocked ? <a className="btn-primary mt-3" target="_blank" rel="noreferrer" href={`https://wa.me/${r.whatsapp}?text=${encodeURIComponent(`Halo ${r.parentName}, saya tutor ${r.subject} dari Lesin. Boleh kita atur percobaan pertama?`)}`}>Chat {r.parentName} di WhatsApp ↗</a>
            : <button className="btn-accent mt-3" disabled={r.slotsLeft < 1} onClick={() => unlock(r.id)}>{r.slotsLeft < 1 ? "Penuh" : "Buka kontak · 1 lead"}</button>}
        </li>)}</ul></section>
      <aside aria-label="Beli lead"><h2 className="mb-3 font-semibold">Beli lead</h2><div className="space-y-2">{PRODUCTS.map((p) => <button key={p[0]} onClick={() => buy(p)} className="card flex w-full items-center justify-between p-3 text-left hover:ring-pine-500"><span><b>{p[1]}</b><br /><span className="text-xs text-ink/55">{p[3]}</span></span><b className="text-pine-700">{rp(p[2])}</b></button>)}</div>
        <p className="mt-3 text-xs text-ink/50">Lead beli tidak kedaluwarsa. Lead Plan hangus akhir bulan. Bukan e-money, tidak bisa ditarik.</p></aside></div>
    {pay && <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true"><div className="card w-full max-w-sm p-6 text-center"><h2 className="font-display text-xl font-bold">Bayar {pay.label}</h2><p className="text-2xl font-bold text-pine-700">{rp(pay.amount)}</p>
      <div className="mx-auto my-4 grid h-40 w-40 place-items-center rounded-xl bg-ink/5 text-xs text-ink/50">QRIS simulasi<br />{pay.qris}</div>
      <p className="mb-4 text-xs text-ink/50">Kedaluwarsa 30 menit. Saldo bertambah hanya setelah webhook gateway terverifikasi.</p>
      <div className="flex justify-center gap-2"><button className="btn-ghost" onClick={() => setPay(null)}>Batal</button><button className="btn-primary" onClick={simulatePaid}>Simulasikan bayar</button></div></div></div>}
  </>);
}
