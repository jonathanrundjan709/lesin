import { $$ } from "../core/dom.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { refreshContact, session } from "../core/session.js";
import { purchase } from "../components/payment.js";
import { trialBanner } from "../components/trial-banner.js";

/** Paket kuota buka kontak untuk pencari (kartu 3 kolom dengan harga coret). */
export const packCards = (audience) => {
  const packs = session.meta.products.filter((p) => p.audience === audience && !p.plan);
  const unit = audience === "seeker" ? "kontak" : "lead";
  return `<div class="pack-row">${packs.map((p, i) => `<button class="pack ${i === 1 ? "hl" : ""}" data-pack="${p.key}">
    ${i === 1 ? `<em class="ptag">Populer</em>` : i === 2 ? `<em class="ptag">Paling hemat</em>` : ""}<b class="pn">${p.units}</b><span class="pu">${unit}</span>
    ${p.listPrice > p.amount ? `<s>${rp(p.listPrice)}</s>` : `<s class="ghost-s">&nbsp;</s>`}<strong>${rp(p.amount)}</strong><small>${rp(p.perUnit)}/${unit}</small></button>`).join("")}</div>`;
};

/** Kuota buka kontak pencari: saldo, masa percobaan, dan paket. */
export const quotaView = {
  async load() { await refreshContact(); return null; },
  render() {
    const c = session.contact;
    return `<h1>Kuota kontak</h1>
    <div class="balance section"><span class="small" style="opacity:.8;font-weight:600">Kuota buka kontak tutor</span><div class="amt">${c.credits} kontak</div>
      <span class="small" style="opacity:.8">1 kuota = buka nama dan WhatsApp 1 tutor, selamanya. Paket yang dibeli tidak hangus.</span></div>
    <div class="section">${trialBanner() || `<div class="info">${ic("info")}<span>Kirim permintaan ke tutor tetap <b>gratis</b>. Kuota hanya dipakai kalau kamu mau membuka kontak tutor langsung.</span></div>`}</div>
    <div class="section"><div class="section-head"><h2>Beli paket kontak</h2><span class="small muted">Makin banyak, makin hemat</span></div>${packCards("seeker")}</div>
    <div class="section stack">
      <a class="card tap link-row" href="/harga"><span class="mi">${ic("tag")}</span><span class="grow"><b>Daftar harga</b><small>Paket kontak dan aturan trial</small></span>${ic("chevR")}</a>
      <a class="card tap link-row" href="/riwayat"><span class="mi">${ic("list")}</span><span class="grow"><b>Riwayat</b><small>Trial, pembelian, dan pemakaian kuota</small></span>${ic("chevR")}</a>
    </div>`;
  },
  mount() {
    $$("[data-pack]").forEach((b) => (b.onclick = () => purchase(b.dataset.pack, {
      title: `Beli paket ${session.meta.products.find((p) => p.key === b.dataset.pack).label}`, onPaid: () => navigate("/kuota"),
    })));
  },
};

