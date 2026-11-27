"use client";
import { useCallback, useEffect, useState } from "react";
interface Lesson { id: string; child: string; subject: string; day: string; time: string; tutorName: string; notes: { id: string; at: number; topic: string; understanding: number }[] }
export default function Hub() {
  const [role, setRole] = useState<"parent" | "tutor">("parent"); const [ls, setLs] = useState<Lesson[]>([]); const [topic, setTopic] = useState(""); const [u, setU] = useState(3);
  const load = useCallback(async () => setLs(await (await fetch(role === "parent" ? "/api/lessons?parentId=p-demo" : "/api/lessons?tutorId=t1")).json()), [role]);
  useEffect(() => { load(); }, [load]);
  async function add(id: string) { if (!topic.trim()) return; await fetch("/api/lessons", { method: "POST", body: JSON.stringify({ lessonId: id, topic, understanding: u }) }); setTopic(""); load(); }
  return (<>
    <div className="mb-6 flex items-end justify-between"><div><h1 className="font-display text-3xl font-bold">Lesson hub</h1><p className="text-ink/60">Jadwal, pengingat WhatsApp, dan catatan sesi. Gratis.</p></div>
      <div role="tablist" className="flex rounded-full bg-white p-1 shadow-card">{(["parent", "tutor"] as const).map((r) => <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${role === r ? "bg-pine-600 text-white" : ""}`}>{r === "parent" ? "Orang tua" : "Tutor"}</button>)}</div></div>
    {ls.map((l) => <section key={l.id} className="card rise mb-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{l.subject} · {l.child}</h2><span className="chip">Tiap {l.day}, {l.time}</span></div>
      <p className="text-sm text-ink/60">Tutor: {l.tutorName}</p>
      <p className="mt-2 text-xs text-ink/50">🔔 Pengingat WhatsApp dikirim ke kedua pihak sebelum tiap sesi.</p>
      {role === "tutor" && <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-pine-50 p-3"><div className="min-w-[200px] flex-1"><label className="label">Topik hari ini</label><input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="mis. Pecahan senilai" /></div>
        <div><label className="label">Paham</label><select className="field" value={u} onChange={(e) => setU(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div><button className="btn-primary" onClick={() => add(l.id)}>Simpan catatan</button></div>}
      <ol className="mt-4 space-y-2 border-l-2 border-pine-100 pl-4">{l.notes.map((n) => <li key={n.id}><p className="text-xs text-ink/50">{new Date(n.at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p><p className="font-medium">{n.topic}</p><p className="text-sm text-saffron-500" aria-label={`Pemahaman ${n.understanding} dari 5`}>{"●".repeat(n.understanding)}<span className="text-ink/20">{"●".repeat(5 - n.understanding)}</span></p></li>)}</ol>
    </section>)}
    {ls.length === 0 && <div className="card p-6 text-ink/60">Belum ada pelajaran aktif.</div>}
  </>);
}
