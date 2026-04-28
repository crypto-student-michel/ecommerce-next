///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////// -----     07-03-26 ----- CORRECCIÓN: Agregamos los roles al user y adaptamos el login con los roles de admin y user ----- ////

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { loginAction } from "./actions";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsLoggedIn, setUsername, setRole, setId, idCesta } = useAuth();

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
      const hashedPassword = await hashPassword(values.password);

      const result = await loginAction({
        username: values.username,
        password: hashedPassword,
        cestaId: idCesta.toString(),
      });

      if (result.success && result.user) {
        setIsLoggedIn(true);
        setUsername(result.user.username);
        setRole(result.user.role);

        localStorage.setItem("token", result.user.token || "");
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("role", result.user.role || "customer");

        if (result.user.role === "admin" || result.user.role === "manager") {
          router.push("/manager");
        } else {
          router.push(`/dashboard/${result.user.username}`);
        }
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