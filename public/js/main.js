import { $ } from "./core/dom.js";
import { applyUser, bootSession, session } from "./core/session.js";
import { currentPath, navigate, returnTo, startRouter } from "./core/router.js";
import { toast } from "./core/toast.js";
import { modeSheet } from "./components/mode-switch.js";
import { registerRoutes } from "./routes.js";
import { errorView } from "./views/auth.js";

/** Server tidak lagi mengenali sesi (kedaluwarsa, atau akun hilang di mode demo). Jangan pura-pura masih masuk. */
let handlingLost = false;
window.addEventListener("lesin:session-lost", async () => {
  if (!session.user || handlingLost) return;
  handlingLost = true;
  returnTo.path = currentPath();
  await applyUser(null);
  toast("Sesi kamu berakhir. Silakan masuk lagi.", "info", 5000);
  navigate("/masuk");
  handlingLost = false;
});

/** Titik masuk: muat data referensi + sesi dari server, pasang rute, lalu render halaman pertama. */
async function main() {
  $("#roleBtn").onclick = modeSheet;
  registerRoutes();
  try {
    await bootSession();
  } catch (e) {
    $("#app").innerHTML = errorView.render(e);
    return;
  }
  // Tanpa database, data hanya di memori server dan bisa hilang. Beri tahu terang-terangan.
  if (session.meta.storage === "memory") $("#demoBanner").hidden = false;
  await startRouter();
}

main();
