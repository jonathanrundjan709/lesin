import { $ } from "./dom.js";
import { ApiError } from "./api.js";
import { session } from "./session.js";
import { closeSheet } from "./sheet.js";

/**
 * Router berbasis History API (URL bersih: /results, /tutor/abc). Setiap view adalah objek:
 *   { auth?, tutorOnly?, guestOnly?, load?(ctx), render(data, ctx), mount?(data, ctx) }
 * `load` mengambil data dari API, `render` mengembalikan HTML, `mount` memasang event.
 * Server menyajikan aplikasi yang sama untuk semua path non-API (lihat next.config.mjs).
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

/** Path + query saat ini, mis. "/tutor/abc". */
export const currentPath = () => location.pathname + location.search;

export function currentRoute() {
  const [page = "", id = ""] = location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  return { page, id: decodeURIComponent(id), query: new URLSearchParams(location.search) };
}
/** Alamat sebelum diarahkan ke halaman masuk, supaya bisa kembali setelah berhasil. */
export const returnTo = { path: "/" };

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

  if (view.guestOnly && session.user) return navigate("/");
  if (view.auth && !session.user) { returnTo.path = currentPath(); return show(gate.render(ctx), gate, null); }
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
    if (e instanceof ApiError && e.status === 401) { returnTo.path = currentPath(); return show(gate.render(ctx), gate, null); }
    show(errorView.render(e), errorView, e);
  }
}

/** Pindah halaman tanpa memuat ulang. Path yang sama hanya merender ulang. */
export function navigate(path) {
  if (currentPath() === path) return render();
  history.pushState({}, "", path);
  closeSheet();
  window.scrollTo(0, 0);
  return render();
}

/** Tautan internal (<a href="/...">) ditangani router; tautan luar, tab baru, dan API dibiarkan. */
function interceptLinks(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.preventDefault();
  navigate(url.pathname + url.search);
}

export function startRouter() {
  // Tautan lama berbentuk /#/tutor/abc tetap berfungsi: diubah jadi /tutor/abc.
  if (location.hash.startsWith("#/")) history.replaceState({}, "", location.hash.slice(1));
  window.addEventListener("popstate", () => { closeSheet(); window.scrollTo(0, 0); render(); });
  document.addEventListener("click", interceptLinks);
  return render();
}
