/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { getRedsysCheckout } from "@/lib/redsys";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
interface RedsysProps {
  amount: string;
  orderId: string;
}
export function Redsys({ amount, orderId }: RedsysProps) {
  const {customerId} = useParams();
  const [redsys, setRedsys] = useState<{
    url: string;
    signatureVersion: string;
    merchantParameters: string;
    signature: string;
  } | null>(null);
  const origin = window.location.origin;

  useEffect(() => {
    getRedsysCheckout(customerId as string, origin, amount, orderId).then((redsysData: any) => {
      if (redsysData) {
        setRedsys(redsysData);
      }
    }).catch((error: any) => {
      console.error("Error fetching Redsys data:", error);
    });
  }, [origin, amount, orderId, customerId]);

  if (!redsys) {
    return null; // or a loading indicator
  }
  // 4548810000000003
  // caducidad :12/29
  // codigo de seguridad: 123

  // http://localhost:3002/ok?orderId=26549
  // amount=19800
  // customerId=ALFKI
  // Ds_SignatureVersion=HMAC_SHA256_V1
  // Ds_MerchantParameters=eyJEc19EYXRlIjoiMTElMkYxMCUyRjIwMjQiLCJEc19Ib3VyIjoiMjMlM0EwMCIsIkRzX1NlY3VyZVBheW1lbnQiOiIxIiwiRHNfQW1vdW50IjoiMTk4MDAiLCJEc19DdXJyZW5jeSI6Ijk3OCIsIkRzX09yZGVyIjoiMjY1NDkiLCJEc19NZXJjaGFudENvZGUiOiI5OTkwMDg4ODEiLCJEc19UZXJtaW5hbCI6IjAwMSIsIkRzX1Jlc3BvbnNlIjoiMDAwMCIsIkRzX1RyYW5zYWN0aW9uVHlwZSI6IjAiLCJEc19NZXJjaGFudERhdGEiOiIiLCJEc19BdXRob3Jpc2F0aW9uQ29kZSI6IjIwMTQ5MiIsIkRzX0NhcmRfTnVtYmVyIjoiNDU0ODgxKioqKioqMDAwMyIsIkRzX0NvbnN1bWVyTGFuZ3VhZ2UiOiIxIiwiRHNfQ2FyZF9Db3VudHJ5IjoiNzI0IiwiRHNfQ2FyZF9CcmFuZCI6IjEiLCJEc19Qcm9jZXNzZWRQYXlNZXRob2QiOiI3OCIsIkRzX0VDSSI6IjA1IiwiRHNfUmVzcG9uc2VfRGVzY3JpcHRpb24iOiJPUEVSQUNJT04rQVVUT1JJWkFEQSIsIkRzX0NvbnRyb2xfMTcyODY4MDQxMjIxMSI6IjE3Mjg2ODA0MTIyMTEifQ%3D%3D
  
  // Ds_Signature=4NrnjYj_RPVr5K88gIM5xP09A2NBwAFMyws7vj9Wzrc%3D
  
  return (
  <form action={redsys.url} method="POST" name="from">
      <input
        type="hidden"
        name="Ds_SignatureVersion"
        value={redsys.signatureVersion}
      />
      <input
        type="hidden"
        name="Ds_MerchantParameters"
        value={redsys.merchantParameters}
      />
      <input type="hidden" name="Ds_Signature" value={redsys.signature} />

      <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white" type="submit">
        <span>Pasarela de pago</span>
      </Button>
    </form>
  );
}
