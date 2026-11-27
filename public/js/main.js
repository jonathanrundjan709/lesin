import { $ } from "./core/dom.js";
import { bootSession } from "./core/session.js";
import { startRouter } from "./core/router.js";
import { modeSheet } from "./components/mode-switch.js";
import { registerRoutes } from "./routes.js";
import { errorView } from "./views/auth.js";

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
  await startRouter();
}

main();
