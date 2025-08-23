"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCustomer } from "@/lib/db/db";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Customer {
  CustomerID: string;
  CompanyName: string;
  ContactName: string;
  ContactTitle: string;
  Address: string;
  City: string;
  Region: string | null;
  PostalCode: string;
  Country: string;
  Phone: string;
  Fax: string | null;
}

export default function CustomerProfile() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const customerData = await getCustomer(customerId as string);
        setCustomer(customerData);
      } catch (err) {
        setError("Failed to fetch customer data");
        console.error(err);
      }
    }

    fetchCustomer();
  }, [customerId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!customer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customer Profile</h1>
      <div className="flex justify-end mb-4">
        <Link
          href={`/dashboard/${customerId}/profile/edit`}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Edit Profile
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Company Information
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium text-gray-600">Company Name:</span>{" "}
              {customer.CompanyName}
            </p>
            <p>
              <span className="font-medium text-gray-600">Contact Name:</span>{" "}
              {customer.ContactName}
            </p>
            <p>
              <span className="font-medium text-gray-600">Contact Title:</span>{" "}
              {customer.ContactTitle}
            </p>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Contact Information
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium text-gray-600">Address:</span>{" "}
              {customer.Address}
            </p>
            <p>
              <span className="font-medium text-gray-600">City:</span>{" "}
              {customer.City}
            </p>
            <p>
              <span className="font-medium text-gray-600">Region:</span>{" "}
              {customer.Region || "N/A"}
            </p>
            <p>
              <span className="font-medium text-gray-600">Postal Code:</span>{" "}
              {customer.PostalCode}
            </p>
            <p>
              <span className="font-medium text-gray-600">Country:</span>{" "}
              {customer.Country}
            </p>
            <p>
              <span className="font-medium text-gray-600">Phone:</span>{" "}
              {customer.Phone}
            </p>
            <p>
              <span className="font-medium text-gray-600">Fax:</span>{" "}
              {customer.Fax || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
