"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/app/AuthContext";
import {
  getUsersAction,
  updateUserRoleAction,
} from "./actions";

type UserItem = {
  id: number;
  username: string;
  role: "customer" | "manager" | "admin";
  created_at: string;
};

export default function ManagerUsersPage() {
  const router = useRouter();
  const { loading, isLoggedIn, role, username } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [savingUser, setSavingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (role !== "admin") {
        router.push("/manager");
      }
    }
  }, [loading, isLoggedIn, role, router]);

  useEffect(() => {
    async function loadUsers() {
      const data = await getUsersAction();
      setUsers(data);
    }

    if (isLoggedIn && role === "admin") {
      loadUsers();
    }
  }, [isLoggedIn, role]);

  async function changeRole(
    targetUsername: string,
    newRole: "customer" | "manager" | "admin"
  ) {
    if (targetUsername === username && newRole !== "admin") {
      alert("No deberías quitarte a ti mismo el rol de admin.");
      return;
    }

    setSavingUser(targetUsername);

    try {
      await updateUserRoleAction(targetUsername, newRole);
      const data = await getUsersAction();
      setUsers(data);
    } finally {
      setSavingUser(null);
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!isLoggedIn || role !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de usuarios</h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Creado</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem.id} className="border-b">
                <td className="p-3">{userItem.username}</td>
                <td className="p-3">{userItem.role}</td>
                <td className="p-3">{userItem.created_at}</td>
                <td className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="px-3 py-1 border rounded"
                      disabled={savingUser === userItem.username}
                      onClick={() => changeRole(userItem.username, "customer")}
                    >
                      Customer
                    </button>

                    <button
                      className="px-3 py-1 border rounded"
                      disabled={savingUser === userItem.username}
                      onClick={() => changeRole(userItem.username, "manager")}
                    >
                      Manager
                    </button>

                    <button
                      className="px-3 py-1 border rounded"
                      disabled={savingUser === userItem.username}
                      onClick={() => changeRole(userItem.username, "admin")}
                    >
                      Admin
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}