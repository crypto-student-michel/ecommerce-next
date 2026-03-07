"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/app/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ✅ Importamos las Server Actions
import { getCestaAction, deleteItemAction, createOrderAction } from "./actions";

interface CestaItem {
  id: number;
  productId: number; // Asegúrate de que coincida con lo que devuelve tu DB (a veces es productId o ProductID)
  cantidad: number;
  ProductName: string; // ✅ Campo nuevo
  UnitPrice: number;   // ✅ Campo nuevo
}

export default function Cesta() {
  const params = useParams();
  const idCesta = Array.isArray(params.idCesta) ? params.idCesta[0] : params.idCesta;

  const { isLoggedIn, username, loading } = useAuth();

  const [cestaItems, setCestaItems] = useState<CestaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{ orderId: number; totalAmount: number } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Cargar la cesta usando la Server Action
  useEffect(() => {
    async function fetchCesta() {
      if (!idCesta) return;
      setIsLoadingData(true);
      
      const result = await getCestaAction(idCesta);
      
      if (result.success) {
        // Mapeamos por si acaso la DB devuelve mayúsculas/minúsculas diferentes
        const itemsMapped = result.items.map((item: any) => ({
          id: item.id,
          productId: item.productId || item.ProductID,
          cantidad: item.cantidad,
          ProductName: item.ProductName,
          UnitPrice: item.UnitPrice
        }));
        setCestaItems(itemsMapped);
      } else {
        setError("Error al cargar la cesta");
      }
      setIsLoadingData(false);
    }

    fetchCesta();
  }, [idCesta]);

  // 2. Calcular total
  const totalAmount = cestaItems.reduce((acc, item) => {
    const precio = item.UnitPrice || 0;
    return acc + (precio * item.cantidad);
  }, 0);

  // 3. Eliminar item
  const handleDelete = async (productId: number) => {
    if (!idCesta) return;
    await deleteItemAction(idCesta, productId);
    setCestaItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // 4. Confirmar Pedido usando Server Action
  const handleConfirmOrder = async () => {
    if (!isLoggedIn || !username) {
      setError("Debes iniciar sesión para confirmar el pedido.");
      return;
    }

    try {
      const result = await createOrderAction(username, totalAmount);

      if (result.success) {
        setOrder({
          orderId: result.orderId!,
          totalAmount: result.totalAmount!,
        });
        setError(null);
      } else {
        setError(result.message || "No se pudo confirmar el pedido.");
      }
    } catch (e) {
      console.error(e);
      setError("Error inesperado al confirmar.");
    }
  };

  if (loading || isLoadingData) return <div className="p-8">Cargando...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tu Cesta</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cestaItems.length === 0 ? (
        <p>Tu cesta está vacía. <Link href="/products" className="text-blue-500 hover:underline">Ir a productos</Link></p>
      ) : (
        <div className="grid gap-4">
          {cestaItems.map((item) => (
            <Card key={item.id || item.productId}>
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/products/${item.productId}`}
                    className="hover:underline"
                  >
                    {item.ProductName || "Producto sin nombre"}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Precio:</strong> ${item.UnitPrice}</p>
                <p><strong>Cantidad:</strong> {item.cantidad}</p>
                <p className="text-blue-600 font-bold mt-2">
                  Subtotal: ${(item.UnitPrice * item.cantidad).toFixed(2)}
                </p>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => handleDelete(item.productId)}
                >
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          ))}
          
          <div className="mt-8 border-t pt-4 text-right">
             <h2 className="text-2xl font-bold">Total: ${totalAmount.toFixed(2)}</h2>
          </div>
        </div>
      )}

      {cestaItems.length > 0 && !order && (
        <div className="mt-6">
          {!isLoggedIn ? (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Atención</p>
              <p>Para confirmar pedido y pagar, es necesario autenticarse primero.</p>
            </div>
          ) : (
            <Button onClick={handleConfirmOrder} className="mt-4 w-full md:w-auto" size="lg">
              Confirmar Pedido
            </Button>
          )}
        </div>
      )}

      {order && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-xl font-bold text-green-700 mb-2">¡Pedido Confirmado!</h3>
          <p>ID de Pedido: {order.orderId}</p>
          <p>Total: ${order.totalAmount}</p>
          <div className="mt-4">
            <Link href={`/dashboard/${username}/orders/${order.orderId}`}>
              <Button variant="outline">Ver detalle del pedido</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}