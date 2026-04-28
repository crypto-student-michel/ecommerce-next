import Link from "next/link";
import { getActivityLogs } from "@/lib/db/db";

export default async function ManagerLogsPage() {
  const logs = await getActivityLogs(100);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/manager"
          className="inline-block rounded border px-4 py-2 hover:bg-gray-100"
        >
          ← Volver al panel del gestor
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Logs de actividad</h1>

      <div className="rounded-lg border p-4 overflow-x-auto bg-white">
        {logs.length === 0 ? (
          <p>No hay logs todavía.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">ID</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Detalles</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b align-top">
                  <td className="p-3">{log.id}</td>
                  <td className="p-3">{log.username}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3">{log.details || "-"}</td>
                  <td className="p-3">{log.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}