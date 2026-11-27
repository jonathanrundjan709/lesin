import { api } from "../core/api.js";
import { $$, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { navigate } from "../core/router.js";
import { toast } from "../core/toast.js";
import { emptyBox } from "../components/contact.js";

/** Konsol admin minimal: tinjau verifikasi dan laporan (PRD P0). Hanya untuk akun admin. */
export const adminView = {
  async load() { return api.admin.queue(); },
  render(q) {
    const kind = { id: "KTP/KTM", skill: "Bukti keahlian" };
    return `<div class="row" style="margin-bottom:12px">${back("/")}<h1 class="grow" style="margin:0">Admin</h1></div>
    <div class="section-head"><h2>Verifikasi</h2><span class="small muted">${q.verifications.length} menunggu</span></div>
    <div class="stack">${q.verifications.map((v) => `<div class="card"><b>${esc(v.tutorName)}</b><p class="small muted">${kind[v.kind]} · ${new Date(v.createdAt).toLocaleDateString("id-ID")}</p>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-ver="${esc(v.id)}" data-ok="1">Setujui</button><button class="btn sm line" data-ver="${esc(v.id)}" data-ok="0">Tolak</button></div></div>`).join("") || emptyBox("Tidak ada antrean verifikasi.")}</div>
    <div class="section-head section"><h2>Laporan</h2><span class="small muted">${q.reports.length} terbuka</span></div>
    <div class="stack">${q.reports.map((r) => `<div class="card"><b>${esc(r.tutorName)}</b><p class="small muted">dilaporkan oleh ${esc(r.reporterName)}</p><p class="sub" style="margin-top:6px">${esc(r.reason)}</p>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-rep="${esc(r.id)}" data-suspend="1">Tangguhkan tutor</button><button class="btn sm line" data-rep="${esc(r.id)}" data-suspend="0">Tandai selesai</button></div></div>`).join("") || emptyBox("Tidak ada laporan terbuka.")}</div>`;
  },
  mount() {
    const done = (msg) => () => { toast(msg); navigate("/admin"); };
    $$("[data-ver]").forEach((b) => (b.onclick = () => api.admin.decideVerification(b.dataset.ver, b.dataset.ok === "1").then(done("Keputusan tersimpan.")).catch((e) => toast(esc(e.message), "err"))));
    $$("[data-rep]").forEach((b) => (b.onclick = () => api.admin.resolveReport(b.dataset.rep, b.dataset.suspend === "1").then(done("Laporan diselesaikan.")).catch((e) => toast(esc(e.message), "err"))));
  },
};
