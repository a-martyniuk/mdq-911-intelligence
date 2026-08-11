import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "mdp_session";
// Hash for 'admin123'
const DEFAULT_HASH = "$2a$10$5vJEWOHAdQSut0XQj2in/upjMQo7qC//FmylRTvkj6c1oMqBjUVMi";

export async function verifyCredentials(username: string, pass: string): Promise<boolean> {
  const envUser = (process.env.APP_USERNAME || "admin").trim().toLowerCase();
  const envHash = process.env.APP_PASSWORD_HASH || DEFAULT_HASH;

  const inputUser = username.trim().toLowerCase();

  if (inputUser !== envUser) {
    return false;
  }

  // Bcrypt hash verification
  try {
    return await bcrypt.compare(pass, envHash);
  } catch (error) {
    console.error("Auth compare error:", error);
    return false;
  }
}

export async function setAuthSession(username: string) {
  const cookieStore = await cookies();
  const tokenPayload = Buffer.from(JSON.stringify({ user: username, exp: Date.now() + 24 * 3600 * 1000 })).toString("base64");
  
  cookieStore.set(COOKIE_NAME, tokenPayload, {
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

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    if (decoded.exp < Date.now()) {
      return { authenticated: false };
    }
    return { authenticated: true, user: decoded.user };
  } catch {
    return { authenticated: false };
  }
}
