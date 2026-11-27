import { $$ } from "../core/dom.js";
import { fmtTime } from "../core/format.js";

/** Pilihan jam mulai: 06.00 sampai 21.30, per 30 menit. */
export const TIME_SLOTS = (() => {
  const out = [];
  for (let m = 6 * 60; m <= 21 * 60 + 30; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
})();

/**
 * Pemilih jam berupa deretan chip yang bisa digeser (menggantikan <input type="time"> bawaan browser yang kaku).
 * Nilai tersimpan di input tersembunyi `name` dengan format "HH:MM", jadi form tetap bisa dibaca seperti biasa.
 */
export const timeField = (name, value = "16:00") => `<div class="timechips" role="radiogroup" aria-label="Jam mulai">
  ${TIME_SLOTS.map((t) => `<button type="button" role="radio" aria-checked="${t === value}" class="time-chip ${t === value ? "on" : ""}" data-t="${t}">${fmtTime(t)}</button>`).join("")}
  <input type="hidden" name="${name}" value="${value}"></div>`;

const scrollToSelected = (strip) => {
  const on = strip.querySelector(".time-chip.on");
  if (on) strip.scrollLeft = Math.max(0, on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2);
};

/** Pasang pemilihan chip. Memicu event `input`/`change` pada form supaya ringkasan jam ikut diperbarui. */
export function bindTimeFields(root) {
  $$(".timechips", root).forEach((strip) => {
    const hidden = strip.querySelector("input[type=hidden]");
    strip.onclick = (e) => {
      const chip = e.target.closest(".time-chip");
      if (!chip) return;
      hidden.value = chip.dataset.t;
      strip.querySelectorAll(".time-chip").forEach((c) => { const on = c === chip; c.classList.toggle("on", on); c.setAttribute("aria-checked", String(on)); });
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    };
  });
  // Geser ke jam terpilih setelah tata letak siap, dan setiap kali baris hari dibuka.
  const settle = () => $$(".dayrow.on .timechips", root).forEach(scrollToSelected);
  requestAnimationFrame(settle);
  $$(".dayrow input[type=checkbox]", root).forEach((cb) => cb.addEventListener("change", () => requestAnimationFrame(settle)));
}
