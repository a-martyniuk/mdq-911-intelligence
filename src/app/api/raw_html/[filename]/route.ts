import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await checkAuthSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  }

  const { filename } = await params;
  const safeFilename = path.basename(filename);

  let filePath = path.join(process.cwd(), "public", "html", safeFilename);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), "reports", "figures", safeFilename);
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
}
