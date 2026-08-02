import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { prisma } from "./db.js";

const ALBY_TOKEN_KEY = "alby.authToken";

export type TokenSource = "environment" | "database" | "none";

function encryptionKey(): Buffer {
  const secret = process.env.LNCURL_ENCRYPTION_SECRET?.trim();
  if (!secret) throw new Error("LNCURL_ENCRYPTION_SECRET is required");
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(ALBY_TOKEN_KEY));
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decrypt(value: string): string {
  const [iv, tag, encrypted] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAAD(Buffer.from(ALBY_TOKEN_KEY));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function getAlbyToken(): Promise<{
  token: string | null;
  source: TokenSource;
}> {
  const environmentToken = process.env.AUTH_TOKEN?.trim();
  if (environmentToken) return { token: environmentToken, source: "environment" };

  const setting = await prisma.setting.findUnique({
    where: { key: ALBY_TOKEN_KEY },
  });
  if (!setting) return { token: null, source: "none" };
  return { token: decrypt(setting.encryptedValue), source: "database" };
}

export async function saveAlbyToken(token: string): Promise<void> {
  if (process.env.AUTH_TOKEN?.trim()) {
    throw new Error("The Alby Hub token is managed by the environment.");
  }
  const now = Math.floor(Date.now() / 1000);
  const encryptedValue = encrypt(token);
  await prisma.setting.upsert({
    where: { key: ALBY_TOKEN_KEY },
    create: { key: ALBY_TOKEN_KEY, encryptedValue, createdAt: now, updatedAt: now },
    update: { encryptedValue, updatedAt: now },
  });
}
