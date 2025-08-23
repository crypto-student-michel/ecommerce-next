"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCustomerOrders } from "@/lib/db/db";
import Orders from "@/components/app/Orders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/components/app/AuthContext";

interface Order {
  OrderID: number;
  CustomerID: string;
  EmployeeID: number;
  OrderDate: string;
  RequiredDate: string;
  ShippedDate: string | null;
  ShipVia: number;
  Freight: number;
  ShipName: string;
  ShipAddress: string;
  ShipCity: string;
  ShipRegion: string | null;
  ShipPostalCode: string;
  ShipCountry: string;
}

export default function CustomerOrders() {

  

  
  

  return (
   <div>Dashboard </div>
  );
}
