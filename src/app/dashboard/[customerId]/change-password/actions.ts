"use server";

import { verifyUser, setPassword } from "@/lib/db/db";

export async function changePasswordAction(username: string, currentPassHash: string, newPassHash: string) {
  try {
    // 1. Verificamos que la contraseña actual sea correcta
    // Usamos verifyUser que ya tienes implementado en db.ts
    const user = await verifyUser(username, currentPassHash);

    if (!user) {
      return { success: false, message: "La contraseña actual es incorrecta." };
    }

    // 2. Si es correcta, actualizamos con la nueva contraseña
    // setPassword (de tu db.ts) se encargará de guardarla
    await setPassword(username, newPassHash);

    return { success: true };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { success: false, message: "Error en el servidor al cambiar la contraseña." };
  }
}