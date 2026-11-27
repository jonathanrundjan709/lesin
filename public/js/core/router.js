import { $ } from "./dom.js";
import { ApiError } from "./api.js";
import { session } from "./session.js";
import { closeSheet } from "./sheet.js";

/**
 * Router berbasis hash. Setiap view adalah objek:
 *   { auth?: boolean, tutorOnly?: boolean, load?(ctx), render(data, ctx), mount?(data, ctx) }
 * `load` mengambil data dari API, `render` mengembalikan HTML, `mount` memasang event.
 */
const routes = new Map();
let fallback = null;
let gate = null;
let tutorGate = null;
let errorView = null;
let chrome = () => {};
let token = 0;

export const defineRoute = (name, view) => routes.set(name, view);
export const configureRouter = (opts) => { fallback = opts.fallback; gate = opts.gate; tutorGate = opts.tutorGate; errorView = opts.error; chrome = opts.chrome ?? chrome; };

export function currentRoute() {
  const [page = "", id = ""] = location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
  const query = new URLSearchParams(location.hash.split("?")[1] ?? "");
  return { page, id: decodeURIComponent(id), query };
}
/** Alamat sebelum diarahkan ke halaman masuk, supaya bisa kembali setelah berhasil. */
export const returnTo = { hash: "#/" };

export async function render() {
  const mine = ++token;
  const ctx = currentRoute();
  const view = routes.get(ctx.page) ?? fallback;
  const target = $("#app");
  const stale = () => mine !== token;

  const show = (html, v, data) => {
    if (stale()) return;
    target.innerHTML = `<div class="fade-in">${html}</div>`;
    v?.mount?.(data, ctx);
    chrome();
  };

  if (view.guestOnly && session.user) return navigate("#/");
  if (view.auth && !session.user) { returnTo.hash = location.hash || "#/"; return show(gate.render(ctx), gate, null); }
  if (view.tutorOnly && session.mode !== "tutor") return show(tutorGate.render(), tutorGate, null);

  const wasLoggedIn = Boolean(session.user);
  const slow = setTimeout(() => { if (!stale()) target.innerHTML = `<div class="loading" aria-live="polite"><span class="spinner dark"></span>Memuat…</div>`; }, 150);
  try {
    const data = view.load ? await view.load(ctx) : null;
    clearTimeout(slow);
    show(view.render(data, ctx), view, data);
  } catch (e) {
    clearTimeout(slow);
    if (e instanceof ApiError && e.status === 401 && wasLoggedIn) return; // sesi hilang: ditangani listener di main.js
    if (e instanceof ApiError && e.status === 401) { returnTo.hash = location.hash || "#/"; return show(gate.render(ctx), gate, null); }
    show(errorView.render(e), errorView, e);
  }
}

export const navigate = (hash) => { if (location.hash === hash) return render(); location.hash = hash; };
export function startRouter() {
  window.addEventListener("hashchange", () => { closeSheet(); window.scrollTo(0, 0); render(); });
  return render();
}
