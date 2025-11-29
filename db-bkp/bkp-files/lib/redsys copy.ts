/* eslint-disable @typescript-eslint/no-explicit-any */

import cryptojs from "crypto-js";

export type RedsysCheckoutResponse = {
  signatureVersion: string;
  merchantParameters: string;
  signature: string;
  url: string;
};

const REDSYS_URL =
  process.env.NEXT_PUBLIC_REDSYS_URL ??
  "https://sis-t.redsys.es:25443/sis/realizarPago";

/**
 * Genera los datos necesarios para el formulario POST a Redsys
 * (URL, Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature).
 *
 * OJO: amount debe venir en céntimos, en string, ej: "12800"
 */
export async function getRedsysCheckout(
  customerId: string,
  origin: string,
  amount: string,
  orderId: string
): Promise<RedsysCheckoutResponse> {
  const secret = process.env.NEXT_PUBLIC_REDSYS_SECRET;
  if (!secret) {
    throw new Error("Falta la variable NEXT_PUBLIC_REDSYS_SECRET en .env.local");
  }

  // Datos que exige Redsys
  const tpvdata = {
    DS_MERCHANT_AMOUNT: amount,
    DS_MERCHANT_CURRENCY: "978", // EUR
    DS_MERCHANT_MERCHANTCODE: "999008881",
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_TERMINAL: "001",
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_MERCHANTURL: `${origin}/redsys/`,
    DS_MERCHANT_PAYMETHODS: "C",
    DS_MERCHANT_URLKO: `${origin}/ko/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`,
    DS_MERCHANT_URLOK: `${origin}/ok/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`,
  };

  // 1) MerchantParameters: JSON -> UTF8 -> Base64
  const merchantWordArray = cryptojs.enc.Utf8.parse(JSON.stringify(tpvdata));
  const merchantBase64 = merchantWordArray.toString(cryptojs.enc.Base64);

  // 2) Clave 3DES derivada del secreto (entorno de pruebas)
  const keyWordArray = cryptojs.enc.Base64.parse(secret);
  const iv = cryptojs.enc.Hex.parse("0000000000000000");

  const cipher = cryptojs.TripleDES.encrypt(
    tpvdata.DS_MERCHANT_ORDER,
    keyWordArray,
    {
      iv,
      mode: cryptojs.mode.CBC,
      padding: cryptojs.pad.ZeroPadding,
    }
  );

  // 3) Firma HMAC-SHA256(merchantBase64, 3DES(orderId))
  const signature = cryptojs.HmacSHA256(merchantBase64, cipher.ciphertext);
  const signatureBase64 = signature.toString(cryptojs.enc.Base64);

  return {
    signatureVersion: "HMAC_SHA256_V1",
    merchantParameters: merchantBase64,
    signature: signatureBase64,
    url: REDSYS_URL,
  };
}
