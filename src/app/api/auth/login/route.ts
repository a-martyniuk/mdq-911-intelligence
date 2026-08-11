import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, setAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    await setAuthSession(username);

    return NextResponse.json({ success: true, user: username });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}
