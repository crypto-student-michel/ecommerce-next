"use server";

import { getUsers, setUserRole } from "@/lib/db/db";

export async function getUsersAction() {
  return await getUsers();
}

export async function updateUserRoleAction(
  username: string,
  role: "customer" | "manager" | "admin"
) {
  await setUserRole(username, role);
  return { ok: true };
}