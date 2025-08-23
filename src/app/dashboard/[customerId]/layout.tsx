"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import ProtectedRoute from "@/components/app/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ Opción 1 (genérico correcto)
  // const { customerId } = useParams<{ customerId: string }>();

  // ✅ Opción 2 (más robusta en TSX si te da problemas con <>)
  const { customerId } = useParams() as { customerId: string };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <nav className="bg-gray-800 text-white p-4">
          <ul className="flex space-x-4">
            <li>
              <Link
                href={`/dashboard/${customerId}/orders`}
                className={`hover:text-gray-300 ${
                  pathname.endsWith("/orders") ? "font-bold" : ""
                }`}
              >
                Orders
              </Link>
            </li>

            <li>
              <Link
                href={`/dashboard/${customerId}/profile`}
                className={`hover:text-gray-300 ${
                  pathname.endsWith("/profile") ? "font-bold" : ""
                }`}
              >
                Profile
              </Link>
            </li>

            <li>
              <Link
                href={`/dashboard/${customerId}/change-password`}
                className={`hover:text-gray-300 ${
                  pathname.endsWith("/change-password") ? "font-bold" : ""
                }`}
              >
                Change Password
              </Link>
            </li>
          </ul>
        </nav>

        <main className="flex-grow p-4">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
