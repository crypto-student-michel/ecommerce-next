// src/app/dashboard/[customerId]/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// ✅ IMPORTACIÓN SEGURA
import { getCustomerAction } from "./actions";
import { Button } from "@/components/ui/button";

interface Customer {
  CustomerID: string;
  CompanyName: string;
  ContactName: string;
  ContactTitle: string;
  Address: string;
  City: string;
  Region: string;
  PostalCode: string;
  Country: string;
  Phone: string;
}

export default function ProfilePage() {
  const params = useParams();
  const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!customerId) return;
      
      const result = await getCustomerAction(customerId);
      if (result.success && result.customer) {
        setCustomer(result.customer as Customer);
      }
      setLoading(false);
    }
    loadProfile();
  }, [customerId]);

  if (loading) return <div className="p-8">Cargando perfil...</div>;
  if (!customer) return <div className="p-8">Perfil no encontrado.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 border rounded shadow-md bg-white">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-gray-600">ID Cliente</label>
          <p>{customer.CustomerID}</p>
        </div>
        <div>
          <label className="font-semibold text-gray-600">Empresa</label>
          <p>{customer.CompanyName}</p>
        </div>
        <div>
          <label className="font-semibold text-gray-600">Contacto</label>
          <p>{customer.ContactName}</p>
        </div>
        <div>
          <label className="font-semibold text-gray-600">Título</label>
          <p>{customer.ContactTitle}</p>
        </div>
         <div>
          <label className="font-semibold text-gray-600">Teléfono</label>
          <p>{customer.Phone}</p>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Dirección</h2>
        <p>{customer.Address}</p>
        <p>
          {customer.City}, {customer.Region ? `${customer.Region}, ` : ""} 
          {customer.PostalCode}
        </p>
        <p>{customer.Country}</p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href={`/dashboard/${customerId}/profile/edit`}>
          <Button>Editar Perfil</Button>
        </Link>
        <Link href={`/dashboard/${customerId}/change-password`}>
          <Button variant="outline">Cambiar Contraseña</Button>
        </Link>
      </div>
    </div>
  );
}