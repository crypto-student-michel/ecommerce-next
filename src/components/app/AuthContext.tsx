"use client";

import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { verifyToken } from "@/lib/serverUtils";
import { useRouter } from "next/navigation";
import { associateCestaIdWithUsername } from "@/lib/db/db";



/**
 * Represents the shape of the authentication context.
 */
export interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  id: number;
  setId: React.Dispatch<React.SetStateAction<number>>;
  logout: () => void;
  idCesta: number;
  setIdCesta: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
}

/**
 * Creates the authentication context with undefined as the default value.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use the authentication context.
 * @throws {Error} If used outside of an AuthProvider.
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider component that manages the authentication state.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [id, setId] = useState(0);
  const [idCesta, setIdCesta] = useState(Math.floor(Math.random() * 1000000));
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Logs out the user and resets the authentication state.
   */
  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername("");
    setId(0);
    setIdCesta(Math.floor(Math.random() * 1000000));
    localStorage.removeItem("user");
    router.push("/");
  }, [router]);

  useEffect(() => {
    setLoading(true);
    
    const storedUser = localStorage.getItem("user");
    console.log("storedUser", storedUser);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Verify the token with the server
      verifyToken(user.token).then(async (result: { valid: boolean; payload?: any }) => {
        console.log("result", result);
        if (result.valid) {
          setIsLoggedIn(true);
          setUsername(user.username);
          setId(user.id);
          await associateCestaIdWithUsername(idCesta.toString(), user.username);
          setLoading(false);
        } else {
          logout();
          setLoading(false);
        }
      })
    } else {
      setLoading(false);
    }
    // Verify the token with the server
   
  }, [logout, idCesta]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        idCesta,
        setIdCesta,
        isLoggedIn,
        username,
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
