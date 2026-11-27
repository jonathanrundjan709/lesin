import { api } from "../core/api.js";
import { $, esc } from "../core/dom.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { refreshCredits, session } from "../core/session.js";
import { closeSheet, openSheet, successSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";

/** Pola mirip QR (deterministik dari teks) untuk simulasi. Bukan QR yang bisa dipindai. */
function fakeQr(payload) {
  const N = 25, FINDERS = [[0, 0], [N - 7, 0], [0, N - 7]];
  let h = 2166136261;
  for (const c of payload) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const finderCell = (x, y) => {
    const f = FINDERS.find(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7);
    if (!f) return null;
    const lx = x - f[0], ly = y - f[1], ring = (v) => v === 0 || v === 6;
    return ring(lx) || ring(ly) || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
  };
  let rects = "";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let on = finderCell(x, y);
    if (on === null) { h = Math.imul(h ^ (x * 31 + y * 17), 2246822519) >>> 0; on = ((h >>> 13) & 1) === 1; }
    if (on) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="qr" viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" role="img" aria-label="Kode QRIS simulasi"><rect x="-1" y="-1" width="${N + 2}" height="${N + 2}" fill="#fff"/>${rects}</svg>`;
}

const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

/**
 * Alur pembelian lead / Tutor Plan: buat order → tampilkan QRIS → tunggu webhook → saldo bertambah.
 * Kunci idempotensi dibuat sekali per percobaan, jadi klik ganda tidak membuat order ganda.
 * `onPaid` dipanggil setelah sheet sukses ditutup.
 */
export async function purchase(productKey, { title, onPaid } = {}) {
  let order;
  try {
    order = (await api.billing.createOrder(productKey, crypto.randomUUID())).order;
  } catch (e) { return toast(esc(e.message), "err"); }

  let poll, tick;
  const stop = () => { clearInterval(poll); clearInterval(tick); };
  const sheet = openSheet(`
    <h2>${esc(title || "Bayar dengan QRIS")}</h2>
    <p class="sub" style="margin-top:4px">${order.manual ? "Pindai dengan aplikasi bank atau e-wallet apa pun. Bayar sesuai nominal persis di bawah, termasuk kode unik. Kuota masuk setelah admin mengonfirmasi." : "Pindai dengan aplikasi bank atau e-wallet apa pun. Kuota masuk otomatis setelah pembayaran terkonfirmasi."}</p>
    <div class="qr-box">${order.manual ? `<img class="qr" src="${esc(order.qrisPayload)}" alt="Kode QRIS LesIn">` : fakeQr(order.qrisPayload)}<div class="qr-meta"><span class="muted small">Total bayar${order.manual ? " (persis)" : ""}</span><b>${rp(order.amount)}</b>
      ${order.manual ? `<span class="small muted">Sudah termasuk kode unik ${order.uniqueCode} supaya pembayaranmu bisa dikenali.</span>` : `<span class="small muted">Berlaku <b id="ttl">${mmss(order.expiresAt - Date.now())}</b></span>`}</div></div>
    <p class="small muted" id="payState" aria-live="polite" style="text-align:center;margin-top:10px"><span class="spinner dark sm"></span>${order.manual ? "Menunggu konfirmasi admin (biasanya kurang dari 1 jam). Kamu boleh menutup halaman ini, kuota masuk otomatis." : "Menunggu pembayaran…"}</p>
    ${session.meta.paymentSimulation ? `<button class="btn line" id="simPay" style="margin-top:14px">${ic("bolt")}Simulasikan pembayaran (demo)</button>
      <p class="demo-note">Mode demo — tidak ada uang sungguhan. Di produksi, status berubah dari webhook gateway.</p>` : ""}
    <button class="btn line" id="payCancel" style="margin-top:8px">Tutup</button>
  `, (sh) => {
    const finish = async () => {
      stop();
      await refreshCredits();
      successSheet(sh, { title: "Pembayaran berhasil", text: `${esc(order.units)} ${order.audience === "seeker" ? "kuota kontak" : "lead"} sudah masuk ke akunmu.`, cta: "Selesai", onDone: onPaid });
    };
    const check = async () => {
      try {
        const { order: o } = await api.billing.order(order.id);
        if (o.status === "paid") return finish();
        if (o.status === "expired") { stop(); $("#payState", sh).innerHTML = "Pembayaran kedaluwarsa. Tutup dan coba lagi."; }
      } catch { /* coba lagi pada putaran berikutnya */ }
    };
    poll = setInterval(check, 2500);
    tick = setInterval(() => { const el = $("#ttl", sh); if (el) el.textContent = mmss(order.expiresAt - Date.now()); }, 1000);
    $("#payCancel", sh).onclick = () => { stop(); closeSheet(); };
    const sim = $("#simPay", sh);
    if (sim) sim.onclick = async () => {
      sim.disabled = true;
      try { await api.billing.simulate(order.id); await finish(); } catch (e) { sim.disabled = false; toast(esc(e.message), "err"); }
    };
  });
  // Menutup lewat overlay juga menghentikan polling.
  const obs = new MutationObserver(() => { if (!sheet.isConnected) { stop(); obs.disconnect(); } });
  obs.observe(document.getElementById("sheet-root"), { childList: true });
}
