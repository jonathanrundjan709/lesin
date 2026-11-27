import { configureRouter, defineRoute } from "./core/router.js";
import { renderChrome } from "./chrome.js";
import { adminView } from "./views/admin.js";
import { errorView, gateView, loginView, signupView, tutorGateView } from "./views/auth.js";
import { boardView, lowonganView } from "./views/board.js";
import { homeView } from "./views/home.js";
import { lessonsView } from "./views/lessons.js";
import { postView } from "./views/post.js";
import { profileView } from "./views/profile.js";
import { contactsView, myRequestsView } from "./views/requests.js";
import { resultsView, searchView } from "./views/search.js";
import { tutorDetailView } from "./views/tutor-detail.js";
import { historyView, pricesView, walletView } from "./views/wallet.js";

/** Tabel rute. auth = wajib masuk, tutorOnly = hanya mode tutor, guestOnly = hanya tamu. */
const ROUTES = {
  "": homeView, search: searchView, results: resultsView, tutor: tutorDetailView,
  masuk: { ...loginView, guestOnly: true }, daftar: { ...signupView, guestOnly: true },
  post: { ...postView, auth: true }, myposts: { ...myRequestsView, auth: true }, kontak: { ...contactsView, auth: true },
  les: { ...lessonsView, auth: true }, profile: { ...profileView, auth: true },
  board: { ...boardView, auth: true, tutorOnly: true }, lowongan: { ...lowonganView, auth: true, tutorOnly: true },
  wallet: { ...walletView, auth: true, tutorOnly: true }, harga: { ...pricesView, auth: true, tutorOnly: true }, riwayat: { ...historyView, auth: true, tutorOnly: true },
  admin: { ...adminView, auth: true },
};

export function registerRoutes() {
  for (const [name, view] of Object.entries(ROUTES)) defineRoute(name, view);
  configureRouter({ fallback: homeView, gate: gateView, tutorGate: tutorGateView, error: errorView, chrome: renderChrome });
}
