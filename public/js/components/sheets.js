import { api } from "../core/api.js";
import { $, $$, esc } from "../core/dom.js";
import { autoClearErrors, showErrors, withBusy } from "../core/forms.js";
import { DAYS_FULL, addMin, fmtTime } from "../core/format.js";
import { ic } from "../core/icons.js";
import { closeSheet, openSheet } from "../core/sheet.js";
import { navigate } from "../core/router.js";
import { bindTimeFields, timeField } from "./time-picker.js";
import { toast } from "../core/toast.js";

/** Ulasan: bintang 1–5 + teks. `existing` = ulasan milik sendiri (untuk ubah). */
export function reviewSheet(tutor, existing, onDone) {
  let val = existing?.stars || 0;
  openSheet(`<h2>Ulas ${esc(tutor.name.split(" ")[0])}</h2>
    <p class="sub" style="margin-top:4px">Ulasanmu membantu orang tua lain memilih tutor. Namamu disingkat.</p>
    <div class="field" data-f="stars" style="margin-top:16px"><span class="lbl">Rating</span>
      <div class="star-pick">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-s="${i}" aria-label="${i} bintang">${ic("star")}</button>`).join("")}</div></div>
    <label class="field" data-f="text"><span class="lbl">Ceritakan pengalamanmu</span>
      <textarea class="input" id="revText" maxlength="300" placeholder="cth. Sabar, tepat waktu, nilai anak naik">${esc(existing?.text || "")}</textarea></label>
    <button class="btn" id="revSend">Kirim ulasan</button>`, (sh) => {
    const paint = () => $$("[data-s]", sh).forEach((b) => b.classList.toggle("on", +b.dataset.s <= val));
    paint();
    $$("[data-s]", sh).forEach((b) => (b.onclick = () => { val = +b.dataset.s; paint(); $("[data-f=stars]", sh).classList.remove("err"); }));
    $("#revSend", sh).onclick = (e) => withBusy(e.currentTarget, async () => {
      const text = $("#revText", sh).value.trim();
      if (!showErrors(sh, [{ f: "stars", ok: val > 0, msg: "Pilih jumlah bintang dulu." }, { f: "text", ok: text.length >= 5, msg: "Tulis minimal 5 huruf." }])) return;
      try { await api.tutors.review(tutor.id, { stars: val, text }); closeSheet(); toast("Terima kasih, ulasanmu sudah tayang."); onDone?.(); }
      catch (err) { toast(esc(err.message), "err"); }
    });
  });
}

/** Laporkan tutor (masuk ke antrean admin). */
export function reportSheet(tutor) {
  openSheet(`<h2>Laporkan ${esc(tutor.name)}</h2>
    <p class="sub" style="margin-top:4px">Laporan dibaca tim LesIn. Ceritakan apa yang terjadi, misalnya meminta bayar di luar aplikasi atau perilaku tidak pantas.</p>
    <label class="field" data-f="reason" style="margin-top:14px"><span class="lbl">Alasan</span><textarea class="input" id="repText" maxlength="400"></textarea></label>
    <button class="btn" id="repSend">Kirim laporan</button>`, (sh) => {
    $("#repSend", sh).onclick = (e) => withBusy(e.currentTarget, async () => {
      const reason = $("#repText", sh).value.trim();
      if (!showErrors(sh, [{ f: "reason", ok: reason.length >= 5, msg: "Jelaskan singkat alasannya (min. 5 huruf)." }])) return;
      try { await api.tutors.report(tutor.id, { reason }); closeSheet(); toast("Laporan terkirim. Terima kasih."); }
      catch (err) { toast(esc(err.message), "err"); }
    });
  });
}

/** Buat jadwal les mingguan (Lesson hub) untuk pasangan pencari–tutor yang sudah terhubung. */
export function lessonSheet({ tutorId, seekerId, defaultSubject = "", childHint = "" }) {
  const days = Object.entries(DAYS_FULL);
  openSheet(`<h2>Atur jadwal les</h2><p class="sub" style="margin-top:4px">Jadwal mingguan. Pengingat WhatsApp dikirim ke kamu dan lawan bicara sebelum sesi.</p>
    <form id="lessonForm" novalidate style="margin-top:14px">
      <label class="field" data-f="child"><span class="lbl">Nama murid</span><input class="input" name="child" maxlength="60" placeholder="cth. Aksa (kelas 8)" value="${esc(childHint)}"></label>
      <label class="field" data-f="subject"><span class="lbl">Mata pelajaran</span><input class="input" name="subject" maxlength="40" value="${esc(defaultSubject)}"></label>
      <div class="field" data-f="days"><span class="lbl">Hari & jam</span><div class="daylist">${days.map(([d, full]) => `
        <div class="dayrow" data-day="${d}"><label class="daytoggle"><input type="checkbox" name="days" value="${d}"><span class="dn">${full}</span><span class="dsum"></span><span class="dchk">${ic("check")}</span></label>
        <div class="daytime"><span class="small muted">Jam mulai</span>${timeField(`t_${d}`, "16:00")}</div></div>`).join("")}</div></div>
      <button class="btn" id="lessonSave">Simpan jadwal</button>
    </form>`, (sh) => {
    const f = $("#lessonForm", sh);
    autoClearErrors(f);
    const upd = () => $$(".dayrow", f).forEach((r) => {
      const on = r.querySelector("input[type=checkbox]").checked, t = r.querySelector("input[name^=t_]").value;
      r.classList.toggle("on", on); r.querySelector(".dsum").textContent = on && t ? `${fmtTime(t)} – ${addMin(t, 60)}` : "";
    });
    f.addEventListener("change", upd); f.addEventListener("input", upd); bindTimeFields(f);
    f.onsubmit = (e) => e.preventDefault();
    $("#lessonSave", sh).onclick = (e) => withBusy(e.currentTarget, async () => {
      const fd = new FormData(f), picked = fd.getAll("days");
      const child = fd.get("child").trim(), subject = fd.get("subject").trim();
      if (!showErrors(f, [{ f: "child", ok: child.length >= 2, msg: "Isi nama murid." }, { f: "subject", ok: subject.length >= 2, msg: "Isi mata pelajaran." }, { f: "days", ok: picked.length > 0, msg: "Pilih minimal satu hari." }])) return;
      try {
        await api.lessons.create({ tutorId, seekerId, child, subject, slots: picked.map((day) => ({ day, time: fd.get(`t_${day}`) })) });
        closeSheet(); toast("Jadwal tersimpan."); navigate("#/les");
      } catch (err) { toast(esc(err.message), "err"); }
    });
  });
}

/** Catatan sesi oleh tutor: topik + pemahaman 1–5, bisa diisi < 30 detik. */
export function noteSheet(lesson, onDone) {
  let val = 0;
  openSheet(`<h2>Catatan sesi</h2><p class="sub" style="margin-top:4px">${esc(lesson.child)} · ${esc(lesson.subject)}. Orang tua melihat catatan ini di Lesson hub.</p>
    <label class="field" data-f="topic" style="margin-top:14px"><span class="lbl">Topik hari ini</span><input class="input" id="noteTopic" maxlength="200" placeholder="cth. Persamaan linear satu variabel"></label>
    <div class="field" data-f="u"><span class="lbl">Pemahaman murid</span><div class="star-pick">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-u="${i}" aria-label="${i} dari 5">${i}</button>`).join("")}</div>
      <span class="hint">1 = belum paham, 5 = sangat paham</span></div>
    <button class="btn" id="noteSave">Simpan catatan</button>`, (sh) => {
    $$("[data-u]", sh).forEach((b) => (b.onclick = () => { val = +b.dataset.u; $$("[data-u]", sh).forEach((x) => x.classList.toggle("on", +x.dataset.u === val)); }));
    $("#noteSave", sh).onclick = (e) => withBusy(e.currentTarget, async () => {
      const topic = $("#noteTopic", sh).value.trim();
      if (!showErrors(sh, [{ f: "topic", ok: topic.length >= 2, msg: "Tulis topik singkat." }, { f: "u", ok: val > 0, msg: "Pilih tingkat pemahaman." }])) return;
      try { await api.lessons.addNote(lesson.id, { topic, understanding: val }); closeSheet(); toast("Catatan tersimpan."); onDone?.(); }
      catch (err) { toast(esc(err.message), "err"); }
    });
  });
}
