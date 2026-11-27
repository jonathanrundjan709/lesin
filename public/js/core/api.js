/** Klien HTTP untuk backend LesIn. Semua panggilan ke server lewat sini. */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method, credentials: "same-origin",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server. Periksa koneksimu.", 0, "network");
  }
  const data = await res.json().catch(() => ({}));
  // 401 di luar /auth berarti sesi tidak lagi dikenali server. UI memberi tahu pengguna dan mengarahkan ke Masuk.
  if (res.status === 401 && !path.startsWith("/auth/")) window.dispatchEvent(new CustomEvent("lesin:session-lost"));
  // 403 "unverified" di luar /auth = aksi ini butuh nomor WhatsApp. UI mengarahkan ke langkah tambah nomor.
  if (res.status === 403 && data.code === "unverified" && !path.startsWith("/auth/")) window.dispatchEvent(new CustomEvent("lesin:needs-phone"));
  if (!res.ok) throw new ApiError(data.error || "Terjadi kesalahan.", res.status, data.code);
  return data;
}

const qs = (o) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  meta: () => request("GET", "/meta"),
  auth: {
    me: () => request("GET", "/auth/me"),
    signup: (b) => request("POST", "/auth/signup", b),
    login: (b) => request("POST", "/auth/login", b),
    verify: (b) => request("POST", "/auth/verify", b),
    resend: (b) => request("POST", "/auth/otp", b),
    logout: () => request("POST", "/auth/logout", {}),
  },
  tutors: {
    search: (filter) => request("GET", `/tutors${qs(filter)}`),
    get: (id, ctx = {}) => request("GET", `/tutors/${encodeURIComponent(id)}${qs(ctx)}`),
    unlock: (id) => request("POST", `/tutors/${encodeURIComponent(id)}/unlock`, {}),
    reviews: (id) => request("GET", `/tutors/${encodeURIComponent(id)}/reviews`),
    review: (id, b) => request("POST", `/tutors/${encodeURIComponent(id)}/reviews`, b),
    report: (id, b) => request("POST", `/tutors/${encodeURIComponent(id)}/report`, b),
  },
  me: {
    profile: () => request("GET", "/me/profile"),
    saveProfile: (b) => request("PUT", "/me/profile", b),
    leads: () => request("GET", "/me/leads"),
    credits: () => request("GET", "/me/credits"),
    contacts: () => request("GET", "/me/contacts"),
    verify: (kind) => request("POST", "/me/verification", { kind }),
    setPhone: (phone) => request("POST", "/me/phone", { phone }),
    consent: (accept) => request(accept ? "POST" : "DELETE", "/me/consent", accept ? {} : undefined),
  },
  requests: {
    create: (b) => request("POST", "/requests", b),
    mine: () => request("GET", "/requests/mine"),
    board: () => request("GET", "/requests/board"),
    detail: (id) => request("GET", `/requests/${encodeURIComponent(id)}`),
    unlock: (id) => request("POST", `/requests/${encodeURIComponent(id)}/unlock`, {}),
  },
  billing: {
    products: () => request("GET", "/billing/products"),
    createOrder: (product, key) => request("POST", "/orders", { product, key }),
    order: (id) => request("GET", `/orders/${encodeURIComponent(id)}`),
    simulate: (id) => request("POST", `/orders/${encodeURIComponent(id)}/simulate-payment`, {}),
  },
  lessons: {
    list: () => request("GET", "/lessons"),
    create: (b) => request("POST", "/lessons", b),
    addNote: (id, b) => request("POST", `/lessons/${encodeURIComponent(id)}/notes`, b),
  },
  admin: {
    queue: () => request("GET", "/admin/queue"),
    decideVerification: (id, approve) => request("POST", `/admin/verifications/${encodeURIComponent(id)}`, { approve }),
    payments: () => request("GET", "/admin/payments"),
    confirmPayment: (id) => request("POST", `/admin/payments/${encodeURIComponent(id)}`, {}),
    resolveReport: (id, suspend) => request("POST", `/admin/reports/${encodeURIComponent(id)}`, { suspend }),
  },
};
