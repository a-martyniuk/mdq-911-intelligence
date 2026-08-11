import { NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await checkAuthSession();
  return NextResponse.json(session);
}
