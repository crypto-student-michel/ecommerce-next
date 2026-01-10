/////////////////////////--------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Explicación del código primer intento:


// /// <reference types="bun-types" />

// import { NextRequest, NextResponse } from "next/server";
// import { Database } from "bun:sqlite";
// import crypto from "crypto";
// import path from "path";

// /**
//  * Normaliza base64: Redsys a veces trae espacios en vez de '+'
//  * o viene en base64url (- _).
//  */
// function normalizeBase64(v: string) {
//   let s = (v || "").trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
//   while (s.length % 4 !== 0) s += "=";
//   return s;
// }

// function getDbPath() {
//   const raw = process.env.SQLITE_DB_PATH || "./northwind/northwind.db";
//   return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
// }

// function ensureCobroTable(db: Database) {
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS cobro (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       orderId INTEGER NOT NULL,
//       customerId TEXT NOT NULL,
//       amount REAL NOT NULL,
//       authorizationCode TEXT NOT NULL UNIQUE,
//       fecha TEXT NOT NULL
//     );
//     CREATE INDEX IF NOT EXISTS idx_cobro_orderId ON cobro(orderId);
//   `);
// }

// function decodeMerchantParameters(dsMerchantParameters: string) {
//   const mp = normalizeBase64(dsMerchantParameters);
//   const jsonStr = Buffer.from(mp, "base64").toString("utf8");
//   return JSON.parse(jsonStr) as Record<string, any>;
// }

// function decodeSecretKey(secret: string) {
//   const norm = normalizeBase64(secret);
//   const b = Buffer.from(norm, "base64");
//   if (!b.length) return Buffer.from(secret, "utf8");
//   return b;
// }

// function derive3DESKeyForOrder(secretKey: Buffer, order: string) {
//   // Redsys: 3DES-CBC con IV 0, sin autopadding, order con padding 0 a múltiplo de 8
//   const iv = Buffer.alloc(8, 0);
//   const orderBuf = Buffer.from(order, "utf8");
//   const paddedLen = Math.ceil(orderBuf.length / 8) * 8;
//   const padded = Buffer.alloc(paddedLen, 0);
//   orderBuf.copy(padded);

//   const cipher = crypto.createCipheriv("des-ede3-cbc", secretKey, iv);
//   cipher.setAutoPadding(false);

//   return Buffer.concat([cipher.update(padded), cipher.final()]);
// }

// function computeSignature(secretKey: Buffer, dsOrder: string, dsMerchantParametersRaw: string) {
//   const derivedKey = derive3DESKeyForOrder(secretKey, dsOrder);
//   // HMAC (Hash-based Message Authentication Code) SHA-256 sobre Ds_MerchantParameters (tal cual viene)
//   const hmac = crypto.createHmac("sha256", derivedKey);
//   hmac.update(dsMerchantParametersRaw, "utf8");
//   return hmac.digest("base64");
// }

// /** Helpers para detectar tablas/columnas (para actualizar stock sin romper) */
// function tableExists(db: Database, tableName: string): boolean {
//   const row = db.prepare(
//     `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
//   ).get(tableName) as any;
//   return !!row?.ok;
// }

// function pickExistingTable(db: Database, candidates: string[]): string | null {
//   for (const t of candidates) {
//     if (tableExists(db, t)) return t;
//   }
//   return null;
// }

// function columnExists(db: Database, tableName: string, col: string): boolean {
//   try {
//     const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
//     return rows.some((r) => String(r?.name).toLowerCase() === col.toLowerCase());
//   } catch {
//     return false;
//   }
// }

// /**
//  * Resta stock cuando el pago es OK.
//  * Soporta nombres típicos de Northwind:
//  * - Products / products con ProductID y UnitsInStock
//  * - OrderDetails / order_details con OrderID, ProductID, Quantity
//  */
// function tryDecreaseStockForOrder(db: Database, orderId: number) {
//   const productsTable = pickExistingTable(db, ["Products", "products"]);
//   const detailsTable = pickExistingTable(db, ["OrderDetails", "order_details", "Order_Details", "orderDetails"]);

//   if (!productsTable || !detailsTable) {
//     return { updated: false, reason: "No existen tablas Products/OrderDetails en esta DB" };
//   }

//   const prodIdCol =
//     columnExists(db, productsTable, "ProductID") ? "ProductID" :
//     columnExists(db, productsTable, "productId") ? "productId" : null;

//   const stockCol =
//     columnExists(db, productsTable, "UnitsInStock") ? "UnitsInStock" :
//     columnExists(db, productsTable, "unitsInStock") ? "unitsInStock" : null;

//   const dOrderCol =
//     columnExists(db, detailsTable, "OrderID") ? "OrderID" :
//     columnExists(db, detailsTable, "orderId") ? "orderId" : null;

//   const dProdCol =
//     columnExists(db, detailsTable, "ProductID") ? "ProductID" :
//     columnExists(db, detailsTable, "productId") ? "productId" : null;

//   const qtyCol =
//     columnExists(db, detailsTable, "Quantity") ? "Quantity" :
//     columnExists(db, detailsTable, "quantity") ? "quantity" : null;

//   if (!prodIdCol || !stockCol || !dOrderCol || !dProdCol || !qtyCol) {
//     return { updated: false, reason: "Columnas esperadas no encontradas (ProductID/UnitsInStock/Quantity...)" };
//   }

//   const lines = db
//     .prepare(`SELECT ${dProdCol} AS productId, ${qtyCol} AS qty FROM ${detailsTable} WHERE ${dOrderCol}=?`)
//     .all(orderId) as any[];

//   if (!lines?.length) {
//     return { updated: false, reason: "No hay líneas de pedido en OrderDetails para este OrderID" };
//   }

//   const updateStmt = db.prepare(`
//     UPDATE ${productsTable}
//     SET ${stockCol} = CASE
//       WHEN ${stockCol} - ? < 0 THEN 0
//       ELSE ${stockCol} - ?
//     END
//     WHERE ${prodIdCol} = ?
//   `);

//   try {
//     db.exec("BEGIN");
//     for (const l of lines) {
//       const pid = Number(l.productId);
//       const qty = Number(l.qty);
//       if (Number.isFinite(pid) && Number.isFinite(qty) && qty > 0) {
//         updateStmt.run(qty, qty, pid);
//       }
//     }
//     db.exec("COMMIT");
//     return { updated: true, lines: lines.length };
//   } catch (e: any) {
//     try { db.exec("ROLLBACK"); } catch {}
//     return { updated: false, reason: `Error actualizando stock: ${String(e?.message || e)}` };
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     const Ds_SignatureVersion = String(body.Ds_SignatureVersion || "");
//     const Ds_MerchantParameters = String(body.Ds_MerchantParameters || "");
//     const Ds_Signature = String(body.Ds_Signature || "");

//     // Parámetros de TU app (enviados desde /ok)
//     const appOrderIdRaw = body.orderId;
//     const customerId = String(body.customerId || "");

//     if (!Ds_SignatureVersion || !Ds_MerchantParameters || !Ds_Signature) {
//       return NextResponse.json(
//         { ok: false, error: "Faltan Ds_SignatureVersion / Ds_MerchantParameters / Ds_Signature" },
//         { status: 400 }
//       );
//     }

//     if (!appOrderIdRaw || !customerId) {
//       return NextResponse.json(
//         { ok: false, error: "Faltan parámetros de tu app (orderId/customerId). Envíalos desde /ok." },
//         { status: 400 }
//       );
//     }

//     const appOrderId = Number(String(appOrderIdRaw).replace(/\D/g, ""));
//     if (!Number.isFinite(appOrderId) || appOrderId <= 0) {
//       return NextResponse.json({ ok: false, error: "orderId inválido" }, { status: 400 });
//     }

//     const mpDecoded = decodeMerchantParameters(Ds_MerchantParameters);

//     const dsOrder = String(mpDecoded.Ds_Order || "");
//     const dsAmount = String(mpDecoded.Ds_Amount || "0");
//     const dsResponse = String(mpDecoded.Ds_Response || "");
//     const dsAuth = String(mpDecoded.Ds_AuthorisationCode || mpDecoded.Ds_AuthorizationCode || "");

//     // Redsys: 0..99 => OK normalmente
//     const responseNum = parseInt(dsResponse, 10);
//     const isOkResponse = Number.isFinite(responseNum) && responseNum >= 0 && responseNum < 100;

//     const secretEnv = process.env.REDSYS_SECRET || "";
//     if (!secretEnv) {
//       return NextResponse.json({ ok: false, error: "Falta REDSYS_SECRET en el entorno" }, { status: 500 });
//     }

//     const secretKey = decodeSecretKey(secretEnv);

//     // Comparación de firma (normalizando ambos lados)
//     const expected = normalizeBase64(computeSignature(secretKey, dsOrder, Ds_MerchantParameters));
//     const received = normalizeBase64(Ds_Signature);

//     if (expected !== received) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: "Firma inválida (Ds_Signature no coincide)",
//           debug: { dsOrder, dsResponse },
//         },
//         { status: 400 }
//       );
//     }

//     if (!isOkResponse) {
//       return NextResponse.json(
//         { ok: false, error: `Pago no autorizado (Ds_Response=${dsResponse})`, dsResponse },
//         { status: 400 }
//       );
//     }

//     // Guardar cobro en DB
//     const db = new Database(getDbPath());
//     ensureCobroTable(db);

//     const amount = Number(dsAmount) / 100; // céntimos => euros
//     const fecha = new Date().toISOString();
//     const authCode = dsAuth || `AUTH_${Date.now()}`;

//     // IMPORTANTE: usar prepare().run() (evita subrayado rojo en TS)
//     const insertStmt = db.prepare(`
//       INSERT OR IGNORE INTO cobro (orderId, customerId, amount, authorizationCode, fecha)
//       VALUES (?, ?, ?, ?, ?)
//     `);
//     insertStmt.run(appOrderId, customerId, amount, authCode, fecha);

//     // ✅ (Opcional) Restar stock si tu DB tiene tablas de Northwind
//     const stockResult = tryDecreaseStockForOrder(db, appOrderId);

//     return NextResponse.json({
//       ok: true,
//       orderId: appOrderId,
//       customerId,
//       amount,
//       authorizationCode: authCode,
//       dsOrder,
//       dsResponse,
//       Ds_SignatureVersion,
//       stock: stockResult,
//     });
//   } catch (err: any) {
//     return NextResponse.json(
//       { ok: false, error: "Error interno confirmando pago", detail: String(err?.message || err) },
//       { status: 500 }
//     );
//   }
// }

/////////////////////////////////////////////------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Explicación del código segundo intento:

/// <reference types="bun-types" />

import { NextRequest, NextResponse } from "next/server";
import { Database } from "bun:sqlite";
import crypto from "crypto";
import path from "path";

function normalizeBase64(v: string) {
  let s = (v || "")
    .trim()
    .replace(/ /g, "+")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return s;
}

function getDbPath() {
  const raw = process.env.SQLITE_DB_PATH || "./northwind/northwind.db";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function ensureCobroTable(db: Database) {
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

    -- ✅ Muy importante: evita cobrar/descontar stock 2 veces para el mismo pedido
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cobro_order_unique ON cobro(orderId);
  `);
}

function decodeMerchantParameters(dsMerchantParameters: string) {
  const mp = normalizeBase64(dsMerchantParameters);
  const jsonStr = Buffer.from(mp, "base64").toString("utf8");
  return JSON.parse(jsonStr) as Record<string, any>;
}

function decodeSecretKey(secret: string) {
  const norm = normalizeBase64(secret);
  const b = Buffer.from(norm, "base64");
  if (!b.length) return Buffer.from(secret, "utf8");
  return b;
}

function derive3DESKeyForOrder(secretKey: Buffer, order: string) {
  const iv = Buffer.alloc(8, 0);
  const orderBuf = Buffer.from(order, "utf8");
  const paddedLen = Math.ceil(orderBuf.length / 8) * 8;
  const padded = Buffer.alloc(paddedLen, 0);
  orderBuf.copy(padded);

  const cipher = crypto.createCipheriv("des-ede3-cbc", secretKey, iv);
  cipher.setAutoPadding(false);

  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

function computeSignature(secretKey: Buffer, dsOrder: string, dsMerchantParametersRaw: string) {
  const derivedKey = derive3DESKeyForOrder(secretKey, dsOrder);
  const hmac = crypto.createHmac("sha256", derivedKey);
  hmac.update(dsMerchantParametersRaw, "utf8");
  return hmac.digest("base64");
}

/**
 * Lee las líneas del pedido desde la tabla de detalles.
 * En Northwind suele llamarse "Order Details" (con espacio).
 * Por si tu DB lo tiene como "Order_Details", probamos ambas.
 */
function getOrderLines(db: Database, orderId: number): Array<{ productId: number; qty: number }> {
  const sql1 = `SELECT ProductID as productId, Quantity as qty FROM "Order Details" WHERE OrderID = ?`;
  const sql2 = `SELECT ProductID as productId, Quantity as qty FROM "Order_Details" WHERE OrderID = ?`;

  try {
    return db.prepare(sql1).all(orderId) as any;
  } catch {
    return db.prepare(sql2).all(orderId) as any;
  }
}

function decrementStockForOrder(db: Database, orderId: number) {
  const lines = getOrderLines(db, orderId);

  if (!lines.length) return;

  const upd = db.prepare(`
    UPDATE Products
    SET UnitsInStock =
      CASE
        WHEN UnitsInStock >= ? THEN UnitsInStock - ?
        ELSE 0
      END
    WHERE ProductID = ?
  `);

  for (const l of lines) {
    const qty = Number(l.qty) || 0;
    const productId = Number(l.productId) || 0;
    if (qty > 0 && productId > 0) {
      upd.run(qty, qty, productId);
    }
  }
}

export async function POST(req: NextRequest) {
  let db: Database | null = null;

  try {
    const body = await req.json();

    const Ds_SignatureVersion = String(body.Ds_SignatureVersion || "");
    const Ds_MerchantParameters = String(body.Ds_MerchantParameters || "");
    const Ds_Signature = String(body.Ds_Signature || "");

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

    const responseNum = parseInt(dsResponse, 10);
    const isOkResponse = Number.isFinite(responseNum) && responseNum >= 0 && responseNum < 100;

    const secretEnv = process.env.REDSYS_SECRET || "";
    if (!secretEnv) {
      return NextResponse.json({ ok: false, error: "Falta REDSYS_SECRET en el entorno" }, { status: 500 });
    }

    const secretKey = decodeSecretKey(secretEnv);

    const expected = normalizeBase64(computeSignature(secretKey, dsOrder, Ds_MerchantParameters));
    const received = normalizeBase64(Ds_Signature);

    if (expected !== received) {
      return NextResponse.json(
        { ok: false, error: "Firma inválida (Ds_Signature no coincide)", debug: { dsOrder, dsResponse } },
        { status: 400 }
      );
    }

    if (!isOkResponse) {
      return NextResponse.json(
        { ok: false, error: `Pago no autorizado (Ds_Response=${dsResponse})`, dsResponse },
        { status: 400 }
      );
    }

    db = new Database(getDbPath());
    ensureCobroTable(db);

    const amount = Number(dsAmount) / 100;
    const fecha = new Date().toISOString();
    const authCode = dsAuth || `AUTH_${Date.now()}`;

    // ✅ Todo en transacción para que cobro+stock sea consistente
    db.exec("BEGIN");

    // Insert cobro (si ya existe para ese orderId, se ignora por UNIQUE)
    const ins = db.prepare(`
      INSERT OR IGNORE INTO cobro (orderId, customerId, amount, authorizationCode, fecha)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = ins.run(appOrderId, customerId, amount, authCode, fecha);

    // ✅ Solo descontamos stock si este cobro se insertó ahora (evita doble descuento)
    if (info.changes > 0) {
      decrementStockForOrder(db, appOrderId);
    }

    db.exec("COMMIT");

    return NextResponse.json({
      ok: true,
      orderId: appOrderId,
      customerId,
      amount,
      authorizationCode: authCode,
      dsOrder,
      dsResponse,
      Ds_SignatureVersion,
      stockDecremented: info.changes > 0,
    });
  } catch (err: any) {
    try {
      db?.exec("ROLLBACK");
    } catch {}
    return NextResponse.json(
      { ok: false, error: "Error interno confirmando pago", detail: String(err?.message || err) },
      { status: 500 }
    );
  } finally {
    try {
      db?.close();
    } catch {}
  }
}
