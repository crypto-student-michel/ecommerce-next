'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ❌ ELIMINAR ESTA LÍNEA (Esto es lo que rompe Docker)
// import { insertUser } from '@/lib/db/db'; 

// ✅ AGREGAR ESTA IMPORTACIÓN (La Server Action)
import { registerUser } from './actions'; 

import { hashPassword } from '@/lib/utils';

// ... (Tu formSchema se queda igual) ...
const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.', }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.', }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,/\\])[A-Za-z\d.,/\\]{6,}$/, { message: 'Password must contain complexity requirements.', }),
  confirmPassword: z.string(),
  acceptPolicy: z.boolean().refine(val => val === true, { message: 'You must accept the security policy.', }),
  acceptMarketing: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      acceptPolicy: false,
      acceptMarketing: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Hashear password en cliente (Requisito 1.2)
      const hashedPassword = await hashPassword(values.password);
      
      // 2. Llamar a la Server Action en lugar de a la DB directamente
      const result = await registerUser({
        username: values.username,
        password: hashedPassword,
        acceptPolicy: values.acceptPolicy,
        acceptMarketing: values.acceptMarketing
      });

      if (result.success) {
        // Redirigir al login si todo fue bien
        router.push('/login');
      } else {
        // Mostrar error si el servidor falló
        setError(result.message);
      }

    } catch (err) {
      setError('An error occurred during signup.');
    }
  }

  return (
    // ... (El resto de tu JSX se queda exactamente igual) ...
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* ... tus campos del formulario ... */}
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
          {/* ... resto de campos ... */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>
                  Password requirements...
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptPolicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I accept the security policy
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptMarketing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I accept to receive marketing communications
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit">Sign Up</Button>
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