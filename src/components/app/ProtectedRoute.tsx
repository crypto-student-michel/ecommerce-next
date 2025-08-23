// src/components/app/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/components/app/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProtectedRoute component
 * 
 * This component is used to protect routes that require authentication.
 * It checks if the user is logged in and redirects to the login page if not.
 * 
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to render if authenticated
 * @returns {React.ReactNode | null} The children if authenticated, null otherwise
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { username, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page if not authenticated and not loading
    if (!username && !loading) {
      router.push("/login");
    }
  }, [username, loading, router]);

  // Show nothing while loading
  if (loading) return null;

  // Render children only if authenticated
  return username ? children : null;
};

export default ProtectedRoute;
