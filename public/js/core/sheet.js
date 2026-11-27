import { $ } from "./dom.js";
import { ic } from "./icons.js";
import { esc } from "./dom.js";

/** Bottom sheet. `onMount(sheetEl)` dipanggil setelah dirender. */
export function openSheet(html, onMount) {
  const root = $("#sheet-root");
  root.innerHTML = `<div class="overlay"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  root.onclick = (e) => { if (e.target.matches(".overlay")) closeSheet(); };
  const sheet = $(".sheet", root);
  onMount?.(sheet);
  return sheet;
}

export const closeSheet = () => { $("#sheet-root").innerHTML = ""; };

/** Layar sukses di dalam sheet yang sama. */
export function successSheet(sheet, { title, text, cta = "Selesai", onDone }) {
  sheet.innerHTML = `<div class="grab"></div><div class="success"><div class="ck">${ic("check")}</div><h2>${esc(title)}</h2>
    <p class="sub" style="margin-top:6px">${text}</p></div><button class="btn" id="doneBtn" style="margin-top:18px">${esc(cta)}</button>`;
  $("#doneBtn", sheet).onclick = () => { closeSheet(); onDone?.(); };
}
