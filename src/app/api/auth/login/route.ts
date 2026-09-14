import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, setAuthSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    const rateStatus = checkRateLimit(clientIp);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Demasiados intentos fallidos. Acceso bloqueado temporalmente por ${rateStatus.retryAfterSec} segundos.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateStatus.retryAfterSec),
          },
        }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      recordFailedAttempt(clientIp);
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    resetRateLimit(clientIp);
    await setAuthSession(username);

    return NextResponse.json({ success: true, user: username });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}
