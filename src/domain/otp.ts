/** Aturan kode OTP email saat daftar (PRD §8: batasi permintaan dan percobaan). */
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30_000;
export const OTP_MAX_PER_EMAIL = { count: 5, windowMs: 60 * 60_000 };
export const OTP_MAX_PER_IP = { count: 20, windowMs: 60 * 60_000 };

export const normalizeEmail = (e: string): string => e.trim().toLowerCase();
export const isValidEmail = (e: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

export const otpSubject = (code: string): string => `${code} adalah kode LesIn kamu`;
export const otpBody = (code: string): string =>
  `Kode verifikasi LesIn kamu: ${code}\n\nBerlaku ${OTP_TTL_MS / 60_000} menit. Jangan bagikan kode ini ke siapa pun, termasuk yang mengaku dari LesIn.\nBila bukan kamu yang mendaftar, abaikan email ini.`;
