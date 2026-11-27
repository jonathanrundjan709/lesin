import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { cvReady, refreshLeads, session } from "../core/session.js";
import { cvGate, planCard } from "./home.js";
import { logout } from "../components/mode-switch.js";
import { planSheet } from "../components/plan-sheet.js";
import { purchase } from "../components/payment.js";
import { packCards } from "./quota.js";

const products = () => session.meta.products;
const isTutor = () => session.mode === "tutor";
/** Halaman kuota/lead sesuai mode: tutor memakai lead, pencari memakai kuota kontak. */
const home = () => (isTutor() ? "/wallet" : "/kuota");

/** Lead tutor: saldo, paket (1/5/10), Tutor Plan, harga, riwayat. Tidak ada top-up saldo rupiah (PRD §6). */
export const walletView = {
  async load() { if (cvReady()) await refreshLeads(); return null; },
  render() {
    if (!cvReady()) return `<h1>Lead</h1><div class="section">${cvGate()}</div>`;
    const l = session.leads;
    return `<h1>Lead</h1>
    <div class="balance section"><span class="small" style="opacity:.8;font-weight:600">Lead tersedia</span><div class="amt">${l.leads} lead</div>
      <span class="small" style="opacity:.8">1 lead = buka WhatsApp 1 permintaan (${rp(l.leadPrice)}). Lead beli tidak hangus.${l.planActive ? ` Lead Plan hangus ${new Date(l.planUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}.` : ""}</span></div>
    <div class="section"><div class="section-head"><h2>Beli lead</h2><span class="small muted">Makin banyak, makin hemat</span></div>${packCards("tutor")}</div>
    ${planCard()}
    <div class="section stack">
      <a class="card tap link-row" href="/harga"><span class="mi">${ic("tag")}</span><span class="grow"><b>Daftar harga</b><small>Lead, paket, dan Tutor Plan</small></span>${ic("chevR")}</a>
      <a class="card tap link-row" href="/riwayat"><span class="mi">${ic("list")}</span><span class="grow"><b>Riwayat</b><small>Pembelian dan pemakaian lead</small></span>${ic("chevR")}</a>
    </div>
    <button class="btn line section" id="logoutBtn2">Keluar dari akun</button>`;
  },
  mount() {
    $$("[data-pack]").forEach((b) => (b.onclick = () => purchase(b.dataset.pack, { title: `Beli ${products().find((p) => p.key === b.dataset.pack).label}`, onPaid: () => navigate("/wallet") })));
    const plan = $("#goPlan"); if (plan) plan.onclick = planSheet;
    $("#logoutBtn2").onclick = logout;
  },
};

export const pricesView = {
  render() {
    const t = isTutor(), c = session.meta.trial;
    const list = products().filter((p) => p.audience === (t ? "tutor" : "seeker"));
    const unit = t ? "lead" : "kontak";
    const rows = list.map((p) => `<dt>${esc(p.label)}</dt><dd>${rp(p.amount)}${p.plan ? " / bulan" : ""}<br><span class="muted small">${p.units} ${unit} · ${rp(p.perUnit)} per ${unit}${p.plan ? " · hangus akhir bulan" : " · tidak hangus"}</span></dd>`).join("");
    const note = t
      ? `Lead adalah kredit layanan, bukan uang tunai, dan tidak bisa ditarik. LesIn tidak memotong komisi dari tarif les, dan pencari membayar terpisah untuk membuka kontak tutor.`
      : `<b>${c.days} hari pertama gratis</b>: buka sampai ${c.contacts} kontak tutor. Setelah itu beli paket kontak. Kirim permintaan ke tutor (sampai ${session.meta.limits.maxTargets}), baca CV, dan pakai Lesson hub tetap gratis. LesIn tidak memotong komisi dari tarif les.`;
    return `<div class="row" style="margin-bottom:12px">${back(home())}<h1 class="grow" style="margin:0">Daftar harga</h1></div>
    <div class="card"><dl class="kv">${rows}</dl></div>
    <div class="info section">${ic("info")}<span>${note}</span></div>`;
  },
};

export const historyView = {
  async load() {
    const r = isTutor() ? await api.me.leads() : await api.me.credits();
    return r.history;
  },
  render(items) {
    const unit = isTutor() ? "lead" : "kuota";
    return `<div class="row" style="margin-bottom:12px">${back(home())}<h1 class="grow" style="margin:0">Riwayat</h1></div>
    <div class="card">${items.length ? items.map((x) => `<div class="tx"><span>${esc(x.label)}<br><span class="muted small">${new Date(x.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}${x.amount ? ` · ${rp(Math.abs(x.amount))}` : ""}</span></span>
      <span class="${x.leadDelta < 0 ? "neg" : "pos"}">${x.leadDelta > 0 ? "+" : "−"}${Math.abs(x.leadDelta)} ${unit}</span></div>`).join("") : `<p class="small muted">Belum ada transaksi.</p>`}</div>`;
  },
};
