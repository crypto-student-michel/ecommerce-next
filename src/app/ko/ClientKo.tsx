"use client";

import { useSearchParams } from "next/navigation";

export default function ClientKo() {
  const params = useSearchParams();
  const msg = params.get("msg");           // lee ?msg=...
  const code = params.get("code");         // ejemplo extra: ?code=123

  return (
    <div>
      <p>Operación NO completada.</p>
      {msg && <p>Mensaje: {msg}</p>}
      {code && <p>Código: {code}</p>}
    </div>
  );
}
