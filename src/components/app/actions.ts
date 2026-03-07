// src/components/app/actions.ts
"use server";

import { associateCestaIdWithUsername, addToCesta } from "@/lib/db/db";

// Acción para AuthContext
export async function associateCestaAction(cestaId: string, username: string) {
  try {
    await associateCestaIdWithUsername(cestaId, username);
    return { success: true };
  } catch (error) {
    console.error("Error asociando cesta:", error);
    return { success: false };
  }
}

// Acción para el componente Cantidad
export async function addToCestaAction(cestaId: string, username: string, productId: number, cantidad: number) {
  try {
    // Nota: Asegúrate de que el orden de los argumentos coincida con tu db.ts
    // En tu db.ts anterior era: (cestaId, username, productId, cantidad)
    await addToCesta(cestaId, username, productId, cantidad);
    return { success: true };
  } catch (error) {
    console.error("Error añadiendo a cesta:", error);
    throw error; // Lanzamos error para que lo capture el componente
  }
}