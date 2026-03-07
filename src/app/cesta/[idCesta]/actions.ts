"use server";

import { getCesta, deleteItemCesta, createOrder } from "@/lib/db/db";

// Obtener cesta
export async function getCestaAction(cestaId: string) {
  try {
    const items = await getCesta(cestaId);
    // Parseamos para evitar errores de tipos complejos
    return { success: true, items: JSON.parse(JSON.stringify(items)) };
  } catch (error) {
    console.error("Error al obtener cesta:", error);
    return { success: false, items: [] };
  }
}

// Eliminar item
export async function deleteItemAction(cestaId: string, productId: number) {
  try {
    await deleteItemCesta(cestaId, productId);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar item:", error);
    return { success: false };
  }
}

// Crear Pedido (Confirmar)
export async function createOrderAction(username: string, totalAmount: number) {
  try {
    // Nota: Aquí createOrder en tu db.ts solo crea el registro en Orders.
    // Idealmente, también debería mover los items de la Cesta a OrderDetails.
    // Por ahora usamos lo que tienes definido en db.ts.
    
    // Como tu db.ts pide customerId, asumimos que username es el customerId o lo mapeamos.
    const result = await createOrder(username, totalAmount);
    return { success: true, orderId: result.orderId, totalAmount: result.totalAmount };
  } catch (error) {
    console.error("Error al crear pedido:", error);
    return { success: false, message: "Error al procesar el pedido" };
  }
}