"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// ❌ ELIMINADO: import { associateCestaIdWithUsername, getUser } from "@/lib/db/db";
import { zodResolver } from "@hookform/resolvers/zod";
import { hashPassword } from "@/lib/utils";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/components/app/AuthContext";

// ✅ AGREGADO: Importamos la Server Action
import { loginAction } from "./actions";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsLoggedIn, setUsername, setId, idCesta } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Hashear password en cliente (Requisito 1.2)
      const hashedPassword = await hashPassword(values.password);
      
      // 2. Llamar a la Server Action en lugar de a la DB directamente
      const result = await loginAction({
        username: values.username,
        password: hashedPassword,
        cestaId: idCesta.toString() // Pasamos el ID de la cesta actual
      });

      if (result.success && result.user) {
        // 3. Actualizar estado y LocalStorage
        setIsLoggedIn(true);
        setUsername(result.user.username);
        // setId(result.user.id); // Si tu verifyUser devuelve ID
        
        // Guardamos el token recibido
        localStorage.setItem("token", result.user.token || "");
        localStorage.setItem("user", JSON.stringify(result.user));
        
        // 4. Redirigir
        router.push(`/dashboard/${result.user.username}`);
      } else {
        setError(result.message || "Invalid username or password");
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during login."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}