"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrdersListAction } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ Actualizamos la interfaz para incluir Paid
interface Order {
  OrderID: number;
  OrderDate: string;
  RequiredDate?: string;
  ShippedDate?: string;
  TotalAmount?: number;
  Paid: number; // 0 = Pendiente, 1 = Pagado
}

export default function CustomerOrders() {
  const params = useParams();
  const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const result = await getOrdersListAction(customerId);

        if (result.success && result.data) {
          setOrders(result.data as Order[]);
        } else {
          setError(result.error || "Error desconocido al obtener pedidos");
        }
      } catch (err) {
        setError("Error al cargar los pedidos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [customerId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <div className="p-8">Cargando historial...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial de Pedidos</h1>
      
      {orders.length === 0 ? (
        <div className="text-center p-8 border rounded bg-gray-50">
          <p className="text-gray-600 mb-4">No tienes pedidos realizados todavía.</p>
          <Link href="/products">
            <Button>Ir a comprar</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.OrderID} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold">
                  Pedido #{order.OrderID}
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {new Date(order.OrderDate).toLocaleDateString()}
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    {/* Estado de Envío */}
                    <p className="text-sm font-medium">
                      Estado Envío:{" "}
                      <span className={order.ShippedDate ? "text-green-600" : "text-orange-500"}>
                        {order.ShippedDate 
                          ? `Enviado el ${new Date(order.ShippedDate).toLocaleDateString()}` 
                          : "Pendiente de envío"}
                      </span>
                    </p>

                    {/* ✅ NUEVO: Estado de Pago */}
                    <p className="text-sm font-bold">
                       Estado Pago:{" "}
                       <span className={order.Paid ? "text-green-600" : "text-red-600"}>
                          {order.Paid ? "PAGADO ✅" : "PENDIENTE ❌"}
                       </span>
                    </p>

                    {/* Importe Total */}
                    <p className="text-lg font-bold text-blue-700">
                      Importe: ${order.TotalAmount ? order.TotalAmount.toFixed(2) : "0.00"}
                    </p>
                  </div>
                  
                  <Link href={`orders/${order.OrderID}`}>
                    <Button variant="outline" size="sm">Ver Detalles</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}