"use server";

import { markOrderAsPaid } from "@/lib/db/db";

export async function confirmPaymentAction(orderId: number) {
  try {
    await markOrderAsPaid(orderId);
    return { success: true };
  } catch (error) {
    console.error("Error marcando pedido como pagado:", error);
    return { success: false };
  }
}