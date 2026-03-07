"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/app/AuthContext";
// ❌ ELIMINADO: import { cesta } from "@/lib/db/db";
// ✅ AGREGADO: Importamos la Server Action
import { addToCestaAction } from "./actions";
import Link from "next/link";

const formSchema = z.object({
  cantidad: z.number().min(1, { message: "La cantidad debe ser al menos 1" }),
});

interface CantidadProps {
  productoId: number;
  cantidad?: number;
}

export default function Cantidad({ productoId, cantidad }: CantidadProps) {
  const { username, idCesta } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cantidad: cantidad ?? 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuccess(false);
    setError(false);
    try {
      // ✅ CORREGIDO: Usamos la acción addToCestaAction
      // Aseguramos el orden de argumentos: idCesta, username, productId, cantidad
      await addToCestaAction(
        idCesta.toString(),
        username,
        productoId, 
        values.cantidad
      );
      setSuccess(true);
    } catch (error) {
      console.error("Error al añadir a la cesta:", error);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-1">
        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="mt-8">
          {isLoading ? "Añadiendo..." : "Añadir a la cesta"}
        </Button>
      </form>

      {success && (
        <div className="mt-2 text-green-500">
          <p>Producto añadido a la cesta correctamente</p>
          <div className="mt-2">
            <Link href="/products" className="text-blue-500 hover:underline mr-4">
              Seguir comprando
            </Link>
            <Link href={`/cesta/${idCesta}`} className="text-blue-500 hover:underline">
              Ver cesta
            </Link>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500">Error al añadir a la cesta</p>
      )}
    </Form>
  );
}