// "use server";

// import { verifyUser, associateCestaIdWithUsername } from "@/lib/db/db";

// // Definimos los tipos de entrada y salida
// type LoginInput = {
//   username: string;
//   password: string; // Ya vendrá hasheada del cliente (si así lo decides)
//   cestaId: string;
// };

// export async function loginAction(data: LoginInput) {
//   try {
//     // 1. Verificar credenciales en BD
//     const result = await verifyUser(data.username, data.password);

//     if (!result) {
//       return { success: false, message: "Usuario o contraseña incorrectos" };
//     }

//     // 2. Si el login es correcto, asociamos la cesta al usuario
//     if (data.cestaId) {
//       await associateCestaIdWithUsername(data.cestaId, result.username);
//     }

//     // 3. Devolvemos éxito y el token
//     return { 
//       success: true, 
//       user: {
//         username: result.username,
//         token: result.token
//         // id: result.id // Si verifyUser devuelve ID, agrégalo aquí
//       } 
//     };

//   } catch (error) {
//     console.error("Error en login action:", error);
//     return { success: false, message: "Error interno del servidor" };
//   }
// }

////// -----     07-03-26 ----- CORRECCIÓN: Agregamos filtrado por categoría y el componente SidenavCategories ----- ////
///////   -  y tambien adaptamos el login con los roles de admin y user ----- ////

"use server";

import { verifyUser, associateCestaIdWithUsername } from "@/lib/db/db";

type LoginInput = {
  username: string;
  password: string;
  cestaId: string;
};

export async function loginAction(data: LoginInput) {
  try {
    const result = await verifyUser(data.username, data.password);

    if (!result) {
      return { success: false, message: "Usuario o contraseña incorrectos" };
    }

    if (data.cestaId) {
      await associateCestaIdWithUsername(data.cestaId, result.username);
    }

    return {
      success: true,
      user: {
        username: result.username,
        role: result.role,
        token: result.token,
      },
    };
  } catch (error) {
    console.error("Error en login action:", error);
    return { success: false, message: "Error interno del servidor" };
  }
}