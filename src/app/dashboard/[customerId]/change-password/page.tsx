"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hashPassword } from "@/lib/utils";
// ✅ Importamos el hook de autenticación y la Server Action
import { useAuth } from "@/components/app/AuthContext";
import { changePasswordAction } from "./actions";

export default function ChangePassword() {
  const { customerId } = useParams(); // Lo mantenemos por si lo usas para navegación
  const { username } = useAuth(); // ✅ Obtenemos el usuario logueado del contexto
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    if (!username) {
        setError("No se ha podido identificar al usuario. Intenta hacer login de nuevo.");
        return;
    }

    try {
      setLoading(true);
      // 1. Hasheamos las contraseñas en el cliente (igual que haces en Login/Signup)
      const currentHashedPassword = await hashPassword(currentPassword);
      const newHashedPassword = await hashPassword(newPassword);
      
      // 2. Llamamos a la Server Action
      const result = await changePasswordAction(username, currentHashedPassword, newHashedPassword);

      if (result.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Opcional: Redirigir después de un tiempo
        // setTimeout(() => router.back(), 2000);
      } else {
        setError(result.message || "Error al cambiar la contraseña.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Cambiar Contraseña</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 text-green-700">
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>Tu contraseña ha sido actualizada correctamente.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña Actual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Introduce tu contraseña actual"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Repite la nueva contraseña"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Actualizando..." : "Cambiar Contraseña"}
        </Button>
      </form>
    </div>
  );
}