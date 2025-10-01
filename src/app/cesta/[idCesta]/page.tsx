"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAuth } from "@/components/app/AuthContext";
import { getCesta, createOrder } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CestaItem {
  ProductID: number;
  ProductName: string;
  cantidad: number;
}

type Params = { idCesta: string };

export default function Cesta() {
  // ✅ tipamos el parámetro de la ruta como string
  const { idCesta } = useParams<Params>();

  const { isLoggedIn, username, loading } = useAuth();

  const [cestaItems, setCestaItems] = useState<CestaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ orderId y totalAmount son números (no string)
  const [order, setOrder] = useState<{ orderId: number; totalAmount: number } | null>(null);

  useEffect(() => {
    async function fetchCesta() {
      try {
        const items = await getCesta(idCesta);
        setCestaItems(items);
      } catch (err) {
        console.error(err);
        setError("Error al cargar la cesta");
      }
    }
    fetchCesta();
  }, [idCesta]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const handleConfirmOrder = async () => {
    if (!isLoggedIn || !username) {
      setError("Debes iniciar sesión para confirmar el pedido.");
      return;
    }
    try {
      const { orderId, totalAmount } = await createOrder(username, idCesta);
      // ✅ guardamos números en el estado
      setOrder({ orderId: orderId ?? 0, totalAmount: totalAmount ?? 0 });
    } catch (e) {
      console.error(e);
      setError("No se pudo confirmar el pedido.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tu Cesta</h1>

      {cestaItems.length === 0 ? (
        <p>Tu cesta está vacía</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cestaItems.map((item) => (
            <Card key={item.ProductID}>
              <CardHeader>
                <CardTitle>
                  {/* ✅ detalle en plural /products y query cantidad opcional */}
                  <Link
                    href={`/products/${item.ProductID}${
                      item.cantidad ? `?cantidad=${item.cantidad}` : ""
                    }`}
                    prefetch={false}
                  >
                    {item.ProductName}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Nombre del Producto: {item.ProductName}</p>
                <p>ID del Producto: {item.ProductID}</p>
                <p>Cantidad: {item.cantidad}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link href="/products" className="text-blue-500 hover:underline">
          Seguir comprando
        </Link>
      </div>

      {cestaItems.length > 0 && (
        <div className="mt-6">
          {!isLoggedIn ? (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
              role="alert"
            >
              <p className="font-bold">Atención</p>
              <p>Para confirmar pedido y pagar, es necesario autenticarse primero.</p>
            </div>
          ) : (
            <>
              <Button onClick={handleConfirmOrder} className="mt-4">
                Confirmar Pedido
              </Button>

              {order && (
                <div className="mt-6">
                  <Link href={`/dashboard/${username}/orders/${order.orderId}`}>
                    Ver mi pedido
                  </Link>
                  {/* Aquí podrías montar tu componente de pago con order.totalAmount */}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
