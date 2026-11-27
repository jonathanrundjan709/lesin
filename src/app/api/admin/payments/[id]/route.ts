import { api } from "@/app/api/_lib/http";

/** Admin mengonfirmasi pembayaran manual setelah mencocokkan nominal dengan mutasi. */
export const POST = api<{ id: string }>(async (c) => c.services.billing.confirmManual(c.me().id, c.params.id));
