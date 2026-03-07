// src/app/signup/actions.ts
"use server"; 

import { insertUser } from "@/lib/db/db";

// Definimos el tipo de datos que esperamos recibir del cliente
type SignupData = {
  username: string;
  password: string; // Ya vendrá hasheada del cliente
  acceptPolicy: boolean;
  acceptMarketing: boolean;
}

export async function registerUser(data: SignupData) {
  try {
    // CORRECCIÓN AQUÍ: Pasamos los argumentos separados por coma, NO un objeto.
    // Nota: Si tu función insertUser en db.ts solo acepta 2 argumentos, 
    // tendrás que actualizar db.ts para que acepte los booleanos también.
    await insertUser(
      data.username, 
      data.password, 
      data.acceptPolicy, 
      data.acceptMarketing
    );

    return { success: true, message: "Usuario creado correctamente" };
    
  } catch (error) {
    console.error("Error en server action:", error);
    return { success: false, message: "Error al registrar usuario en base de datos" };
  }
}