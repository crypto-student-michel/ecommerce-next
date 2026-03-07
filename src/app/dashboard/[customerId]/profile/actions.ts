// src/app/dashboard/[customerId]/profile/actions.ts
"use server";

import { getCustomer } from "@/lib/db/db";

export async function getCustomerAction(customerId: string) {
  try {
    const customer = await getCustomer(customerId);
    
    if (!customer) {
      return { success: false, error: "Cliente no encontrado" };
    }

    return { success: true, customer };
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return { success: false, error: "Error al cargar el perfil" };
  }
}