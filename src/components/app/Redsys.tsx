/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getRedsysCheckout, type RedsysCheckoutResponse } from "@/lib/redsys";
import { Button } from "@/components/ui/button";

interface RedsysProps {
  amount: string;   // importe en céntimos, como string (ej: "19800")
  orderId: string;  // ID del pedido (OrderID)
}

export function Redsys({ amount, orderId }: RedsysProps) {
  // /dashboard/[customerId]/orders/[orderId]
  const { customerId } = useParams<{ customerId: string }>();

  const [redsys, setRedsys] = useState<RedsysCheckoutResponse | null>(null);

  useEffect(() => {
    // Aseguramos que estamos en el navegador y que tenemos customerId
    if (!customerId) return;
    if (typeof window === "undefined") return;

    const origin = window.location.origin;

    getRedsysCheckout(customerId as string, origin, amount, orderId)
      .then((redsysData: RedsysCheckoutResponse) => {
        setRedsys(redsysData);
      })
      .catch((error: any) => {
        console.error("Error fetching Redsys data:", error);
      });
  }, [customerId, amount, orderId]);

  if (!redsys) {
    return null; // o un loader si quieres
  }

  // Datos de prueba:
  // Tarjeta: 4548810000000003
  // Caducidad: 12/29
  // CVC: 123

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
      <input
        type="hidden"
        name="Ds_Signature"
        value={redsys.signature}
      />

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
