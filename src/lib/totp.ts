import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const ISSUER = "Schools Compliance";

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export async function generateQrDataUrl(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, ISSUER, secret);
  return QRCode.toDataURL(otpauth);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.check(code.replace(/\s+/g, ""), secret);
  } catch {
    return false;
  }
}

const BACKUP_CODE_COUNT = 8;

function randomBackupCode(): string {
  // 10 hex chars grouped as XXXXX-XXXXX, distinguishable from a 6-digit TOTP code.
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

export async function generateBackupCodes(): Promise<{ plain: string[]; hashed: string[] }> {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, randomBackupCode);
  const hashed = await Promise.all(plain.map((code) => bcrypt.hash(code, 10)));
  return { plain, hashed };
}

/** Checks `code` against stored backup-code hashes; returns the remaining hashes with any match removed. */
export async function consumeBackupCode(
  code: string,
  hashedCodes: string[],
): Promise<{ matched: boolean; remaining: string[] }> {
  const normalized = code.trim().toUpperCase();
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(normalized, hashedCodes[i])) {
      return { matched: true, remaining: [...hashedCodes.slice(0, i), ...hashedCodes.slice(i + 1)] };
    }
  }
  return { matched: false, remaining: hashedCodes };
}
