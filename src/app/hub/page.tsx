"use client";
import { useCallback, useEffect, useState } from "react";
interface Lesson { id: string; child: string; subject: string; day: string; time: string; tutorName: string; notes: { id: string; at: number; topic: string; understanding: number }[] }
export default function Hub() {
  const [role, setRole] = useState<"parent" | "tutor">("parent"); const [ls, setLs] = useState<Lesson[]>([]); const [topic, setTopic] = useState(""); const [u, setU] = useState(3);
  const load = useCallback(async () => setLs(await (await fetch(role === "parent" ? "/api/lessons?parentId=p-demo" : "/api/lessons?tutorId=t1")).json()), [role]);
  useEffect(() => { load(); }, [load]);
  async function add(id: string) { if (!topic.trim()) return; await fetch("/api/lessons", { method: "POST", body: JSON.stringify({ lessonId: id, topic, understanding: u }) }); setTopic(""); load(); }
  return (<>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="h1">Lesson hub</h1><p className="muted mt-1">Jadwal, pengingat WhatsApp, dan catatan sesi. Gratis.</p></div>
      <div role="tablist" className="flex gap-1 rounded-md bg-sunken-strong p-1">{(["parent", "tutor"] as const).map((r) => <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={`min-h-target rounded px-3 text-sm ${role === r ? "bg-surface font-medium shadow-sm" : "text-subtle"}`}>{r === "parent" ? "Orang tua" : "Tutor"}</button>)}</div></div>
    <div className="mt-5 space-y-4">{ls.map((l) => <section key={l.id} className="panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-medium">{l.subject} · {l.child}</h2><span className="muted">Tiap {l.day}, {l.time}</span></div>
      <p className="muted">Tutor: {l.tutorName}. Pengingat WhatsApp dikirim ke kedua pihak sebelum sesi.</p>
      {role === "tutor" && <div className="mt-4 flex flex-wrap items-end gap-2"><div className="min-w-[180px] flex-1"><label className="label">Topik hari ini</label><input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="mis. Pecahan senilai" /></div>
        <div className="w-24"><label className="label">Paham (1–5)</label><select className="field" value={u} onChange={(e) => setU(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div><button className="btn-primary" onClick={() => add(l.id)}>Simpan</button></div>}
      <ol className="mt-4 divide-y divide-line border-t border-line">{l.notes.map((n) => <li key={n.id} className="flex items-baseline justify-between gap-3 py-2"><span><span className="mr-3 text-xs text-subtle">{new Date(n.at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>{n.topic}</span><span className="text-sm text-subtle">Paham {n.understanding}/5</span></li>)}</ol>
    </section>)}
    {ls.length === 0 && <div className="panel p-6 text-center muted"><p className="font-medium text-ink">Belum ada pelajaran aktif</p><p className="mt-1">Jadwal dan catatan sesi muncul setelah orang tua dan tutor sepakat.</p></div>}</div>
  </>);
}
