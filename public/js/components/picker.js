import { $, $$, esc } from "../core/dom.js";
import { ic } from "../core/icons.js";
import { mono } from "./mono.js";
import { openSheet, closeSheet } from "../core/sheet.js";
import { session } from "../core/session.js";
import { toast } from "../core/toast.js";

/**
 * Picker buatan sendiri (pengganti <select> bawaan HP). Setiap picker punya konfigurasi:
 *   groups: () => [{ title, items, soon? }]  atau  options: () => string[]
 *   blank: label untuk "tidak memilih", search, custom (placeholder input tambah), onAdd(value)
 */
const registry = {};

export function picker(name, label, value, cfg) {
  registry[name] = cfg;
  const shown = value || cfg.blank || cfg.placeholder || "Pilih";
  return `<div class="field" data-f="${name}"><span class="lbl">${esc(label)}</span>
    <button type="button" class="input picker ${value || cfg.blank ? "" : "ph"}" data-pk="${name}" data-label="${esc(label)}">
      ${cfg.mono && value ? mono(value, "xs") : ""}<span class="pv">${esc(shown)}</span>${ic("chev")}</button>
    <input type="hidden" name="${name}" value="${esc(value || "")}"></div>`;
}

export const bindPickers = (root = document) => $$("[data-pk]", root).forEach((b) => (b.onclick = () => openPicker(b)));

function openPicker(btn) {
  const cfg = registry[btn.dataset.pk], hidden = btn.nextElementSibling, cur = hidden.value;
  const groups = cfg.groups ? cfg.groups() : [{ title: "", items: cfg.options() }];
  const selectable = groups.filter((g) => !g.soon).flatMap((g) => g.items);
  const optHTML = (list) => list.map((v) => `<button type="button" class="opt ${v === cur ? "on" : ""}" data-v="${esc(v)}">
      ${cfg.mono && v ? mono(v, "xs") : ""}<span>${esc(v || cfg.blank)}</span>${v === cur ? ic("check", "ck") : ""}</button>`).join("");

  const listHTML = (q = "") => {
    const blank = cfg.blank && !q ? `<div class="opt-grid">${optHTML([""])}</div>` : "";
    const body = groups.map((g) => {
      const items = g.items.filter((v) => v.toLowerCase().includes(q));
      if (!items.length) return "";
      const grid = g.soon ? items.map((v) => `<span class="opt dis"><span>${esc(v)}</span></span>`).join("") : optHTML(items);
      return `${g.title ? `<p class="opt-group">${esc(g.title)}${g.soon ? ` <em class="soon">Segera hadir</em>` : ""}</p>` : ""}<div class="opt-grid">${grid}</div>`;
    }).join("");
    return blank + (body || `<p class="small muted" style="padding:8px 2px">Tidak ditemukan.${cfg.custom ? " Tambahkan di bawah." : ""}</p>`);
  };

  openSheet(`
    <div class="row between" style="margin-bottom:12px"><h2>${esc(btn.dataset.label)}</h2><button type="button" class="link" data-x>Tutup</button></div>
    ${cfg.search ? `<input class="input" id="pkSearch" placeholder="${esc(cfg.searchHint || `Cari ${btn.dataset.label.toLowerCase()}…`)}" style="margin-bottom:12px">` : ""}
    <div class="opt-scroll" id="pkList">${listHTML()}</div>
    ${cfg.custom ? `<div class="custom-add"><p class="small muted" style="margin-bottom:8px">${esc(cfg.customHint || "Tidak ada di daftar?")}</p>
      <div class="row"><input class="input grow" id="pkCustom" placeholder="${esc(cfg.custom)}" maxlength="40"><button type="button" class="btn sm" id="pkAdd">${ic("plus")}Tambah</button></div></div>` : ""}
  `, (sh) => {
    const choose = (v) => {
      hidden.value = v;
      btn.innerHTML = `${cfg.mono && v ? mono(v, "xs") : ""}<span class="pv">${esc(v || cfg.blank || cfg.placeholder)}</span>${ic("chev")}`;
      btn.classList.toggle("ph", !v && !cfg.blank);
      hidden.dispatchEvent(new Event("input", { bubbles: true }));
      closeSheet();
    };
    const bindOpts = () => $$(".opt:not(.dis)", sh).forEach((o) => { if (o.dataset.v !== undefined) o.onclick = () => choose(o.dataset.v); });
    bindOpts();
    $("[data-x]", sh).onclick = closeSheet;
    const s = $("#pkSearch", sh);
    if (s) s.oninput = () => { $("#pkList", sh).innerHTML = listHTML(s.value.trim().toLowerCase()); bindOpts(); };
    const add = $("#pkAdd", sh);
    if (add) add.onclick = () => {
      const v = $("#pkCustom", sh).value.trim().replace(/\s+/g, " ");
      if (v.length < 2) return toast("Tulis minimal 2 huruf.", "err");
      const exist = selectable.find((o) => o.toLowerCase() === v.toLowerCase());
      if (!exist) cfg.onAdd(v);
      choose(exist || v);
    };
  });
}

/* ---------- picker siap pakai ---------- */
const CUSTOM_KEY = "lesin-custom-subjects";
const customSubjects = () => { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); } catch { return []; } };
const addCustomSubject = (v) => { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify([...customSubjects(), v])); } catch { /* abaikan */ } };

/** Daerah = kecamatan (L3) Jabodetabek per kota; kota lain tampil "Segera hadir". */
export const areaPicker = (name, label, value) => picker(name, label, value, {
  groups: () => [...Object.entries(session.meta.areas).map(([title, items]) => ({ title, items })), { title: "Kota lain", items: session.meta.comingSoon, soon: true }],
  search: true, searchHint: "Cari kecamatan atau kota…", placeholder: "Pilih kecamatan",
});
export const subjectPicker = (name, label, value, blank) => picker(name, label, value, {
  options: () => [...session.meta.subjects, ...customSubjects()], blank, mono: true, custom: "cth. Ekonomi, Gitar", customHint: "Mata pelajaran lain?", onAdd: addCustomSubject,
});
export const levelPicker = (name, value, blank) => picker(name, "Jenjang", value, { options: () => session.meta.levels, blank });
export const curriculumPicker = (name, value, blank) => picker(name, "Kurikulum", value, { options: () => session.meta.curricula, blank });
