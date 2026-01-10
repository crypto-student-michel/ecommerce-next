import { NextRequest, NextResponse } from "next/server";
import { getRedsysCheckoutServer } from "@/lib/redsys";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const customerId =
      body.customerId ?? body.customerID ?? body.customer ?? body.userId ?? body.user;

    const amount =
      body.amount ?? body.totalAmount ?? body.total ?? body.importe ?? body.price;

    const orderId =
      body.orderId ?? body.orderID ?? body.idOrder ?? body.order ?? body.pedido;

    if (!customerId || amount === undefined || !orderId) {
      return NextResponse.json(
        {
          error: "Faltan campos: customerId, amount, orderId",
          receivedKeys: Object.keys(body || {}),
          exampleBody: { customerId: "ALFKI", amount: 182, orderId: 26548 },
        },
        { status: 400 }
      );
    }

    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const signed = getRedsysCheckoutServer({
      customerId: String(customerId),
      baseUrl,
      amount: Number(amount),
      orderId: Number(orderId),
    });

    return NextResponse.json(signed);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error desconocido" }, { status: 500 });
  }
}
