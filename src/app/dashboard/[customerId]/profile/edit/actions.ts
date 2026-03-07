"use server";

import { saveCustomer, getCustomer } from "@/lib/db/db";

// Acción para obtener datos iniciales (para rellenar el formulario)
export async function getCustomerForEditAction(customerId: string) {
  try {
    const customer = await getCustomer(customerId);
    return { success: true, customer };
  } catch (error) {
    return { success: false, error: "Error al cargar datos" };
  }
}

// Acción para guardar los cambios
export async function updateCustomerAction(customerId: string, data: any) {
  try {
    await saveCustomer(customerId, data);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return { success: false, error: "Error al guardar los cambios" };
  }
}