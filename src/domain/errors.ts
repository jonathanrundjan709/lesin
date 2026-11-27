export type ErrorCode =
  | "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "payment_required" | "rate_limited";

const STATUS: Record<ErrorCode, number> = {
  validation: 400, unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409, payment_required: 402, rate_limited: 429,
};

/** Kesalahan yang aman ditampilkan ke pengguna (pesan berbahasa Indonesia). */
export class DomainError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.status = STATUS[code];
  }
}

export const fail = (code: ErrorCode, message: string): never => { throw new DomainError(code, message); };
