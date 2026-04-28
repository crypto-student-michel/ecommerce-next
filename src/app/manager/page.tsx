// export default function ManagerPage() {
//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6">Panel del gestor</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="rounded-lg border p-4">
//           <h2 className="text-xl font-semibold mb-2">Clientes</h2>
//           <p>Ver la lista de clientes del comercio.</p>
//         </div>

//         <div className="rounded-lg border p-4">
//           <h2 className="text-xl font-semibold mb-2">Pedidos</h2>
//           <p>Ver las últimas compras y gestionar pedidos.</p>
//         </div>

//         <div className="rounded-lg border p-4">
//           <h2 className="text-xl font-semibold mb-2">Ventas</h2>
//           <p>Analizar ventas por tiempo y categoría.</p>
//         </div>

//         <div className="rounded-lg border p-4">
//           <h2 className="text-xl font-semibold mb-2">Logs</h2>
//           <p>Consultar actividad de usuarios.</p>
//         </div>
//       </div>
//     </div>
//   );
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////// -----     07-03-26 ----- CORRECCIÓN: roles de admin y user ----- ////

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/app/AuthContext";

export default function ManagerPage() {
  const router = useRouter();
  const { loading, isLoggedIn, role } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (role !== "manager" && role !== "admin") {
        router.push("/");
      }
    }
  }, [loading, isLoggedIn, role, router]);

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!isLoggedIn || (role !== "manager" && role !== "admin")) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Panel del gestor</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {role === "admin" && (
          <Link href="/manager/users" className="rounded-lg border p-4 block hover:bg-muted">
            <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
            <p>Gestionar permisos de gestor del eCommerce.</p>
          </Link>
        )}

        <Link href="/manager/customers" className="rounded-lg border p-4 block hover:bg-muted">
          <h2 className="text-xl font-semibold mb-2">Clientes</h2>
          <p>Ver la lista de clientes del comercio.</p>
        </Link>

        <Link href="/manager/orders" className="rounded-lg border p-4 block hover:bg-muted">
          <h2 className="text-xl font-semibold mb-2">Pedidos</h2>
          <p>Ver las últimas compras y gestionar pedidos.</p>
        </Link>

        <Link href="/manager/sales" className="rounded-lg border p-4 block hover:bg-muted">
          <h2 className="text-xl font-semibold mb-2">Ventas</h2>
          <p>Analizar ventas por tiempo y categoría.</p>
        </Link>

        <Link href="/manager/logs" className="rounded-lg border p-4 block hover:bg-muted">
          <h2 className="text-xl font-semibold mb-2">Logs</h2>
          <p>Consultar actividad de usuarios.</p>
        </Link>
      </div>
    </div>
  );
}