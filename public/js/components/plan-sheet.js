import { api } from "../core/api.js";
import { $, esc } from "../core/dom.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { session } from "../core/session.js";
import { closeSheet, openSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";
import { navigate } from "../core/router.js";
import { purchase } from "./payment.js";

/** Paywall Tutor Plan: jelaskan keuntungan dulu, baru bayar (PRD §6). Angka diambil dari katalog server. */
export async function planSheet() {
  let plan;
  try { plan = (await api.billing.products()).products.find((p) => p.key === "plan"); } catch (e) { return toast(esc(e.message), "err"); }
  const perks = [
    ["ticket", `${plan.leads} lead per bulan`, `Setara ${rp(plan.listPrice)}, kamu bayar ${rp(plan.amount)} (${rp(Math.round(plan.amount / plan.leads))} per lead).`],
    ["eye", "Prioritas di pencarian", "CV-mu muncul lebih tinggi di hasil pencarian orang tua."],
    ["shield", "Badge Pro", "Orang tua langsung melihat kamu tutor yang aktif dan serius."],
    ["calendar", "Lesson hub tanpa batas", "Jadwal mingguan, pengingat WhatsApp, dan catatan sesi untuk semua muridmu."],
  ];
  openSheet(`<div class="pro-hero"><img src="assets/mascot.svg" alt="" width="72" height="72"><div><p class="eyebrow">Langganan bulanan</p><h2>Tutor Plan</h2></div></div>
    <ul class="perks">${perks.map(([i, t, d]) => `<li><span class="pi">${ic(i)}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}</ul>
    <div class="info" style="margin-bottom:12px">${ic("info")}<span>Lead dari Plan hangus di akhir bulan. Lead yang dibeli satuan tidak pernah hangus. Lead adalah kredit layanan, bukan uang tunai.</span></div>
    <div class="pro-price"><span class="muted small">Harga</span><b>${rp(plan.amount)}<small> / bulan</small></b></div>
    ${session.leads?.planActive ? `<p class="small muted" style="text-align:center;margin-bottom:10px">Plan aktif sampai ${new Date(session.leads.planUntil).toLocaleDateString("id-ID", { dateStyle: "long" })}.</p>` : ""}
    <button class="btn acc" id="proGo">${session.leads?.planActive ? "Perpanjang Tutor Plan" : "Langganan Tutor Plan"}</button>
    <button class="btn line" id="proLater" style="margin-top:8px">Nanti saja</button>`, (sh) => {
    $("#proLater", sh).onclick = closeSheet;
    $("#proGo", sh).onclick = () => purchase("plan", { title: "Langganan Tutor Plan", onPaid: () => navigate(location.hash || "#/") });
  });
}
