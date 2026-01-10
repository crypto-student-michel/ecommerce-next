import OkClient from "./ok-client";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function normalizeB64FromQuery(v: string) {
  // en query, '+' suele venir como espacio
  return (v || "").replace(/ /g, "+").trim();
}

export default function OkPage({ searchParams }: { searchParams: SearchParams }) {
  const orderId = pick(searchParams, "orderId");
  const customerId = pick(searchParams, "customerId");
  const amount = pick(searchParams, "amount");

  // Redsys
  const Ds_SignatureVersion = pick(searchParams, "Ds_SignatureVersion");
  const Ds_MerchantParameters = normalizeB64FromQuery(pick(searchParams, "Ds_MerchantParameters"));
  const Ds_Signature = normalizeB64FromQuery(pick(searchParams, "Ds_Signature"));

  if (!orderId || !customerId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">Faltan parámetros</h1>
        <p className="mt-2 text-gray-700">
          No llegaron <b>orderId</b> o <b>customerId</b> en la URL.
        </p>
      </div>
    );
  }

  return (
    <OkClient
      orderId={orderId}
      customerId={customerId}
      amount={amount}
      Ds_SignatureVersion={Ds_SignatureVersion}
      Ds_MerchantParameters={Ds_MerchantParameters}
      Ds_Signature={Ds_Signature}
      redirectSeconds={3}
    />
  );
}
