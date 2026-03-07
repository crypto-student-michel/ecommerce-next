// src/app/dashboard/[customerId]/orders/actions.ts
"use server";

import { getCustomerOrders, getOrder } from "@/lib/db/db";

// --- Acción para la LISTA de pedidos ---
export async function getOrdersListAction(customerId: string) {
  try {
    // getCustomerOrders devuelve: OrderID, OrderDate, RequiredDate, ShippedDate
    const orders = await getCustomerOrders(customerId);
    // Parseamos a JSON plano para evitar errores de serialización de fechas/objetos complejos
    return { success: true, data: JSON.parse(JSON.stringify(orders)) };
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    return { success: false, error: "Error al cargar pedidos." };
  }
}

// --- Acción para el DETALLE de un pedido (para el futuro) ---
export async function getOrderDetailsAction(orderId: number) {
  try {
    const result = await getOrder(orderId);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error("Error obteniendo detalle:", error);
    return { success: false, error: "Error al cargar detalle." };
  }
}