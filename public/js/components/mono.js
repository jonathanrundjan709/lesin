import { avColor, subjAbbr } from "../core/format.js";
import { esc } from "../core/dom.js";

/** Tile singkatan mapel berwarna (pengganti emoji). */
export const mono = (subject, cls = "") => `<span class="mono ${cls}" style="--c:${avColor(subject)}">${esc(subjAbbr(subject))}</span>`;
