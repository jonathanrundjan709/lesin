/** Batas login gagal (PRD §8: lindungi dari tebak password). Dihitung per akun yang dicoba dan per jaringan. */
export const LOGIN_WINDOW_MS = 15 * 60_000;
export const LOGIN_MAX_FAILS_PER_ID = 5;
export const LOGIN_MAX_FAILS_PER_IP = 30;
