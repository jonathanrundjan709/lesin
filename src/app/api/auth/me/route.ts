import { api } from "@/app/api/_lib/http";
import { toPublicUser } from "@/application/services/context";

export const GET = api(async ({ user }) => ({ user: user ? toPublicUser(user) : null }));
