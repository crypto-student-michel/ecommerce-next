import Link from "next/link";

type KoSearchParams = {
  orderId?: string;
  amount?: string;
  customerId?: string;
  Ds_SignatureVersion?: string;
  Ds_MerchantParameters?: string;
  Ds_Signature?: string;
};

type KoPageProps = {
  searchParams: Promise<KoSearchParams>;
};

export default async function KoPage({ searchParams }: KoPageProps) {
  const {
    orderId,
    amount,
    customerId,
    // los otros parámetros los podrías guardar si quieres
    // Ds_SignatureVersion,
    // Ds_MerchantParameters,
    // Ds_Signature,
  } = await searchParams;

  const amountNumber = amount ? Number(amount) / 100 : 0;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Pago Fallido</h1>
        <p className="mb-4">
          Lo sentimos, tu pago no se ha podido procesar correctamente.
        </p>

        <p className="mb-1">
          <span className="font-semibold">Cantidad del intento de pago:</span>{" "}
          {amountNumber.toFixed(2)} €
        </p>

        {orderId && (
          <p className="mb-1">
            <span className="font-semibold">ID de la cesta:</span> {orderId}
          </p>
        )}

        <p className="mt-4 text-sm text-gray-600">
          Por favor, intenta realizar el pago nuevamente desde el detalle de tu
          pedido o contacta con nuestro servicio de atención al cliente si el
          problema persiste.
        </p>

        {customerId && orderId && (
          <div className="mt-6 flex gap-3">
            <Link
              href={`/dashboard/${customerId}/orders/${orderId}`}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Volver al pedido
            </Link>
            <Link
              href={`/dashboard/${customerId}/orders`}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver todos los pedidos
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
