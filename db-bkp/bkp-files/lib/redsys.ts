import cryptojs from "crypto-js";

export type RedsysCheckoutResponse = {
  signatureVersion: string;
  merchantParameters: string;
  signature: string;
  url: string;
};

export async function getRedsysCheckout(
  customerId: string,
  origin: string,
  amount: string,  // en céntimos: "5700", "1234", etc.
  orderId: string
): Promise<RedsysCheckoutResponse> {
  // 1) Validación básica
  if (!customerId || !origin || !amount || !orderId) {
    throw new Error("Parámetros inválidos en getRedsysCheckout");
  }

  const redsysSecret = process.env.NEXT_PUBLIC_REDSYS_SECRET?.trim();
  if (!redsysSecret) {
    throw new Error(
      "Falta NEXT_PUBLIC_REDSYS_SECRET en .env.local"
    );
  }

  const redsysUrl = process.env.NEXT_PUBLIC_REDSYS_URL?.trim();
  if (!redsysUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_REDSYS_URL en .env.local"
    );
  }

  // 2) Datos que van dentro de Ds_MerchantParameters
  const tpvdata = {
    DS_MERCHANT_AMOUNT: amount,
    DS_MERCHANT_CURRENCY: "978",
    DS_MERCHANT_MERCHANTCODE: "999008881",
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_TERMINAL: "001",
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_MERCHANTURL: `${origin}/redsys/`,
    DS_MERCHANT_PAYMETHODS: "C",
    DS_MERCHANT_URLKO: `${origin}/ko/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`,
    DS_MERCHANT_URLOK: `${origin}/ok/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`,
  };

  // 3) JSON -> UTF8 -> Base64  (Ds_MerchantParameters)
  const json = JSON.stringify(tpvdata);
  const jsonWordArray = cryptojs.enc.Utf8.parse(json);
  const merchantBase64 = jsonWordArray.toString(cryptojs.enc.Base64);

  // 4) Clave secreta Redsys: viene en Base64
  const keyWordArray = cryptojs.enc.Base64.parse(redsysSecret);

  // 5) Cifrado 3DES del DS_MERCHANT_ORDER
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

  // 6) Firma HMAC-SHA256( merchantBase64, clave_cifrada )
  const signature = cryptojs.HmacSHA256(merchantBase64, cipher.ciphertext);
  const signatureBase64 = signature.toString(cryptojs.enc.Base64);

  // 7) Respuesta para el formulario
  return {
    signatureVersion: "HMAC_SHA256_V1",
    merchantParameters: merchantBase64,
    signature: signatureBase64,
    url: redsysUrl,
  };
}
