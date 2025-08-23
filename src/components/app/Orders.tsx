import React from 'react'
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from '@/components/ui/table';
function Orders({orders, customerId}: {orders: any[], customerId: string}) {

  return (
    <div className="container mx-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Pagado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.OrderID}>
              <TableCell>
                <Link href={`/dashboard/${customerId}/orders/${order.OrderID}`}>
                  {order.OrderID}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(order.OrderDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {order.TotalImporte}
              </TableCell>
              <TableCell>{order.Cobrado ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default Orders