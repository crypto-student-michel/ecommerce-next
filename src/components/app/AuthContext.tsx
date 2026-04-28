// "use client";

// import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
// import { verifyToken } from "@/lib/serverUtils";
// import { useRouter } from "next/navigation";
// // ❌ ELIMINADO: import { associateCestaIdWithUsername } from "@/lib/db/db";
// // ✅ AGREGADO: Usamos la Server Action
// import { associateCestaAction } from "./actions";

// export interface AuthContextType {
//   isLoggedIn: boolean;
//   setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
//   username: string;
//   setUsername: React.Dispatch<React.SetStateAction<string>>;
//   id: number;
//   setId: React.Dispatch<React.SetStateAction<number>>;
//   logout: () => void;
//   idCesta: number;
//   setIdCesta: React.Dispatch<React.SetStateAction<number>>;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [username, setUsername] = useState("");
//   const [id, setId] = useState(0);
//   const [idCesta, setIdCesta] = useState(Math.floor(Math.random() * 1000000));
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const logout = useCallback(() => {
//     setIsLoggedIn(false);
//     setUsername("");
//     setId(0);
//     setIdCesta(Math.floor(Math.random() * 1000000));
//     localStorage.removeItem("user");
//     router.push("/");
//   }, [router]);

//   useEffect(() => {
//     setLoading(true);
    
//     const storedUser = localStorage.getItem("user");
//     console.log("storedUser", storedUser);
//     if (storedUser) {
//       const user = JSON.parse(storedUser);
//       verifyToken(user.token).then(async (result: { valid: boolean; payload?: any }) => {
//         console.log("result", result);
//         if (result.valid) {
//           setIsLoggedIn(true);
//           setUsername(user.username);
//           setId(user.id);
//           // ✅ CORREGIDO: Llamada a la Server Action
//           await associateCestaAction(idCesta.toString(), user.username);
//           setLoading(false);
//         } else {
//           logout();
//           setLoading(false);
//         }
//       })
//     } else {
//       setLoading(false);
//     }
//   }, [logout, idCesta]);

//   return (
//     <AuthContext.Provider
//       value={{
//         loading,
//         idCesta,
//         setIdCesta,
//         isLoggedIn,
//         username,
//         id,
//         setIsLoggedIn,
//         setUsername,
//         setId,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// -----     07-03-26 ----- CORRECCIÓN: Adaptamos el login con los roles de admin y user ----- ////

"use client";

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { verifyToken } from "@/lib/serverUtils";
import { useRouter } from "next/navigation";
import { associateCestaAction } from "./actions";

type UserRole = "customer" | "manager" | "admin" | "";

export interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  role: UserRole;
  setRole: React.Dispatch<React.SetStateAction<UserRole>>;
  id: number;
  setId: React.Dispatch<React.SetStateAction<number>>;
  logout: () => void;
  idCesta: number;
  setIdCesta: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("");
  const [id, setId] = useState(0);
  const [idCesta, setIdCesta] = useState(Math.floor(Math.random() * 1000000));
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername("");
    setRole("");
    setId(0);
    setIdCesta(Math.floor(Math.random() * 1000000));
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  }, [router]);

  useEffect(() => {
    setLoading(true);

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      verifyToken(user.token).then(
        async (result: { valid: boolean; payload?: any }) => {
          if (result.valid) {
            setIsLoggedIn(true);
            setUsername(user.username);
            setRole(user.role || "customer");
            setId(user.id || 0);
            await associateCestaAction(idCesta.toString(), user.username);
            setLoading(false);
          } else {
            logout();
            setLoading(false);
          }
        }
      );
    } else {
      setLoading(false);
    }
  }, [logout, idCesta]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        idCesta,
        setIdCesta,
        isLoggedIn,
        username,
        role,
        setRole,
        id,
        setIsLoggedIn,
        setUsername,
        setId,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}