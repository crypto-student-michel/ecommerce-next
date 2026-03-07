"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Redsys from "@/components/app/Redsys";

// ✅ Importamos la acción segura desde la carpeta padre
import { getOrderDetailsAction } from "../actions";

// Tipos adaptados a la respuesta de tu DB + Cálculos
interface ProductDetail {
  ProductID: number;
  ProductName: string;
  UnitPrice: number;
  Quantity: number;
  Discount: number;
}

interface OrderData {
  order: {
    OrderID: number;
    OrderDate: string;
    RequiredDate?: string;
    ShippedDate?: string | null;
  };
  details: ProductDetail[];
}

export default function OrderPage() {
  const params = useParams();
  
  // Manejo robusto de parámetros (pueden ser array o string)
  const orderIdParam = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const customerIdParam = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
  
  const orderId = orderIdParam ? parseInt(orderIdParam) : 0;

  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const result = await getOrderDetailsAction(orderId);
        if (result.success && result.data) {
          setData(result.data as OrderData);
        } else {
          setError(result.error || "Pedido no encontrado");
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="p-8">Cargando detalles del pedido...</div>;
  if (error || !data) return (
    <Alert variant="destructive" className="m-8">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error || "No se pudo cargar el pedido"}</AlertDescription>
    </Alert>
  );

  // Calcular el total total del pedido sumando las líneas
  const totalAmount = data.details.reduce((acc, item) => {
    const lineTotal = item.UnitPrice * item.Quantity * (1 - item.Discount);
    return acc + lineTotal;
  }, 0);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Order Details</h1>

      {/* Información general */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order Information</h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Order ID</TableCell>
              <TableCell>{data.order.OrderID}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Order Date</TableCell>
              <TableCell>
                {new Date(data.order.OrderDate).toLocaleDateString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Shipped Date</TableCell>
              <TableCell>
                {data.order.ShippedDate
                  ? new Date(data.order.ShippedDate).toLocaleDateString()
                  : "Not shipped yet"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Detalle de productos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order Details</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.details.map((detail) => {
              const lineTotal = detail.UnitPrice * detail.Quantity * (1 - detail.Discount);
              return (
                <TableRow key={detail.ProductID}>
                  <TableCell>{detail.ProductName}</TableCell>
                  <TableCell>${detail.UnitPrice.toFixed(2)}</TableCell>
                  <TableCell>{detail.Quantity}</TableCell>
                  <TableCell>{(detail.Discount * 100).toFixed(0)}%</TableCell>
                  <TableCell>${lineTotal.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <h3 className="text-lg font-semibold text-right mt-4">
          Total Amount: ${totalAmount.toFixed(2)}
        </h3>

        {/* Pasarela Redsys Integrada */}
        <div className="mt-6 flex justify-end">
           <Redsys 
             customerId={customerIdParam || ""} 
             amount={totalAmount} 
             orderId={data.order.OrderID} 
           />
        </div>
      </div>
    </div>
  );
}