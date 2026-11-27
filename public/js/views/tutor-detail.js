import { api } from "../core/api.js";
import { $, esc } from "../core/dom.js";
import { back } from "../core/forms.js";
import { DAYS_FULL, avColor, durLabel, rp, waLink } from "../core/format.js";
import { ic } from "../core/icons.js";
import { searchPrefs, selection } from "../core/prefs.js";
import { navigate } from "../core/router.js";
import { session } from "../core/session.js";
import { toast } from "../core/toast.js";
import { avatarHTML, nameRow } from "../components/tutor-card.js";
import { bindCopy, contactCard } from "../components/contact.js";
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

    const cta = me ? `<div class="info">${ic("info")}<span>Ini tampilan CV-mu di mata orang tua. Nama dan kontakmu tersamar sampai kamu merespons permintaan mereka.</span></div>`
      : open ? contactCard({ color: avColor(t.id), name: t.name, note: `${t.age ? `${t.age} tahun · ` : ""}${esc(t.area)}`, rows: [["WhatsApp", t.phone, true], ["Domisili", `Kec. ${t.area}`]], wa: waLink(t.waNumber, msg) })
      : `<div class="lockbox">
          <div class="row"><span style="display:inline-flex;width:20px;color:var(--acc)">${ic("lock")}</span><h3>Identitas & kontak tersamar</h3></div>
          <ul><li>${ic("check")}Kirim permintaan gratis ke tutor ini</li><li>${ic("check")}Tutor yang tertarik akan menghubungimu</li><li>${ic("check")}Nama, foto, dan WhatsApp terbuka setelah tutor merespons</li></ul>
          <button class="btn acc" id="pickBtn">${picked ? `${ic("check")}Dipilih. Lanjut kirim permintaan` : "Pilih tutor ini & kirim permintaan"}</button>
          <p class="small" style="text-align:center;margin-top:8px;color:rgba(255,255,255,.7)">Gratis. Kamu tidak membayar apa pun.</p></div>`;

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
        : !me ? `<p class="hint" style="margin-top:10px">Ulasan hanya bisa ditulis setelah tutor merespons permintaanmu.</p>` : ""}
    </div>

    <div class="card section row between">
      <div><span class="small muted">Tarif tutor (dibayar langsung ke tutor)</span><div class="price" style="font-size:20px">${rp(t.rate)}<small> / ${durLabel(t.rateDurationMin)}</small></div></div>
      ${t.match ? `<div class="match"><b>${t.match}%</b><span>cocok</span></div>` : ""}
    </div>
    ${me ? "" : `<button class="link report-link" id="reportBtn">${ic("flag")}Laporkan tutor ini</button>
    <p class="hint" style="text-align:center">Percobaan pertama sebaiknya didampingi orang tua.</p>`}
    ${t.masked && !me ? `<div style="height:20px"></div>` : ""}`;
  },
  mount({ t, reviews }) {
    bindCopy();
    const pick = $("#pickBtn");
    if (pick) pick.onclick = () => {
      const max = session.meta.limits.maxTargets;
      if (!selection.has(t.id) && !selection.toggle(t, max)) return toast(`Maksimal ${max} tutor per permintaan.`, "info");
      navigate("#/post");
    };
    const rev = $("#revBtn"); if (rev) rev.onclick = () => reviewSheet(t, reviews.find((r) => r.mine), () => navigate(location.hash));
    const rep = $("#reportBtn"); if (rep) rep.onclick = () => (session.user ? reportSheet(t) : (toast("Masuk dulu untuk melapor.", "info"), navigate("#/masuk")));
    const les = $("#lessonBtn"); if (les) les.onclick = () => lessonSheet({ tutorId: t.id, seekerId: session.user.id, defaultSubject: t.subjects[0] });
  },
};
