// NO "use client": esta página es Server Component
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { saveCobro } from "@/lib/db/db";

type Search = { [key: string]: string | string[] | undefined };

// evita cacheo y prerender estático (queremos ejecutar en cada request)
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: Search;
}) {
  const amountStr = (searchParams.amount as string) ?? null;
  const orderIdStr = (searchParams.orderId as string) ?? null;
  const customerId = (searchParams.customerId as string) ?? null;
  const dsParam = (searchParams.Ds_MerchantParameters as string) ?? null;

  let authorisation = "";
  let message: { type: "success" | "error"; text: string } | null = null;

  // decodificar Ds_MerchantParameters (base64 + URL-encoded)
  try {
    if (dsParam) {
      const json = Buffer.from(
        decodeURIComponent(dsParam),
        "base64"
      ).toString("utf8");
      const obj = JSON.parse(json);
      authorisation = obj.Ds_AuthorisationCode || "";
    }
  } catch (e) {
    message = { type: "error", text: "No se pudo leer la autorización del pago." };
  }

  // guardar cobro en servidor (idempotente si es posible)
  if (!message && amountStr && orderIdStr && customerId) {
    const amount = parseFloat(amountStr) / 100; // Redsys envía en céntimos
    const orderId = parseInt(orderIdStr, 10);

    try {
      // TODO: dentro de saveCobro implementa idempotencia (p.ej. UNIQUE(orderId, authorisation))
      await saveCobro(customerId, orderId, amount, authorisation);
      message = { type: "success", text: "Cobro guardado exitosamente" };
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : "Desconocido";
      message = { type: "error", text: `Error al guardar el cobro: ${errorText}` };
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-600">
            ¡Pago Exitoso! {authorisation && <>Autorización: {authorisation}</>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Tu pago se ha procesado correctamente.</p>

          {message && (
            <p
              className={`mb-4 ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}

          {amountStr && (
            <p className="mb-2">
              <span className="font-semibold">Cantidad pagada:</span>{" "}
              {parseFloat(amountStr) / 100} €
            </p>
          )}

          {orderIdStr && (
            <p className="mb-2">
              <span className="font-semibold">ID de la cesta:</span>{" "}
              <Link href={`/dashboard/${customerId}/orders/${orderIdStr}`}>
                {orderIdStr}
              </Link>
            </p>
          )}

          <p className="mt-4 text-sm text-gray-600">
            Gracias por tu compra. Recibirás un correo electrónico con los detalles de tu pedido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
