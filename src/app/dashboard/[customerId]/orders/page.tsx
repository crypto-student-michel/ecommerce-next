"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCustomerOrders } from "@/lib/db/db";
import Orders from "@/components/app/Orders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Order {
	OrderID: number;
	OrderDate: string;
	TotalImporte: number;
}

export default function CustomerOrders() {
	const { customerId } = useParams();
	const [orders, setOrders] = useState<Order[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchOrders() {
			try {
				const orderData = await getCustomerOrders(customerId as string);
				setOrders(orderData);
			} catch (err) {
				setError("Failed to fetch customer orders");
				console.error(err);
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
	if (!orders) {
		return <div>Loading...</div>;
	}
	return (
		<Orders orders={orders} customerId={customerId as string} />
	);
}

