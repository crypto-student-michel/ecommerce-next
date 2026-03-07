"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmPaymentAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 1. Creamos un componente interno que maneja la lógica de la URL
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    async function confirmPayment() {
      if (!orderIdParam) {
        setStatus("error");
        return;
      }

      const orderId = parseInt(orderIdParam);
      const result = await confirmPaymentAction(orderId);

      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }

    confirmPayment();
  }, [orderIdParam]);

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="flex justify-center mb-4 text-4xl">
          {status === "processing" && "⏳"}
          {status === "success" && "✅"}
          {status === "error" && "⚠️"}
        </div>
        <CardTitle className="text-2xl">
          {status === "processing" && "Procesando pago..."}
          {status === "success" && "¡Pago Confirmado!"}
          {status === "error" && "Error al registrar el pago"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <>
            <p className="text-gray-600 mb-6">
              Tu pedido #{orderIdParam} ha sido pagado y registrado correctamente en el sistema.
            </p>
            <Link href={`/dashboard/ALFKI/orders`}> 
              <Button className="w-full">Volver a mis Pedidos</Button>
            </Link>
          </>
        )}
        
        {status === "error" && (
          <p className="text-red-500">
            Hubo un problema confirmando el pedido en la base de datos, aunque el banco haya aceptado el pago. Contacta con soporte.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// 2. El componente principal envuelve al contenido en Suspense
// Esto le dice a Next.js: "Espera a tener los datos del cliente antes de renderizar esto"
export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<div className="text-lg">Cargando confirmación...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}