import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Search = { [key: string]: string | string[] | undefined };

// opcional, evita cache/prerender estático si lo prefieres
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function PaymentFailed({
  searchParams,
}: {
  searchParams: Search;
}) {
  const amountStr = (searchParams.amount as string) ?? null;
  const orderIdStr = (searchParams.orderId as string) ?? null;
  const customerId = (searchParams.customerId as string) ?? null;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Pago Fallido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Lo sentimos, tu pago no se ha podido procesar correctamente.
          </p>

          {amountStr && (
            <p className="mb-2">
              <span className="font-semibold">Cantidad del intento de pago:</span>{" "}
              {Number(amountStr) / 100} €
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
            Por favor, intenta realizar el pago nuevamente o contacta con nuestro
            servicio de atención al cliente si el problema persiste.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
