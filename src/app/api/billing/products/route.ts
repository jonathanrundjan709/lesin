import { api } from "@/app/api/_lib/http";

export const GET = api(async (c) => ({ products: c.services.billing.catalog() }));
