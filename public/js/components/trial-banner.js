import { esc } from "../core/dom.js";
import { rp } from "../core/format.js";
import { ic } from "../core/icons.js";
import { session } from "../core/session.js";

const fmtDate = (ms) => new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long" });

/**
 * Banner masa percobaan untuk pencari. Satu fungsi, empat keadaan:
 *  - tamu: ajak daftar (7 hari gratis, maks. 10 kontak)
 *  - trial berjalan: sisa kuota dan tanggal berakhir
 *  - trial selesai dan kuota habis: ajak beli paket
 *  - trial selesai tapi masih punya kuota beli: tidak perlu banner
 */
export function trialBanner() {
  const { days, contacts } = session.meta.trial, price = session.meta.limits.contactPrice;
  if (!session.user) {
    return `<section class="trial-banner"><span class="tb-ic">${ic("ticket")}</span><div class="grow"><b>${days} hari pertama gratis</b>
      <p>Daftar sekarang dan buka sampai ${contacts} kontak tutor tanpa bayar.</p></div><a class="btn sm" href="/daftar">Daftar gratis</a></section>`;
  }
  const c = session.contact;
  if (!c) return "";
  if (c.trialActive) {
    const used = Math.max(0, c.trialLimit - Math.min(c.credits, c.trialLimit));
    return `<section class="trial-banner active"><span class="tb-ic">${ic("ticket")}</span><div class="grow"><b>Masa percobaan gratis · sisa ${c.credits} kontak</b>
      <p>Berlaku sampai ${esc(fmtDate(c.trialEndsAt))}. Kuota trial hangus setelah itu.</p>
      <div class="progress tb-bar"><i style="width:${Math.round((used / c.trialLimit) * 100)}%"></i></div></div></section>`;
  }
  if (c.credits < 1) {
    return `<section class="trial-banner ended"><span class="tb-ic">${ic("lock")}</span><div class="grow"><b>Masa percobaan gratis sudah selesai</b>
      <p>Buka kontak tutor lagi dengan paket mulai ${rp(price)}. Kirim permintaan tetap gratis.</p></div><a class="btn sm" href="/kuota">Beli paket</a></section>`;
  }
  return "";
}
