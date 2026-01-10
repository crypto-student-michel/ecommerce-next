/// <reference types="bun-types" />

import { NextRequest, NextResponse } from "next/server";
import { Database } from "bun:sqlite";
import crypto from "crypto";
import path from "path";

function normalizeBase64(v: string) {
  // Redsys a veces trae '+' como ' ' o base64url (- _)
  let s = (v || "").trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  // padding
  while (s.length % 4 !== 0) s += "=";
  return s;
}

function getDbPath() {
  const raw = process.env.SQLITE_DB_PATH || "./northwind/northwind.db";
  // si es relativo => lo hacemos absoluto desde el root del proyecto dentro del contenedor
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function ensureCobroTable(db: Database) {
  // exec soporta multi-statement; si tu editor se queja, no afecta runtime, pero aquí suele ir bien.
  db.exec(`
    CREATE TABLE IF NOT EXISTS cobro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      customerId TEXT NOT NULL,
      amount REAL NOT NULL,
      authorizationCode TEXT NOT NULL UNIQUE,
      fecha TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cobro_orderId ON cobro(orderId);
  `);
}

function decodeMerchantParameters(dsMerchantParameters: string) {
  const mp = normalizeBase64(dsMerchantParameters);
  const jsonStr = Buffer.from(mp, "base64").toString("utf8");
  return JSON.parse(jsonStr) as Record<string, any>;
}

function decodeSecretKey(secret: string) {
  // Redsys suele dar la clave en base64
  const norm = normalizeBase64(secret);
  const b = Buffer.from(norm, "base64");
  // si por alguna razón no es base64 válido, fallback a utf8
  if (!b.length) return Buffer.from(secret, "utf8");
  return b;
}

function derive3DESKeyForOrder(secretKey: Buffer, order: string) {
  // Redsys: 3DES-CBC con IV = 0, sin autopadding, con el order como bytes y padding 0 hasta múltiplo de 8
  const iv = Buffer.alloc(8, 0);
  const orderBuf = Buffer.from(order, "utf8");
  const paddedLen = Math.ceil(orderBuf.length / 8) * 8;
  const padded = Buffer.alloc(paddedLen, 0);
  orderBuf.copy(padded);

  const cipher = crypto.createCipheriv("des-ede3-cbc", secretKey, iv);
  cipher.setAutoPadding(false);

  const enc = Buffer.concat([cipher.update(padded), cipher.final()]);
  return enc; // esto será la “clave derivada” para el HMAC
}

function computeSignature(secretKey: Buffer, dsOrder: string, dsMerchantParametersRaw: string) {
  const derivedKey = derive3DESKeyForOrder(secretKey, dsOrder);
  // HMAC (Hash-based Message Authentication Code) SHA-256 sobre Ds_MerchantParameters (tal cual viene)
  const hmac = crypto.createHmac("sha256", derivedKey);
  hmac.update(dsMerchantParametersRaw, "utf8");
  return hmac.digest("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const Ds_SignatureVersion = String(body.Ds_SignatureVersion || "");
    const Ds_MerchantParameters = String(body.Ds_MerchantParameters || "");
    const Ds_Signature = String(body.Ds_Signature || "");

    // Estos son los tuyos (de tu app)
    const appOrderIdRaw = body.orderId;
    const customerId = String(body.customerId || "");

    if (!Ds_SignatureVersion || !Ds_MerchantParameters || !Ds_Signature) {
      return NextResponse.json(
        { ok: false, error: "Faltan Ds_SignatureVersion / Ds_MerchantParameters / Ds_Signature" },
        { status: 400 }
      );
    }

    if (!appOrderIdRaw || !customerId) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros de tu app (orderId/customerId). Envíalos desde /ok." },
        { status: 400 }
      );
    }

    const appOrderId = Number(String(appOrderIdRaw).replace(/\D/g, ""));
    if (!Number.isFinite(appOrderId) || appOrderId <= 0) {
      return NextResponse.json({ ok: false, error: "orderId inválido" }, { status: 400 });
    }

    const mpDecoded = decodeMerchantParameters(Ds_MerchantParameters);

    const dsOrder = String(mpDecoded.Ds_Order || "");
    const dsAmount = String(mpDecoded.Ds_Amount || "0");
    const dsResponse = String(mpDecoded.Ds_Response || "");
    const dsAuth = String(mpDecoded.Ds_AuthorisationCode || mpDecoded.Ds_AuthorizationCode || "");

    // Validación de respuesta (Redsys: 0..99 suele ser OK)
    const responseNum = parseInt(dsResponse, 10);
    const isOkResponse = Number.isFinite(responseNum) && responseNum >= 0 && responseNum < 100;

    const secretEnv = process.env.REDSYS_SECRET || "";
    if (!secretEnv) {
      return NextResponse.json({ ok: false, error: "Falta REDSYS_SECRET en el entorno" }, { status: 500 });
    }

    const secretKey = decodeSecretKey(secretEnv);

    // Importante: para comparar firmas, normalizamos ambos lados
    const expected = normalizeBase64(computeSignature(secretKey, dsOrder, Ds_MerchantParameters));
    const received = normalizeBase64(Ds_Signature);

    if (expected !== received) {
      return NextResponse.json(
        {
          ok: false,
          error: "Firma inválida (Ds_Signature no coincide)",
          debug: {
            dsOrder,
            dsResponse,
          },
        },
        { status: 400 }
      );
    }

    if (!isOkResponse) {
      return NextResponse.json(
        { ok: false, error: `Pago no autorizado (Ds_Response=${dsResponse})`, dsResponse },
        { status: 400 }
      );
    }

    // Guardar cobro en DB (Database)
    const db = new Database(getDbPath());
    ensureCobroTable(db);

    const amount = Number(dsAmount) / 100; // céntimos => euros
    const fecha = new Date().toISOString();
    const authCode = dsAuth || `AUTH_${Date.now()}`;

    // ✅ aquí usamos prepare().run() para que TS NO subraye en rojo
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO cobro (orderId, customerId, amount, authorizationCode, fecha)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(appOrderId, customerId, amount, authCode, fecha);

    return NextResponse.json({
      ok: true,
      orderId: appOrderId,
      customerId,
      amount,
      authorizationCode: authCode,
      dsOrder,
      dsResponse,
      Ds_SignatureVersion,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Error interno confirmando pago", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
