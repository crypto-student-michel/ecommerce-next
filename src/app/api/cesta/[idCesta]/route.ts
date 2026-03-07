// // /ecommerce-next/src/app/api/cesta/[idCesta]/route.ts
// import { NextResponse } from "next/server";
// import { getCesta } from "@/lib/db/db";

// type RouteContext = {
//   params: Promise<{ idCesta: string }>;
// };

// export async function GET(
//   _request: Request,
//   context: RouteContext
// ) {
//   const { idCesta } = await context.params;

//   if (!idCesta) {
//     return NextResponse.json(
//       { error: "Falta el parámetro idCesta" },
//       { status: 400 }
//     );
//   }

//   try {
//     const items = await getCesta(idCesta);
//     return NextResponse.json(items, { status: 200 });
//   } catch (error) {
//     console.error("Error al obtener la cesta:", error);
//     return NextResponse.json(
//       { error: "Error al obtener la cesta" },
//       { status: 500 }
//     );
//   }
// }
// ---------------------------------------------------------------------------------------------------

// /ecommerce-next/src/app/api/cesta/[idCesta]/route.ts

// import { NextResponse } from "next/server";
// import { getCesta, setCantidadCesta, deleteItemCesta } from "@/lib/db/db";

// type RouteContext = {
//   params: Promise<{ idCesta: string }>;
// };

// export async function GET(_request: Request, context: RouteContext) {
//   const { idCesta } = await context.params;

//   if (!idCesta) {
//     return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
//   }

//   try {
//     const items = await getCesta(idCesta);
//     return NextResponse.json(items, { status: 200 });
//   } catch (error) {
//     console.error("Error al obtener la cesta:", error);
//     return NextResponse.json({ error: "Error al obtener la cesta" }, { status: 500 });
//   }
// }

// /**
//  * PATCH /api/cesta/:idCesta
//  * Body JSON:
//  *   { "productId": 4, "cantidad": 3 }
//  *
//  * - Si cantidad <= 0 => elimina el item (equivale a "cancelar")
//  * - Si cantidad >= 1 => actualiza (o crea si no existe)
//  */
// export async function PATCH(request: Request, context: RouteContext) {
//   const { idCesta } = await context.params;

//   if (!idCesta) {
//     return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
//   }

//   let body: any;
//   try {
//     body = await request.json();
//   } catch {
//     return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
//   }

//   const productId = Number(body?.productId);
//   const cantidad = Number(body?.cantidad);

//   if (!Number.isInteger(productId) || productId <= 0) {
//     return NextResponse.json({ error: "productId inválido" }, { status: 400 });
//   }
//   if (!Number.isFinite(cantidad)) {
//     return NextResponse.json({ error: "cantidad inválida" }, { status: 400 });
//   }

//   try {
//     if (cantidad <= 0) {
//       await deleteItemCesta(idCesta, productId);
//     } else {
//       await setCantidadCesta(idCesta, productId, cantidad);
//     }

//     // Devuelve la cesta actualizada para refrescar la UI
//     const items = await getCesta(idCesta);
//     return NextResponse.json(items, { status: 200 });
//   } catch (error) {
//     console.error("Error al actualizar cesta:", error);
//     return NextResponse.json({ error: "Error al actualizar cesta" }, { status: 500 });
//   }
// }

// /**
//  * DELETE /api/cesta/:idCesta?productId=4
//  * o Body JSON: { "productId": 4 }
//  */
// export async function DELETE(request: Request, context: RouteContext) {
//   const { idCesta } = await context.params;

//   if (!idCesta) {
//     return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
//   }

//   const url = new URL(request.url);
//   const qp = url.searchParams.get("productId");

//   let productId = qp ? Number(qp) : NaN;

//   // Si no viene por query param, intenta por JSON
//   if (!Number.isInteger(productId) || productId <= 0) {
//     try {
//       const body = await request.json();
//       productId = Number(body?.productId);
//     } catch {
//       // ignore
//     }
//   }

//   if (!Number.isInteger(productId) || productId <= 0) {
//     return NextResponse.json({ error: "productId inválido" }, { status: 400 });
//   }

//   try {
//     await deleteItemCesta(idCesta, productId);
//     const items = await getCesta(idCesta);
//     return NextResponse.json(items, { status: 200 });
//   } catch (error) {
//     console.error("Error al eliminar item de la cesta:", error);
//     return NextResponse.json({ error: "Error al eliminar item" }, { status: 500 });
//   }
// }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////// 30-01-26 - src/app/cesta/[idCesta]/page.tsx - obteniendo la cesta desde /api/cesta/[idCesta] y confirmando pedido en /api/orders

import { NextResponse } from "next/server";
import { getCesta, setCantidadCesta, deleteItemCesta } from "@/lib/db/db";

type RouteContext = {
  params: Promise<{ idCesta: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { idCesta } = await context.params;

  if (!idCesta) {
    return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
  }

  try {
    const items = await getCesta(idCesta);
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error al obtener la cesta:", error);
    return NextResponse.json({ error: "Error al obtener la cesta" }, { status: 500 });
  }
}

/**
 * PATCH /api/cesta/:idCesta
 * Body JSON: { "productId": 4, "cantidad": 3 }
 *
 * - Si cantidad <= 0 => elimina el item (equivale a "cancelar")
 * - Si cantidad >= 1 => actualiza cantidad (o crea si no existe)
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { idCesta } = await context.params;

  if (!idCesta) {
    return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const productId = Number(body?.productId);
  const cantidad = Number(body?.cantidad);

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "productId inválido" }, { status: 400 });
  }
  if (!Number.isFinite(cantidad)) {
    return NextResponse.json({ error: "cantidad inválida" }, { status: 400 });
  }

  try {
    if (cantidad <= 0) {
      await deleteItemCesta(idCesta, productId);
      const items = await getCesta(idCesta);
      return NextResponse.json({ ok: true, action: "deleted", items }, { status: 200 });
    }

    await setCantidadCesta(idCesta, productId, cantidad);
    const items = await getCesta(idCesta);
    return NextResponse.json({ ok: true, action: "updated", items }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar/eliminar item de la cesta:", error);
    return NextResponse.json({ error: "Error al actualizar la cesta" }, { status: 500 });
  }
}

/**
 * DELETE /api/cesta/:idCesta
 * Body JSON: { "productId": 4 }
 */
export async function DELETE(request: Request, context: RouteContext) {
  const { idCesta } = await context.params;

  if (!idCesta) {
    return NextResponse.json({ error: "Falta el parámetro idCesta" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const productId = Number(body?.productId);

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "productId inválido" }, { status: 400 });
  }

  try {
    await deleteItemCesta(idCesta, productId);
    const items = await getCesta(idCesta);
    return NextResponse.json({ ok: true, action: "deleted", items }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar item de la cesta:", error);
    return NextResponse.json({ error: "Error al eliminar el item" }, { status: 500 });
  }
}
