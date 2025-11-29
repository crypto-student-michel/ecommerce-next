/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getRedsysCheckout,
  type RedsysCheckoutResponse,
} from "@/lib/redsys";
import { Button } from "@/components/ui/button";

interface RedsysProps {
  amount: number;   // importe en euros (ej: 441)
  orderId: number;  // ID del pedido (OrderID de tu tabla)
}

export default function Redsys({ amount, orderId }: RedsysProps) {
  // /dashboard/[customerId]/orders/[orderId]
  const { customerId } = useParams<{ customerId: string }>();

  const [redsys, setRedsys] = useState<RedsysCheckoutResponse | null>(null);

  useEffect(() => {
    // Aseguramos navegador + customerId
    if (!customerId) return;
    if (typeof window === "undefined") return;

    const origin = window.location.origin;

    try {
      // 1) Pasamos de euros a céntimos
      const amountInCents = Math.round(Number(amount) * 100);

      // 2) Llamada a la función de Redsys (lado servidor)
      const redsysData = getRedsysCheckout(
        customerId,
        origin,
        amountInCents,
        orderId
      );

      setRedsys(redsysData);
    } catch (error: any) {
      console.error("Error fetching Redsys data:", error);
    }
  }, [customerId, amount, orderId]);

  // Mientras no tengamos los datos, no mostramos nada
  if (!redsys) {
    return null;
  }

  return (
    <form action={redsys.url} method="POST" name="redsys-checkout">
      <input
        type="hidden"
        name="Ds_SignatureVersion"
        value={redsys.signatureVersion}
      />
      <input
        type="hidden"
        name="Ds_MerchantParameters"
        value={redsys.merchantParameters}
      />
      <input type="hidden" name="Ds_Signature" value={redsys.signature} />

      <Button
        variant="outline"
        className="bg-green-500 hover:bg-green-600 text-white"
        type="submit"
      >
        Pasarela de pago
      </Button>
    </form>
  );
}

/*
  Datos de prueba (entorno Redsys):
  Tarjeta:   4548810000000003
  Caducidad: 12/29
  CVC:       123
  Cliente:   ALFKI
*/
