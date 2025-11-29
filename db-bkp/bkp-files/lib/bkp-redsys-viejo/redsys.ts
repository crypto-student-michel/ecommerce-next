
"use server";
import cryptojs from 'crypto-js';

export async function getRedsysCheckout(customerId: string, origin: string, amount: string,  orderId: string) {
    const tpvdata = {
        "DS_MERCHANT_AMOUNT": amount,
        "DS_MERCHANT_CURRENCY": "978",
        "DS_MERCHANT_MERCHANTCODE": "999008881",
        "DS_MERCHANT_ORDER": orderId,
        "DS_MERCHANT_TERMINAL": "001",
        "DS_MERCHANT_TRANSACTIONTYPE":  "0",   
        "DS_MERCHANT_MERCHANTURL": `${origin}/redsys/`,
        "DS_MERCHANT_PAYMETHODS": "C",
        "DS_MERCHANT_URLKO": `${origin}/ko/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`,
        "DS_MERCHANT_URLOK": `${origin}/ok/?orderId=${orderId}&amount=${amount}&customerId=${customerId}`
    };

  
    const merchantWordArray = cryptojs.enc.Utf8.parse(JSON.stringify(tpvdata));
    const merchantBase64 = merchantWordArray.toString(cryptojs.enc.Base64);
    // clave privada. sacarla de ahi.
    const keyWordArray = cryptojs.enc.Base64.parse(process.env.NEXT_PUBLIC_REDSYS_SECRET as string);
    
    const iv = cryptojs.enc.Hex.parse("0000000000000000");
    const cipher = cryptojs.TripleDES.encrypt(tpvdata.DS_MERCHANT_ORDER, keyWordArray, {
        iv: iv,
        mode: cryptojs.mode.CBC,
        padding: cryptojs.pad.ZeroPadding
    });
    
    const signature = cryptojs.HmacSHA256(merchantBase64, cipher.ciphertext as CryptoJS.lib.WordArray);
    const signatureBase64 = signature.toString(cryptojs.enc.Base64);
    
    const response = {
        signatureVersion: "HMAC_SHA256_V1",
        merchantParameters: merchantBase64,
        signature: signatureBase64,
        url: process.env.NEXT_PUBLIC_REDSYS_URL
    };
    return response
}
