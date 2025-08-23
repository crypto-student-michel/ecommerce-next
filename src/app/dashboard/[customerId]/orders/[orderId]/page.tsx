"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getOrder } from "@/lib/db/db";
import { Redsys } from "@/components/app/Redsys";
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
  TotalAmount: number;
}

export default function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      
      try {
        const orderData = await getOrder(orderId as string);
        setOrder(orderData);
      } catch (err) {
        setError("Failed to fetch order details");
        console.error(err);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Details</h1>
      
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
              <TableCell>{new Date(order.OrderDate).toLocaleDateString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Required Date</TableCell>
              <TableCell>{new Date(order.RequiredDate).toLocaleDateString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Shipped Date</TableCell>
              <TableCell>{order.ShippedDate ? new Date(order.ShippedDate).toLocaleDateString() : 'Not shipped yet'}</TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell className="font-medium">Ship Via</TableCell>
              <TableCell>{order.ShipVia}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Freight</TableCell>
              <TableCell>${order.Freight.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship Name</TableCell>
              <TableCell>{order.ShipName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship Address</TableCell>
              <TableCell>{order.ShipAddress}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship City</TableCell>
              <TableCell>{order.ShipCity}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship Region</TableCell>
              <TableCell>{order.ShipRegion || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship Postal Code</TableCell>
              <TableCell>{order.ShipPostalCode}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ship Country</TableCell>
              <TableCell>{order.ShipCountry}</TableCell>
            </TableRow> */}
          </TableBody>
        </Table>
      </div>

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
            {order.Details.map((detail) => (
              <TableRow key={detail.ProductID}>
                <TableCell>{detail.ProductID}</TableCell>
                <TableCell>{detail.ProductName}</TableCell>
                <TableCell>${detail.UnitPrice.toFixed(2)}</TableCell>
                <TableCell>{detail.Quantity}</TableCell>
                <TableCell>{(detail.Discount * 100).toFixed(0)}%</TableCell>
                <TableCell>${(detail.UnitPrice * detail.Quantity * (1 - detail.Discount)).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <h3 className="text-lg font-semibold">Total Amount: ${order.TotalAmount.toFixed(2)}</h3>
        <Redsys amount={order.TotalAmount.toFixed(2).toString().replace(/[,.]/g,"")} orderId={order.OrderID.toString()} />
      </div>
    </div>
  );
}
