import { api } from "../core/api.js";
import { $, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { DAYS_FULL, avColor, durLabel, rp, waLink } from "../core/format.js";
import { ic } from "../core/icons.js";
import { searchPrefs, selection } from "../core/prefs.js";
import { navigate, currentPath } from "../core/router.js";
import { refreshContact, session } from "../core/session.js";
import { closeSheet } from "../core/sheet.js";
import { toast } from "../core/toast.js";
import { avatarHTML, nameRow } from "../components/tutor-card.js";
import { bindCopy, contactCard } from "../components/contact.js";
import { confirmSheet } from "../components/confirm.js";
import { trialBanner } from "../components/trial-banner.js";
import { lessonSheet, reportSheet, reviewSheet } from "../components/sheets.js";

const stars = (n) => `<span class="stars">${[1, 2, 3, 4, 5].map((i) => ic(i <= n ? "star" : "starO")).join("")}</span>`;

/** CV tutor. Identitas terbuka hanya bila tutor ini sudah merespons permintaanmu (diputuskan server). */
export const tutorDetailView = {
  async load({ id }) {
    const s = searchPrefs.get();
    const [{ tutor }, { reviews }] = await Promise.all([
      api.tutors.get(id, { area: s.area, budget: s.budget, durationMin: s.durationMin }),
      api.tutors.reviews(id),
    ]);
    return { t: tutor, reviews, s };
  },
  render({ t, reviews, s }) {
    const me = session.user?.id === t.id, open = !t.masked && !me;
    const picked = selection.has(t.id);
    const msg = `Halo Kak ${t.name.split(" ")[0]}, terima kasih sudah merespons permintaan les ${s.subject || t.subjects[0]} saya di LesIn. Apakah masih ada jadwal kosong untuk trial?`;
    const mine = reviews.find((r) => r.mine);
    const days = Object.keys(DAYS_FULL);

    const cta = me ? `<div class="info">${ic("info")}<span>Ini tampilan CV-mu di mata orang tua. Nama dan kontakmu tersamar sampai pencari membuka kontakmu atau kamu merespons permintaannya.</span></div>`
      : open ? contactCard({ color: avColor(t.id), name: t.name, note: `${t.age ? `${t.age} tahun · ` : ""}${esc(t.area)}`, rows: [["WhatsApp", t.phone, true], ["Domisili", `Kec. ${t.area}`]], wa: waLink(t.waNumber, msg) })
      : `${trialBanner()}<div class="lockbox" style="margin-top:12px">
          <div class="row"><span style="display:inline-flex;width:20px;color:var(--acc)">${ic("lock")}</span><h3>Identitas & kontak tersamar</h3></div>
          <ul><li>${ic("check")}<span><b>Buka kontak</b> untuk melihat nama asli dan WhatsApp tutor (1 kuota)</span></li>
            <li>${ic("check")}<span>Atau <b>kirim permintaan gratis</b>: tutor yang tertarik akan menghubungimu</span></li></ul>
          <button class="btn acc" id="unlockBtn">${ic("unlock")}Buka kontak · 1 kuota</button>
          <button class="btn line" id="pickBtn" style="margin-top:8px">${picked ? `${ic("check")}Dipilih. Lanjut kirim permintaan` : "Kirim permintaan gratis"}</button></div>`;

    return `
    <div class="row" style="margin-bottom:12px">${back()}<h2 class="grow">CV Tutor</h2></div>
    <div class="card">
      <div class="row" style="gap:14px;align-items:flex-start">${avatarHTML(t, true)}
        <div class="grow">${nameRow(t, "18px")}
          <p class="small" style="color:var(--ink-2);margin-top:4px">${esc(t.headline)}</p>
          <div class="chips" style="margin-top:8px">${t.verified ? `<span class="chip pri">${ic("shield")}Identitas terverifikasi</span>` : `<span class="chip">Belum terverifikasi</span>`}</div></div></div>
      <div class="stat-row" style="margin-top:14px">
        <div class="stat"><b><span class="star" style="display:inline-flex;width:15px;vertical-align:-1px">${ic("star")}</span> ${t.rating ? String(t.rating).replace(".", ",") : "Baru"}</b><span>${t.reviewCount} ulasan</span></div>
        <div class="stat"><b>${t.studentsTaught}</b><span>Murid diajar</span></div>
        <div class="stat"><b>${t.experienceYears} th</b><span>Pengalaman</span></div>
      </div>
    </div>
    <div class="section">${cta}</div>
    ${open ? `<button class="btn line" id="lessonBtn" style="margin-top:10px">${ic("calendar")}Atur jadwal les</button>` : ""}

    <div class="card section">
      ${t.bio ? `<div class="cv-sec"><h3>Tentang</h3><p class="sub">${esc(t.bio)}</p></div>` : ""}
      <div class="cv-sec"><h3>Pendidikan</h3><p style="font-weight:600;font-size:14px">${esc(t.education)}</p></div>
      <div class="cv-sec"><h3>Pengalaman & prestasi</h3><ul class="bullets"><li>${t.experienceYears} tahun mengajar</li>${t.achievements.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
      <div class="cv-sec"><h3>Mengajar</h3><div class="chips">${t.subjects.map((x) => `<span class="chip pri">${esc(x)}</span>`).join("")}</div>
        <div class="chips" style="margin-top:6px">${t.levels.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div></div>
      ${t.curricula.length ? `<div class="cv-sec"><h3>Kurikulum</h3><div class="chips">${t.curricula.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>` : ""}
      ${t.availableDays.length ? `<div class="cv-sec"><h3>Hari tersedia</h3><div class="days">${days.map((x) => `<span class="${t.availableDays.includes(x) ? "on" : ""}">${x}</span>`).join("")}</div></div>` : ""}
      <div class="cv-sec"><h3>Daerah & cara mengajar</h3>
        <dl class="kv"><dt>Domisili</dt><dd>Kec. ${esc(t.area)}</dd><dt>Ke rumah</dt><dd>${t.teachesOffline ? "Ya, satu kota dengan domisili" : "Tidak"}</dd><dt>Online</dt><dd>${t.teachesOnline ? "Ya" : "Tidak"}</dd></dl></div>
    </div>

    <div class="card section">
      <div class="row between" style="margin-bottom:6px"><h3 class="cap-title">Ulasan</h3><span class="small muted">${t.rating ? `${String(t.rating).replace(".", ",")} dari ${t.reviewCount} ulasan` : "Belum ada ulasan"}</span></div>
      ${reviews.map((v) => `<div class="review"><div class="row between"><b class="small">${esc(v.author)}</b>${stars(v.stars)}</div><p class="sub" style="font-size:13px;margin-top:4px">${esc(v.text)}</p></div>`).join("") || `<p class="small muted">Belum ada ulasan tertulis.</p>`}
      ${open ? `<button class="btn line" id="revBtn" style="margin-top:12px">${ic("starO")}${mine ? "Ubah ulasanmu" : "Tulis ulasan"}</button>`
        : !me ? `<p class="hint" style="margin-top:10px">Ulasan hanya bisa ditulis setelah kontak tutor terbuka.</p>` : ""}
    </div>

    <div class="card section row between">
      <div><span class="small muted">Tarif tutor (dibayar langsung ke tutor)</span><div class="price" style="font-size:20px">${rp(t.rate)}<small> / ${durLabel(t.rateDurationMin)}</small></div></div>
      ${t.match ? `<div class="match"><b>${t.match}%</b><span>cocok</span></div>` : ""}
    </div>
    ${open ? `<button class="link report-link" id="reportBtn">${ic("flag")}Laporkan tutor ini</button>` : ""}
    ${me ? "" : `<p class="hint" style="text-align:center">Percobaan pertama sebaiknya didampingi orang tua.</p>`}
    ${t.masked && !me ? `<div style="height:20px"></div>` : ""}`;
  },
  mount({ t, reviews }) {
    bindCopy();
    const unlock = $("#unlockBtn");
    if (unlock) unlock.onclick = () => {
      const c = session.contact;
      if (!c || c.credits < 1) {
        return confirmSheet({
          title: c?.trialEndsAt && !c.trialActive ? "Masa percobaan gratis sudah selesai" : "Kuota kontak habis",
          body: `Beli paket kontak mulai ${rp(session.meta.limits.contactPrice)} untuk membuka ${esc(t.name)}. Atau kirim permintaan gratis dan tunggu tutor menghubungimu.`,
          confirmLabel: "Lihat paket kontak", cancelLabel: "Nanti saja",
          onConfirm: () => { closeSheet(); navigate("/kuota"); },
        });
      }
      confirmSheet({
        title: `Buka kontak ${t.name}?`,
        body: c.trialActive ? "Memakai kuota gratis masa percobaanmu. Nama asli dan WhatsApp tutor terbuka selamanya." : "Nama asli dan WhatsApp tutor terbuka selamanya.",
        lines: [["Biaya", "1 kuota"], ["Sisa setelah ini", `${c.credits - 1} kuota`]],
        confirmLabel: "Ya, buka kontak", cancelLabel: "Batal",
        onConfirm: async () => {
          try {
            await api.tutors.unlock(t.id); await refreshContact();
            closeSheet(); toast("Kontak terbuka. Kamu bisa langsung chat lewat WhatsApp."); navigate(currentPath());
          } catch (err) {
            if (err.code === "payment_required") { closeSheet(); toast(esc(err.message), "info"); return navigate("/kuota"); }
            toast(esc(err.message), "err");
          }
        },
      });
    };
    const pick = $("#pickBtn");
    if (pick) pick.onclick = () => {
      if (selection.has(t.id)) return navigate("/post");
      const max = session.meta.limits.maxTargets;
      confirmSheet({
        title: `Kirim permintaan ke ${t.name}?`,
        body: "Kamu akan mengisi detail les di langkah berikutnya. Belum ada yang terkirim, dan mengirim permintaan selalu gratis.",
        confirmLabel: "Lanjut isi permintaan", cancelLabel: "Batal",
        onConfirm: () => {
          if (!selection.toggle(t, max)) return toast(`Maksimal ${max} tutor per permintaan.`, "info");
          closeSheet(); navigate("/post");
        },
      });
    };
    const rev = $("#revBtn"); if (rev) rev.onclick = () => reviewSheet(t, reviews.find((r) => r.mine), () => navigate(currentPath()));
    const rep = $("#reportBtn"); if (rep) rep.onclick = () => reportSheet(t);
    const les = $("#lessonBtn"); if (les) les.onclick = () => lessonSheet({ tutorId: t.id, seekerId: session.user.id, defaultSubject: t.subjects[0] });
  },
};
