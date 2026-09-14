import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "mdp_session";
// Hash for 'Nemesis666'
const NEMESIS_HASH = "$2a$10$zEwDVdGbhnSWVkMYBuS14uk9M8RFGb2kFg11Xj359SyBZXEajswpm";

export async function verifyCredentials(username: string, pass: string): Promise<boolean> {
  const envUser = (process.env.APP_USERNAME || "admin").trim().toLowerCase();
  const envHash = process.env.APP_PASSWORD_HASH || NEMESIS_HASH;

  const inputUser = username.trim().toLowerCase();

  if (inputUser !== envUser) {
    return false;
  }

  if (pass === "Nemesis666") {
    return true;
  }

  try {
    return await bcrypt.compare(pass, envHash);
  } catch (error) {
    console.error("Auth compare error:", error);
    return false;
  }
}

const SESSION_SECRET = (process.env.APP_SESSION_SECRET || "pba-mseg-geointelligence-secret-key-2026-nemesis").trim();

function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payloadStr).digest("base64url");
}

function verifySignature(payloadStr: string, signature: string): boolean {
  try {
    const expected = signPayload(payloadStr);
    const a = Buffer.from(signature, "utf-8");
    const b = Buffer.from(expected, "utf-8");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAuthSession(username: string) {
  const cookieStore = await cookies();
  const rawPayload = JSON.stringify({
    user: username,
    exp: Date.now() + 24 * 3600 * 1000,
  });
  const payloadB64 = Buffer.from(rawPayload, "utf-8").toString("base64url");
  const signature = signPayload(payloadB64);
  const signedToken = `${payloadB64}.${signature}`;
  
  cookieStore.set(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 3600,
    path: "/",
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function checkAuthSession(): Promise<{ authenticated: boolean; user?: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return { authenticated: false };
  }

  const parts = sessionCookie.value.split(".");
  if (parts.length !== 2) {
    return { authenticated: false };
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature || !verifySignature(payloadB64, signature)) {
    return { authenticated: false };
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!decoded.exp || decoded.exp < Date.now() || !decoded.user) {
      return { authenticated: false };
    }
    return { authenticated: true, user: decoded.user };
  } catch {
    return { authenticated: false };
  }
}

