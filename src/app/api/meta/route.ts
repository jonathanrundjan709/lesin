import { buildMeta } from "@/application/meta";
import { api } from "@/app/api/_lib/http";

/** Data referensi untuk UI (daerah, mapel, batas, harga, fitur). */
export const GET = api(async ({ container }) => buildMeta({ paymentSimulation: container.ports.allowPaymentSimulation, storage: container.mode, otpDemo: container.otpDemo }));
