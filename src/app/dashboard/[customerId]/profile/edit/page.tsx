"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// ❌ ELIMINADO: import { getCustomer, saveCustomer } from "@/lib/db/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ✅ IMPORTAMOS LAS ACCIONES SEGURAS
import { getCustomerForEditAction, updateCustomerAction } from "./actions";

const formSchema = z.object({
  CompanyName: z.string().min(1, "Company Name is required"),
  ContactName: z.string().min(1, "Contact Name is required"),
  ContactTitle: z.string().min(1, "Contact Title is required"),
  Address: z.string().min(1, "Address is required"),
  City: z.string().min(1, "City is required"),
  Region: z.string().nullable(),
  PostalCode: z.string().min(1, "Postal Code is required"),
  Country: z.string().min(1, "Country is required"),
  Phone: z.string().min(1, "Phone is required"),
  Fax: z.string().nullable(),
});

export default function EditCustomerProfile() {
  const params = useParams();
  // Aseguramos que customerId es string
  const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
  
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      CompanyName: "",
      ContactName: "",
      ContactTitle: "",
      Address: "",
      City: "",
      Region: "",
      PostalCode: "",
      Country: "",
      Phone: "",
      Fax: "",
    },
  });

  useEffect(() => {
    async function fetchCustomer() {
      if (!customerId) return;
      
      try {
        // ✅ Usamos la acción del servidor
        const result = await getCustomerForEditAction(customerId);
        
        if (result.success && result.customer) {
          setCustomer(result.customer as any);
          form.reset(result.customer as any);
        } else {
          setError(result.error || "Failed to fetch customer data");
        }
      } catch (err) {
        setError("Failed to fetch customer data");
        console.error(err);
      }
    }

    fetchCustomer();
  }, [customerId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!customerId) return;

    try {
      // ✅ Usamos la acción del servidor para guardar
      const result = await updateCustomerAction(customerId, values);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/${customerId}/profile`);
        }, 2000); // Reduje el tiempo a 2s para que sea más ágil
      } else {
        setError(result.error || "Failed to save changes");
      }
    } catch (err) {
      setError("Failed to save customer data");
      console.error(err);
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!customer) {
    return <div className="p-8">Loading profile data...</div>;
  }

  return (
    <div className="space-y-4 p-8 max-w-2xl mx-auto border rounded bg-white shadow">
      <h1 className="text-2xl font-bold">Edit Customer Profile</h1>
      {success && (
        <Alert className="bg-green-100 border-green-500 text-green-700">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Datos actualizados correctamente. Redirigiendo...</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="CompanyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="ContactTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Title</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="Address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="City"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="PostalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="Country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Fax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fax</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
             <Button type="submit" className="w-full md:w-auto">Save Changes</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}