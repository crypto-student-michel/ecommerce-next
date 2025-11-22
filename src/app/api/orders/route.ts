// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createOrder } from "@/lib/db/db";

type RequestBody = {
  username: string;
  idCesta: string;
};

export async function POST(request: Request) {
  try {
    const { username, idCesta } = (await request.json()) as RequestBody;

    if (!username || !idCesta) {
      return NextResponse.json(
        { error: "Faltan datos (username o idCesta)" },
        { status: 400 }
      );
    }

    // Llamamos a la función que realmente crea el pedido en la DB
    const result: any = await createOrder(username, idCesta);
    console.log("Resultado de createOrder:", result);

    // Intentamos sacar un orderId y un totalAmount aunque el nombre de campos cambie
    const orderId =
      result?.orderId ??
      result?.OrderID ??
      result?.id ??
      null;

    const totalAmount =
      result?.totalAmount ??
      result?.TotalAmount ??
      result?.amount ??
      result?.Amount ??
      null;

    if (!orderId) {
      console.error("createOrder no devolvió ningún identificador de pedido");
      return NextResponse.json(
        { error: "No se pudo obtener el identificador del pedido" },
        { status: 500 }
      );
    }

    // Devolvemos SIEMPRE un objeto con orderId y totalAmount
    return NextResponse.json(
      { orderId, totalAmount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al crear pedido:", error);
    return NextResponse.json(
      { error: "Error al crear el pedido" },
      { status: 500 }
    );
  }
}
