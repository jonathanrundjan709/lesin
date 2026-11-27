import { createHash, randomInt } from "node:crypto";
import type { OtpCodes } from "@/application/ports";
import { OTP_LENGTH } from "@/domain/otp";

/** Kode acak dari CSPRNG. Hash SHA-256 dengan garam per tantangan cukup: kode pendek, umur 5 menit, dan maksimal 5 percobaan. */
export class CryptoOtpCodes implements OtpCodes {
  generate(): string { return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0"); }
  hash(salt: string, value: string): string { return createHash("sha256").update(`${salt}:${value}`).digest("hex"); }
}
