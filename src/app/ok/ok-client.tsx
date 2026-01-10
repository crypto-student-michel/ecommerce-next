"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  customerId: string;
  amount?: string;

  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;

  redirectSeconds?: number;
};

export default function OkClient(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [seconds, setSeconds] = useState(props.redirectSeconds ?? 3);

  const orderIdNum = useMemo(() => Number(String(props.orderId).replace(/\D/g, "")), [props.orderId]);

  const ordersListUrl = useMemo(() => {
    return props.customerId ? `/dashboard/${props.customerId}/orders` : `/dashboard/orders`;
  }, [props.customerId]);

  const orderDetailsUrl = useMemo(() => {
    return props.customerId
      ? `/dashboard/${props.customerId}/orders/${orderIdNum}`
      : `/dashboard/orders/${orderIdNum}`;
  }, [props.customerId, orderIdNum]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch("/api/redsys/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderIdNum,
            customerId: props.customerId,
            amount: props.amount,

            Ds_SignatureVersion: props.Ds_SignatureVersion,
            Ds_MerchantParameters: props.Ds_MerchantParameters,
            Ds_Signature: props.Ds_Signature,
          }),
        });

        const data = await r.json().catch(() => ({}));

        if (!alive) return;

        if (r.ok && data?.ok) {
          setOk(true);
          setMsg("Cobro guardado exitosamente.");
        } else {
          setOk(false);
          setMsg(data?.error || "No se pudo confirmar el cobro automáticamente.");
        }
      } catch (e: any) {
        if (!alive) return;
        setOk(false);
        setMsg(String(e?.message || e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    orderIdNum,
    props.customerId,
    props.amount,
    props.Ds_SignatureVersion,
    props.Ds_MerchantParameters,
    props.Ds_Signature,
  ]);

  useEffect(() => {
    if (loading) return;

    // redirigir siempre (haya ok o no), pero con mensaje previo
    const t = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (seconds <= 0) {
      router.push(orderDetailsUrl);
    }
  }, [seconds, loading, router, orderDetailsUrl]);

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold text-green-700">
          ¡Pago Exitoso!
        </h1>

        <p className="mt-4 text-gray-700">Tu pago se ha procesado correctamente.</p>

        <p className="mt-4">
          <span className="font-semibold">ID del pedido:</span>{" "}
          <Link className="underline" href={orderDetailsUrl}>
            {orderIdNum}
          </Link>
        </p>

        {props.amount ? (
          <p className="mt-2">
            <span className="font-semibold">Cantidad pagada:</span> {props.amount} €
          </p>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <p className="text-gray-600">Confirmando cobro...</p>
          ) : ok ? (
            <p className="text-green-700">{msg}</p>
          ) : (
            <p className="text-red-600">{msg}</p>
          )}
        </div>

        {!loading && (
          <p className="mt-4 text-gray-600">Redirigiendo en {seconds}s...</p>
        )}

        <div className="mt-4 flex gap-4">
          <Link className="underline" href={orderDetailsUrl}>
            Ir ahora
          </Link>
          <Link className="underline" href={ordersListUrl}>
            Ver lista de pedidos
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Gracias por tu compra. Recibirás un correo electrónico con los detalles de tu pedido.
        </p>
      </div>
    </div>
  );
}
