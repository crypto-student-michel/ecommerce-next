import "server-only";
import { NextResponse } from "next/server";
import { associateCestaIdWithUsername } from "@/lib/db/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { username, idCesta } = await req.json();

  if (!username || !idCesta) {
    return NextResponse.json(
      { error: "Faltan datos: username o idCesta" },
      { status: 400 }
    );
  }

  await associateCestaIdWithUsername(idCesta.toString(), username);
  return NextResponse.json({ ok: true });
}
