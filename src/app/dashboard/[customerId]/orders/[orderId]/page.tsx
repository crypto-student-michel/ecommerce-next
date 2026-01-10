// ❌ IMPORTANTE: elimina "use client" de arriba del fichero

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Redsys from "@/components/app/Redsys";
import { getOrder } from "@/lib/db/db";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    customerId: string;
    orderId: string;
  };
};

interface OrderDetail {
  ProductID: number;
  ProductName: string;
  UnitPrice: number;
  Quantity: number;
  Discount: number;
}

interface Order {
  OrderID: number;
  OrderDate: string;
  RequiredDate: string;
  ShippedDate: string | null;
  ShipVia: number;
  Freight: number;
  ShipName: string;
  ShipAddress: string;
  ShipCity: string;
  ShipRegion: string | null;
  ShipPostalCode: string;
  ShipCountry: string;
  Details: OrderDetail[];
  TotalAmount: number; // en euros
}

// 👉 Ahora es un Server Component asíncrono
export default async function OrderPage({ params }: PageProps) {
  const { orderId } = params;

  // Cargamos el pedido directamente en el servidor
  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Details</h1>

      {/* Información general del pedido */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order Information</h2>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Order ID</TableCell>
              <TableCell>{order.OrderID}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Order Date</TableCell>
              <TableCell>
                {new Date(order.OrderDate).toLocaleDateString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Required Date</TableCell>
              <TableCell>
                {new Date(order.RequiredDate).toLocaleDateString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Shipped Date</TableCell>
              <TableCell>
                {order.ShippedDate
                  ? new Date(order.ShippedDate).toLocaleDateString()
                  : "Not shipped yet"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Detalle de líneas del pedido */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Order Details</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.Details.map((detail: OrderDetail) => (
              <TableRow key={detail.ProductID}>
                <TableCell>{detail.ProductID}</TableCell>
                <TableCell>{detail.ProductName}</TableCell>
                <TableCell>${detail.UnitPrice.toFixed(2)}</TableCell>
                <TableCell>{detail.Quantity}</TableCell>
                <TableCell>{(detail.Discount * 100).toFixed(0)}%</TableCell>
                <TableCell>
                  $
                  {(
                    detail.UnitPrice *
                    detail.Quantity *
                    (1 - detail.Discount)
                  ).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <h3 className="text-lg font-semibold">
          Total Amount: ${order.TotalAmount.toFixed(2)}
        </h3>

        {/* Pasarela Redsys: le pasamos euros y OrderID como número */}
        <Redsys customerId={params.customerId} amount={order.TotalAmount} orderId={Number(order.OrderID)} />

      </div>
    </div>
  );
}
