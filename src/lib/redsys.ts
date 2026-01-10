// // /* eslint-disable @typescript-eslint/no-explicit-any */

// // import CryptoJS from "crypto-js";

// // // URL de entorno de pruebas de Redsys
// // // const REDSYS_URL = "https://sis-t.redsys.es:25443/sis/realizarPago";

// // const REDSYS_URL =
// //   process.env.NEXT_PUBLIC_REDSYS_URL ??
// //   "https://sis-t.redsys.es:25443/sis/realizarPago";

// // // Datos del comercio de pruebas (los estándar de Redsys)
// // const MERCHANT_CODE = "999008881"; // FUC
// // const TERMINAL = "1";
// // const CURRENCY_EUR = "978";
// // const TRANSACTION_TYPE = "0";

// // // 🔑 Clave secreta en Base64 (probamos primero con NEXT_PUBLIC_ y luego con REDSYS_SECRET)
// // const REDSYS_SECRET_BASE64 =
// //   process.env.NEXT_PUBLIC_REDSYS_SECRET ?? process.env.REDSYS_SECRET ?? "";

// // if (!REDSYS_SECRET_BASE64) {
// //   console.warn(
// //     "[redsys] Falta la variable NEXT_PUBLIC_REDSYS_SECRET o REDSYS_SECRET. La firma no se podrá calcular."
// //   );
// // }

// // export type RedsysCheckoutResponse = {
// //   url: string;
// //   signatureVersion: string;
// //   merchantParameters: string;
// //   signature: string;
// // };

// // /**
// //  * Genera los parámetros necesarios para enviar al TPV de Redsys.
// //  *
// //  * - customerId: código del cliente (ALFKI, etc.)
// //  * - origin: window.location.origin (por ejemplo http://localhost:3000)
// //  * - amountCents: importe en céntimos (ej: 44100 para 441.00 €)
// //  * - orderId: ID del pedido en tu base de datos
// //  */
// // export function getRedsysCheckout(
// //   customerId: string,
// //   origin: string,
// //   amountCents: number,
// //   orderId: number
// // ): RedsysCheckoutResponse {
// //   // Normalizamos el importe a entero en céntimos
// //   const amount = Number(amountCents);
// //   if (!Number.isFinite(amount)) {
// //     throw new Error(`Importe inválido para Redsys: "${amountCents}"`);
// //   }
// //   const amountStr = Math.round(amount).toString();

// //   // ********* PUNTO CLAVE PARA EVITAR SIS0051 *********
// //   // Redsys exige que DS_MERCHANT_ORDER sea único (4–12 dígitos).
// //   // Generamos un merchantOrder diferente en cada intento:
// //   const baseOrder = String(orderId).replace(/\D/g, "");
// //   const tsSuffix = Date.now().toString().slice(-4);
// //   const merchantOrder = (baseOrder + tsSuffix).slice(-12) || tsSuffix;

// //   // URLs de retorno a tu aplicación, donde tienes /ok y /ko
// //   const okUrl = `${origin}/ok?orderId=${orderId}&amount=${amountStr}&customerId=${encodeURIComponent(
// //     customerId
// //   )}`;
// //   const koUrl = `${origin}/ko?orderId=${orderId}&amount=${amountStr}&customerId=${encodeURIComponent(
// //     customerId
// //   )}`;

// //   // Datos que se codifican en Ds_MerchantParameters (JSON -> Base64)
// //   const tpvdata = {
// //     DS_MERCHANT_AMOUNT: amountStr,
// //     DS_MERCHANT_ORDER: merchantOrder,
// //     DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
// //     DS_MERCHANT_CURRENCY: CURRENCY_EUR,
// //     DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION_TYPE,
// //     DS_MERCHANT_TERMINAL: TERMINAL,
// //     DS_MERCHANT_MERCHANTURL: `${origin}/redsys/`,
// //     DS_MERCHANT_URLOK: okUrl,
// //     DS_MERCHANT_URLKO: koUrl,
// //     DS_MERCHANT_TITULAR: customerId,
// //     DS_MERCHANT_CONSUMERLANGUAGE: "001", // 001 = español
// //   };

// //   const merchantParametersJson = JSON.stringify(tpvdata);
// //   const merchantParameters = Buffer.from(
// //     merchantParametersJson,
// //     "utf8"
// //   ).toString("base64");

// //   // Si no hay clave, devolvemos sin firma (sólo útil para debug local)
// //   if (!REDSYS_SECRET_BASE64) {
// //     return {
// //       url: REDSYS_URL,
// //       signatureVersion: "HMAC_SHA256_V1",
// //       merchantParameters,
// //       signature: "",
// //     };
// //   }

// //   // ===== Cálculo de la firma HMAC_SHA256_V1 =====

// //   // 1) Sacamos la clave de 3DES a partir de la clave secreta Base64
// //   const keyWordArray = CryptoJS.enc.Base64.parse(REDSYS_SECRET_BASE64);
// //   const iv = CryptoJS.enc.Hex.parse("0000000000000000");
// //   const orderWordArray = CryptoJS.enc.Utf8.parse(merchantOrder);

// //   // ⚠️ Padding ZeroPadding (el que usabas cuando te funcionaba)
// //   const cipher = CryptoJS.TripleDES.encrypt(orderWordArray, keyWordArray, {
// //     iv,
// //     mode: CryptoJS.mode.CBC,
// //     padding: CryptoJS.pad.ZeroPadding,
// //   });

// //   const key256 = cipher.ciphertext;

// //   // 2) HMAC-SHA256 sobre los merchantParameters en Base64
// //   const mac = CryptoJS.HmacSHA256(
// //     CryptoJS.enc.Utf8.parse(merchantParameters),
// //     key256
// //   );
// //   const signature = CryptoJS.enc.Base64.stringify(mac);

// //   return {
// //     url: REDSYS_URL,
// //     signatureVersion: "HMAC_SHA256_V1",
// //     merchantParameters,
// //     signature,
// //   };
// // }

// // /**
// //  * (Opcional) Decodificar los parámetros de Redsys en /ok y /ko
// //  */
// // export function decodeMerchantParameters(
// //   merchantParametersBase64: string
// // ): any {
// //   const json = Buffer.from(merchantParametersBase64, "base64").toString("utf8");
// //   return JSON.parse(json);
// // }

// // /**
// //  * (Opcional) Verificar la firma de Redsys en /ok y /ko
// //  */
// // export function verifyRedsysSignature(
// //   receivedSignature: string,
// //   merchantParametersBase64: string
// // ): boolean {
// //   if (!REDSYS_SECRET_BASE64) return false;

// //   // Decodificamos para obtener Ds_Order
// //   const decoded = decodeMerchantParameters(merchantParametersBase64);
// //   const orderField =
// //     decoded.Ds_Order ||
// //     decoded.DS_ORDER ||
// //     decoded.DS_MERCHANT_ORDER ||
// //     "";

// //   if (!orderField) return false;

// //   const keyWordArray = CryptoJS.enc.Base64.parse(REDSYS_SECRET_BASE64);
// //   const iv = CryptoJS.enc.Hex.parse("0000000000000000");
// //   const orderWordArray = CryptoJS.enc.Utf8.parse(orderField);

// //   const cipher = CryptoJS.TripleDES.encrypt(orderWordArray, keyWordArray, {
// //     iv,
// //     mode: CryptoJS.mode.CBC,
// //     padding: CryptoJS.pad.ZeroPadding,
// //   });

// //   const key256 = cipher.ciphertext;

// //   const mac = CryptoJS.HmacSHA256(
// //     CryptoJS.enc.Utf8.parse(merchantParametersBase64),
// //     key256
// //   );
// //   const expected = CryptoJS.enc.Base64.stringify(mac);

// //   // Redsys a veces usa Base64 "URL safe" (- y _), los normalizamos
// //   const normalized = receivedSignature.replace(/-/g, "+").replace(/_/g, "/");

// //   return expected === normalized;
// // }



// /* eslint-disable @typescript-eslint/no-explicit-any */

// import CryptoJS from "crypto-js";

// // URL de entorno de pruebas de Redsys
// // const REDSYS_URL = "https://sis-t.redsys.es:25443/sis/realizarPago";

// const REDSYS_URL =
//   process.env.NEXT_PUBLIC_REDSYS_URL ??
//   "https://sis-t.redsys.es:25443/sis/realizarPago";

// // Datos del comercio de pruebas (los estándar de Redsys)
// const MERCHANT_CODE = "999008881"; // FUC
// const TERMINAL = "1";
// const CURRENCY_EUR = "978";
// const TRANSACTION_TYPE = "0";

// // 🔑 Clave secreta en Base64 (primero NEXT_PUBLIC_, luego REDSYS_SECRET)
// const REDSYS_SECRET =
//   process.env.NEXT_PUBLIC_REDSYS_SECRET ?? process.env.REDSYS_SECRET ?? "";

// // Si falta la clave, avisamos pero NO rompemos la app.
// // En local o sin secret, simplemente no se firmará la petición.
// if (!REDSYS_SECRET) {
//   console.warn(
//     "[redsys] Falta la variable NEXT_PUBLIC_REDSYS_SECRET o REDSYS_SECRET. La firma no se podrá calcular."
//   );
// }

// export type RedsysCheckoutResponse = {
//   url: string;
//   signatureVersion: string;
//   merchantParameters: string;
//   signature: string;
// };

// /**
//  * Genera los parámetros necesarios para enviar al TPV de Redsys.
//  *
//  * - customerId: código del cliente (ALFKI, etc.)
//  * - origin: window.location.origin (por ejemplo http://localhost:3000)
//  * - amountCents: importe en céntimos (ej: 44100 para 441.00 €)
//  * - orderId: ID del pedido en tu base de datos
//  */
// export function getRedsysCheckout(
//   customerId: string,
//   origin: string,
//   amountCents: number,
//   orderId: number
// ): RedsysCheckoutResponse {
//   // Normalizamos el importe a entero en céntimos
//   const amount = Number(amountCents);
//   if (!Number.isFinite(amount)) {
//     throw new Error(`Importe inválido para Redsys: "${amountCents}"`);
//   }
//   const amountStr = Math.round(amount).toString();

//   // ********* PUNTO CLAVE PARA EVITAR SIS0051 *********
//   // Redsys exige que DS_MERCHANT_ORDER sea único (4–12 dígitos).
//   // Generamos un merchantOrder diferente en cada intento:
//   const baseOrder = String(orderId).replace(/\D/g, "");
//   const tsSuffix = Date.now().toString().slice(-4);
//   const merchantOrder = (baseOrder + tsSuffix).slice(-12) || tsSuffix;

//   // URLs de retorno a tu aplicación, donde tienes /ok y /ko
//   const okUrl = `${origin}/ok?orderId=${orderId}&amount=${amountStr}&customerId=${encodeURIComponent(
//     customerId
//   )}`;
//   const koUrl = `${origin}/ko?orderId=${orderId}&amount=${amountStr}&customerId=${encodeURIComponent(
//     customerId
//   )}`;

//   // Datos que se codifican en Ds_MerchantParameters (JSON -> Base64)
//   const tpvdata = {
//     DS_MERCHANT_AMOUNT: amountStr,
//     DS_MERCHANT_ORDER: merchantOrder,
//     DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
//     DS_MERCHANT_CURRENCY: CURRENCY_EUR,
//     DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION_TYPE,
//     DS_MERCHANT_TERMINAL: TERMINAL,
//     DS_MERCHANT_MERCHANTURL: `${origin}/redsys/`,
//     DS_MERCHANT_URLOK: okUrl,
//     DS_MERCHANT_URLKO: koUrl,
//     DS_MERCHANT_TITULAR: customerId,
//     DS_MERCHANT_CONSUMERLANGUAGE: "001", // 001 = español
//   };

//   const merchantParametersJson = JSON.stringify(tpvdata);
//   const merchantParameters = Buffer.from(
//     merchantParametersJson,
//     "utf8"
//   ).toString("base64");

//   // Si no hay clave, devolvemos sin firma (sólo útil para debug local)
//   if (!REDSYS_SECRET) {
//     return {
//       url: REDSYS_URL,
//       signatureVersion: "HMAC_SHA256_V1",
//       merchantParameters,
//       signature: "",
//     };
//   }

//   // ===== Cálculo de la firma HMAC_SHA256_V1 =====

//   // 1) Sacamos la clave de 3DES a partir de la clave secreta Base64
//   const keyWordArray = CryptoJS.enc.Base64.parse(REDSYS_SECRET);
//   const iv = CryptoJS.enc.Hex.parse("0000000000000000");
//   const orderWordArray = CryptoJS.enc.Utf8.parse(merchantOrder);

//   // ⚠️ Padding ZeroPadding (el que usabas cuando te funcionaba)
//   const cipher = CryptoJS.TripleDES.encrypt(orderWordArray, keyWordArray, {
//     iv,
//     mode: CryptoJS.mode.CBC,
//     padding: CryptoJS.pad.ZeroPadding,
//   });

//   const key256 = cipher.ciphertext;

//   // 2) HMAC-SHA256 sobre los merchantParameters en Base64
//   const mac = CryptoJS.HmacSHA256(
//     CryptoJS.enc.Utf8.parse(merchantParameters),
//     key256
//   );
//   const signature = CryptoJS.enc.Base64.stringify(mac);

//   return {
//     url: REDSYS_URL,
//     signatureVersion: "HMAC_SHA256_V1",
//     merchantParameters,
//     signature,
//   };
// }

// /**
//  * (Opcional) Decodificar los parámetros de Redsys en /ok y /ko
//  */
// export function decodeMerchantParameters(
//   merchantParametersBase64: string
// ): any {
//   const json = Buffer.from(merchantParametersBase64, "base64").toString("utf8");
//   return JSON.parse(json);
// }

// /**
//  * (Opcional) Verificar la firma de Redsys en /ok y /ko
//  */
// export function verifyRedsysSignature(
//   receivedSignature: string,
//   merchantParametersBase64: string
// ): boolean {
//   if (!REDSYS_SECRET) return false;

//   // Decodificamos para obtener Ds_Order
//   const decoded = decodeMerchantParameters(merchantParametersBase64);
//   const orderField =
//     decoded.Ds_Order ||
//     decoded.DS_ORDER ||
//     decoded.DS_MERCHANT_ORDER ||
//     "";

//   if (!orderField) return false;

//   const keyWordArray = CryptoJS.enc.Base64.parse(REDSYS_SECRET);
//   const iv = CryptoJS.enc.Hex.parse("0000000000000000");
//   const orderWordArray = CryptoJS.enc.Utf8.parse(orderField);

//   const cipher = CryptoJS.TripleDES.encrypt(orderWordArray, keyWordArray, {
//     iv,
//     mode: CryptoJS.mode.CBC,
//     padding: CryptoJS.pad.ZeroPadding,
//   });

//   const key256 = cipher.ciphertext;

//   const mac = CryptoJS.HmacSHA256(
//     CryptoJS.enc.Utf8.parse(merchantParametersBase64),
//     key256
//   );
//   const expected = CryptoJS.enc.Base64.stringify(mac);

//   // Redsys a veces usa Base64 "URL safe" (- y _), los normalizamos
//   const normalized = receivedSignature.replace(/-/g, "+").replace(/_/g, "/");

//   return expected === normalized;
// }


//---------------------------------------------------------------------------------------------------------------------------------
// Server side implementation using Node.js 'crypto' module
//--------------------------------------------------------------------------------------------------------------------------------- 

import "server-only";
import crypto from "crypto";

export type RedsysCheckoutResponse = {
  url: string;
  signatureVersion: "HMAC_SHA256_V1";
  merchantParameters: string;
  signature: string;
  merchantOrder: string;
  amountCents: number;
};

function base64Encode(str: string) {
  return Buffer.from(str, "utf8").toString("base64");
}

function base64UrlSafe(b64: string) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

function makeMerchantOrder(orderId: number) {
  // Pedido de 4-12 dígitos (recomendado). Lo hacemos único con sufijo de tiempo.
  const base = String(orderId).replace(/\D/g, "") || "1";
  const suffix = Date.now().toString().slice(-4);
  const order = (base + suffix).slice(-12);
  return order.padStart(4, "0");
}

function encrypt3DES(order: string, secretBase64: string) {
  const key = Buffer.from(secretBase64, "base64");
  const iv = Buffer.alloc(8, 0);

  const orderBuf = Buffer.from(order, "utf8");
  const padLen = 8 - (orderBuf.length % 8 || 8);
  const padded = Buffer.concat([orderBuf, Buffer.alloc(padLen, 0)]);

  const cipher = crypto.createCipheriv("des-ede3-cbc", key, iv);
  cipher.setAutoPadding(false);

  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

function createSignature(secretBase64: string, order: string, merchantParametersB64: string) {
  const derivedKey = encrypt3DES(order, secretBase64);
  const hmac = crypto.createHmac("sha256", derivedKey);
  hmac.update(merchantParametersB64, "utf8");
  return base64UrlSafe(hmac.digest("base64"));
}

export function getRedsysCheckoutServer(args: {
  customerId: string;
  baseUrl: string;
  amount: number;
  orderId: number;
}): RedsysCheckoutResponse {
  const secret = process.env.REDSYS_SECRET;
  const merchantCode = process.env.REDSYS_MERCHANT_CODE || "999008881";
  const terminal = process.env.REDSYS_TERMINAL || "1";
  const url = process.env.REDSYS_URL || "https://sis-t.redsys.es:25443/sis/realizarPago";

  if (!secret) throw new Error("Falta REDSYS_SECRET en el servidor");

  const amountCents = Math.round(Number(args.amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error(`Importe inválido: ${args.amount}`);
  }

  const merchantOrder = makeMerchantOrder(args.orderId);

  const okUrl = `${args.baseUrl}/ok?orderId=${args.orderId}&customerId=${encodeURIComponent(args.customerId)}`;
  const koUrl = `${args.baseUrl}/ko?orderId=${args.orderId}&customerId=${encodeURIComponent(args.customerId)}`;

  const params = {
    DS_MERCHANT_AMOUNT: String(amountCents),
    DS_MERCHANT_ORDER: merchantOrder,
    DS_MERCHANT_MERCHANTCODE: merchantCode,
    DS_MERCHANT_CURRENCY: "978", // EUR
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_TERMINAL: terminal,
    DS_MERCHANT_URLOK: okUrl,
    DS_MERCHANT_URLKO: koUrl,
  };

  const merchantParameters = base64Encode(JSON.stringify(params));
  const signature = createSignature(secret, merchantOrder, merchantParameters);

  return {
    url,
    signatureVersion: "HMAC_SHA256_V1",
    merchantParameters,
    signature,
    merchantOrder,
    amountCents,
  };
}
