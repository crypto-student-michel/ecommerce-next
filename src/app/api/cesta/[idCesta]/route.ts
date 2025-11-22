// /ecommerce-next/src/app/api/cesta/[idCesta]/route.ts
import { NextResponse } from "next/server";
import { getCesta } from "@/lib/db/db";

type RouteContext = {
  params: Promise<{ idCesta: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { idCesta } = await context.params;

  if (!idCesta) {
    return NextResponse.json(
      { error: "Falta el parámetro idCesta" },
      { status: 400 }
    );
  }

  try {
    const items = await getCesta(idCesta);
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la cesta:", error);
    return NextResponse.json(
      { error: "Error al obtener la cesta" },
      { status: 500 }
    );
  }
}
