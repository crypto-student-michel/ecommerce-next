"use server";

import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import path from "node:path";
import fs from "node:fs";
import jwt from "jsonwebtoken";

// ───────────────────────────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────────────────────────
export interface Product {
  ProductID: number;
  ProductName: string;
  UnitPrice: number;
  UnitsInStock: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Conexión SQLite (singleton)
// ───────────────────────────────────────────────────────────────────────────────
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/** Resuelve y valida la ruta del Northwind.db */
function resolveDbPath(): string {
  const fromEnv = process.env.NORTHWIND_DB_PATH
    ? path.resolve(process.cwd(), process.env.NORTHWIND_DB_PATH)
    : null;

  const candidates = [
    fromEnv,
    path.resolve(process.cwd(), "northwind", "northwind.db"), // recomendado
    path.resolve(process.cwd(), "prisma", "northwind.db"),
    path.resolve(process.cwd(), "northwind.db"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "No encuentro el fichero de base de datos Northwind.\nProbadas rutas:\n" +
      candidates.join("\n")
  );
}

/** Garantiza tabla 'cesta' */
async function ensureCestaTable(dbi: Database<sqlite3.Database, sqlite3.Statement>) {
  await dbi.exec(`
    CREATE TABLE IF NOT EXISTS cesta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      cestaId TEXT NOT NULL,
      username TEXT NULL,
      cantidad INTEGER NOT NULL,
      UNIQUE(productId, cestaId)
    );
  `);
}

/** Garantiza tabla 'cobro' */
async function ensureCobroTable(dbi: Database<sqlite3.Database, sqlite3.Statement>) {
  await dbi.exec(`
    CREATE TABLE IF NOT EXISTS cobro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      customerId TEXT NOT NULL,
      amount REAL NOT NULL,
      authorizationCode TEXT NOT NULL UNIQUE,
      fecha TEXT NOT NULL
    );
  `);
}

export async function getDb() {
  if (db) return db;

  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite file not found at: ${dbPath}`);
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  // Comprobación de Northwind
  const cust = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Customers';"
  );
  if (!cust) {
    throw new Error(
      `La tabla 'Customers' no existe en ${dbPath}. Estás apuntando al .db equivocado.`
    );
  }

  // Usuarios (para login simple)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      acceptPolicy INTEGER NOT NULL DEFAULT 0,
      acceptMarketing INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await ensureCestaTable(db);
  await ensureCobroTable(db);
  return db;
}

// ───────────────────────────────────────────────────────────────────────────────
// Productos
// ───────────────────────────────────────────────────────────────────────────────
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.all<Product[]>(`
    SELECT ProductID, ProductName, UnitPrice, UnitsInStock
    FROM Products
    ORDER BY ProductID
  `);
}

/** Detalle de producto por id */
export async function getProduct(id: number): Promise<Product | null> {
  const db = await getDb();
  const row = await db.get<Product>(
    `SELECT ProductID, ProductName, UnitPrice, UnitsInStock
     FROM Products
     WHERE ProductID = ?
     LIMIT 1`,
    [id]
  );
  return row ?? null;
}

export const getProductById = getProduct;

// ───────────────────────────────────────────────────────────────────────────────
// Customers / Users
// ───────────────────────────────────────────────────────────────────────────────
async function ensureCustomer(username: string) {
  const db = await getDb();
  const found = await db.get(
    "SELECT CustomerID FROM Customers WHERE CustomerID = ?",
    [username]
  );
  if (!found) {
    await db.run(
      `INSERT OR IGNORE INTO Customers (CustomerID, CompanyName, ContactName)
       VALUES (?, ?, ?)`,
      [username, username, username]
    );
  }
}

export async function insertUser(
  username: string,
  password: string, // ya hasheado
  acceptPolicy: boolean,
  acceptMarketing: boolean
) {
  const db = await getDb();

  const existingUser = await db.get(
    "SELECT 1 FROM users WHERE username = ?",
    [username]
  );
  if (existingUser) {
    throw new Error("Username already exists");
  }

  await ensureCustomer(username);

  const res = await db.run(
    `INSERT INTO users (username, password, acceptPolicy, acceptMarketing)
     VALUES (?, ?, ?, ?)`,
    [username, password, acceptPolicy ? 1 : 0, acceptMarketing ? 1 : 0]
  );

  return res.lastID;
}

export async function getUser(username: string, password: string) {
  const db = await getDb();
  const user = await db.get(
    "SELECT id, username FROM users WHERE username = ? AND password = ?",
    [username, password]
  );
  if (!user) {
    throw new Error("Invalid username or password");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const token = jwt.sign(
    { id: (user as any).id, username: (user as any).username },
    secret,
    { expiresIn: "1h" }
  );
  (user as any).token = token;
  return user;
}

export async function getCustomer(customerId: string) {
  const db = await getDb();
  return db.get("SELECT * FROM Customers WHERE CustomerID = ?", [customerId]);
}

export async function saveCustomer(customerId: string, values: any) {
  const db = await getDb();
  const {
    CompanyName, ContactName, ContactTitle, Address, City,
    Region, PostalCode, Country, Phone, Fax,
  } = values;

  await db.run(
    `
    UPDATE Customers SET 
      CompanyName = ?, ContactName = ?, ContactTitle = ?, Address = ?, City = ?,
      Region = ?, PostalCode = ?, Country = ?, Phone = ?, Fax = ?
    WHERE CustomerID = ?
  `,
    [
      CompanyName, ContactName, ContactTitle, Address, City,
      Region, PostalCode, Country, Phone, Fax, customerId,
    ]
  );
}

export async function getCustomerOrders(customerId: string) {
  const db = await getDb();
  return db.all(
    `
    SELECT
      OrderID,
      OrderDate,
      (SELECT SUM(UnitPrice * Quantity)
         FROM "Order Details"
        WHERE OrderID = Orders.OrderID) AS TotalImporte,
      (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
         FROM cobro
        WHERE orderId = Orders.OrderID) AS Cobrado
    FROM Orders
    WHERE CustomerID = ?
    ORDER BY OrderDate DESC
  `,
    [customerId]
  );
}

export async function getOrder(orderId: string) {
  const db = await getDb();
  const order = await db.get("SELECT * FROM Orders WHERE OrderID = ?", [
    orderId,
  ]);
  const details = await db.all(
    `
    SELECT od.*, p.ProductName
    FROM "Order Details" od
    JOIN Products p ON od.ProductID = p.ProductID
    WHERE od.OrderID = ?
  `,
    [orderId]
  );
  const totalAmount = (details as any[]).reduce(
    (sum: number, d: any) => sum + d.UnitPrice * d.Quantity * (1 - d.Discount),
    0
  );
  (order as any).Details = details;
  (order as any).TotalAmount = parseFloat(totalAmount.toFixed(2));
  return order;
}

// ───────────────────────────────────────────────────────────────────────────────
// Cesta
// ───────────────────────────────────────────────────────────────────────────────

export async function cesta(
  productId: string,
  cestaId: string,
  username: string | null,
  cantidad: number
) {
  const db = await getDb();
  await ensureCestaTable(db);

  const productIdNumber = Number(productId);
  if (!Number.isFinite(productIdNumber)) {
    throw new Error(`cesta(): productId inválido: ${productId}`);
  }

  const cantidadNumber = Number(cantidad);
  if (!Number.isFinite(cantidadNumber) || cantidadNumber < 0) {
    throw new Error(`cesta(): cantidad inválida: ${cantidad}`);
  }

  await db.run(
    `
    INSERT INTO cesta (productId, cestaId, cantidad, username)
    VALUES (:productId, :cestaId, :cantidad, :username)
    ON CONFLICT(productId, cestaId) DO UPDATE SET cantidad = :cantidad
  `,
    {
      ":productId": productIdNumber,
      ":cestaId": cestaId,
      ":cantidad": cantidadNumber,
      ":username": username ?? null,
    }
  );

  // Si la cantidad queda a 0, eliminamos la fila
  await db.run(`DELETE FROM cesta WHERE cestaId = :cestaId AND cantidad = 0`, {
    ":cestaId": cestaId,
  });
}

export async function getCesta(idCesta: string) {
  const db = await getDb();
  await ensureCestaTable(db);
  return db.all(
    `
    SELECT c.productId AS ProductID,
           p.ProductName AS ProductName,
           c.cantidad
    FROM cesta c
    JOIN Products p ON c.productId = p.ProductID
    WHERE c.cestaId = ?
  `,
    [idCesta]
  );
}

/** Asociar cesta temporal a usuario tras login */
export async function associateCestaIdWithUsername(
  cestaId: string,
  username: string
) {
  const db = await getDb();
  await ensureCestaTable(db);

  const rows = await db.all(
    `
    SELECT productId, MAX(cantidad) AS cantidad
    FROM cesta
    WHERE username = ? OR cestaId = ?
    GROUP BY productId
  `,
    [username, cestaId]
  );

  await db.run("DELETE FROM cesta WHERE username = ? OR cestaId = ?", [
    username,
    cestaId,
  ]);

  for (const r of rows as any[]) {
    const productIdNumber = Number(r.productId);
    const cantidadNumber = Number(r.cantidad);

    if (!Number.isFinite(productIdNumber)) {
      console.warn(
        "associateCestaIdWithUsername: fila con productId inválido, se omite:",
        r
      );
      continue;
    }

    if (!Number.isFinite(cantidadNumber) || cantidadNumber <= 0) {
      continue;
    }

    await db.run(
      `
      INSERT INTO cesta (productId, cestaId, username, cantidad)
      VALUES (?, ?, ?, ?)
    `,
      [productIdNumber, cestaId, username, cantidadNumber]
    );
  }
}

/** Crear pedido desde la cesta del usuario */
export async function createOrder(username: string, idCesta: string) {
  const db = await getDb();
  await ensureCestaTable(db);

  try {
    await db.run("BEGIN TRANSACTION");

    // 1) Aseguramos el customer
    await ensureCustomer(username);

    const customer = await db.get<{ CustomerID: string }>(
      "SELECT CustomerID FROM Customers WHERE CustomerID = ?",
      [username]
    );
    if (!customer) {
      throw new Error(`createOrder: customer no encontrado para ${username}`);
    }

    // 2) Creamos el pedido
    const orderDate = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO Orders (CustomerID, OrderDate) VALUES (?, ?)`,
      [customer.CustomerID, orderDate]
    );
    const orderId = result.lastID as number | undefined;
    if (!orderId) {
      throw new Error("createOrder: no se pudo obtener lastID de Orders");
    }

    // 3) Obtenemos los items de la cesta (TIPADO EXPLÍCITO)
    const cestaItems: { ProductID: number; cantidad: number; UnitPrice: number }[] =
      await db.all(
        `
        SELECT c.productId AS ProductID, c.cantidad, p.UnitPrice
        FROM cesta c
        JOIN Products p ON c.productId = p.ProductID
        WHERE c.cestaId = ?
      `,
        [idCesta]
      );

    if (!cestaItems || cestaItems.length === 0) {
      throw new Error(`createOrder: cesta vacía para idCesta=${idCesta}`);
    }

    // 4) Insertamos las líneas de detalle
    for (const item of cestaItems) {
      await db.run(
        `
        INSERT INTO "Order Details" (OrderID, ProductID, UnitPrice, Quantity, Discount)
        VALUES (?, ?, ?, ?, 0)
      `,
        [orderId, item.ProductID, item.UnitPrice, item.cantidad]
      );
    }

    // 5) Calculamos el total del pedido (TIPADO EXPLÍCITO)
    const totalRow = await db.get<{ TotalAmount: number }>(
      `
      SELECT SUM(UnitPrice * Quantity) as TotalAmount
      FROM "Order Details"
      WHERE OrderID = ?
    `,
      [orderId]
    );
    const totalAmount = totalRow?.TotalAmount ?? 0;

    // 6) Limpiamos la cesta
    await db.run(`DELETE FROM cesta WHERE cestaId = ?`, [idCesta]);

    await db.run("COMMIT");

    return { orderId, totalAmount };
  } catch (error) {
    await db.run("ROLLBACK");
    console.error("Error creating order:", error);
    throw error;
  }
}


// ───────────────────────────────────────────────────────────────────────────────
// Cobro
// ───────────────────────────────────────────────────────────────────────────────
export async function saveCobro(
  customerId: string,
  orderId: number,
  amount: number,
  authorizationCode: string
) {
  const db = await getDb();
  await ensureCobroTable(db);
  const fecha = new Date().toISOString();
  const res = await db.run(
    `INSERT INTO cobro (orderId, customerId, amount, fecha, authorizationCode)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, customerId, amount, fecha, authorizationCode]
  );
  return res.lastID;
}

// ───────────────────────────────────────────────────────────────────────────────
// Cambio de contraseña
// ───────────────────────────────────────────────────────────────────────────────
export async function setPassword(
  customerId: string,
  currentPassword: string,
  newPassword: string
) {
  const db = await getDb();
  const user = await db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [customerId, currentPassword]
  );
  if (!user) throw new Error("Invalid username or password");
  await db.run("UPDATE users SET password = ? WHERE username = ?", [
    newPassword,
    customerId,
  ]);
}
