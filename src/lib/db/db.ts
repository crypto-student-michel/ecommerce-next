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
    path.resolve(process.cwd(), "prisma", "northwind.db"),    // evita usarlo
    path.resolve(process.cwd(), "northwind.db"),              // fallback antiguo
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
      ProductID INTEGER NOT NULL,
      cestaId TEXT NOT NULL,
      username TEXT NULL,
      cantidad INTEGER NOT NULL,
      UNIQUE(ProductID, cestaId)
    );
  `);
}

/** Garantiza tabla 'cobro' (para evitar errores en consultas de pedidos) */
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

// Alias (si en algún punto usas getProductById)
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
  password: string, // llega hasheado
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

// ───────────────────────────────────────────────────────────────────────────────
export async function getCustomerOrders(customerId: string) {
  const db = await getDb();
  // 'cobro' está garantizada por ensureCobroTable()
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

  await db.run(
    `
    INSERT INTO cesta (ProductID, cestaId, cantidad, username)
    VALUES (:ProductID, :cestaId, :cantidad, :username)
    ON CONFLICT(ProductID, cestaId) DO UPDATE SET cantidad = :cantidad
  `,
    {
      ":ProductID": productId,
      ":cestaId": cestaId,
      ":cantidad": cantidad,
      ":username": username,
    }
  );

  await db.run(`DELETE FROM cesta WHERE cestaId = :cestaId AND cantidad = 0`, {
    ":cestaId": cestaId,
  });
}

export async function getCesta(idCesta: string) {
  const db = await getDb();
  await ensureCestaTable(db);
  return db.all(
    `
    SELECT c.ProductID,
           p.ProductName AS ProductName,  -- ← mismo nombre que usas en React
           c.cantidad
    FROM cesta c
    JOIN Products p ON c.ProductID = p.ProductID
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
    SELECT ProductID, MAX(cantidad) AS cantidad
    FROM cesta
    WHERE username = ? OR cestaId = ?
    GROUP BY ProductID
  `,
    [username, cestaId]
  );

  await db.run("DELETE FROM cesta WHERE username = ? OR cestaId = ?", [
    username,
    cestaId,
  ]);

  for (const r of rows as any[]) {
    await db.run(
      `
      INSERT INTO cesta (ProductID, cestaId, username, cantidad)
      VALUES (?, ?, ?, ?)
    `,
      [r.ProductID, cestaId, username, r.cantidad]
    );
  }
}

/** Crear pedido desde la cesta del usuario */
export async function createOrder(username: string, idCesta: string) {
  const db = await getDb();
  await ensureCestaTable(db);

  try {
    await db.run("BEGIN TRANSACTION");

    const customer = await db.get(
      "SELECT CustomerID FROM Customers WHERE CustomerID = ?",
      [username]
    );
    if (!customer) {
      throw new Error("Customer not found");
    }

    const orderDate = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO Orders (CustomerID, OrderDate) VALUES (?, ?)`,
      [customer.CustomerID, orderDate]
    );
    const orderId = result.lastID;

    const cestaItems = await db.all(
    //   `
    //   SELECT c.ProductID, c.cantidad, p.UnitPrice
    //   FROM cesta c
    //   JOIN Products p ON c.ProductID = p.ProductID
    //   WHERE c.username = ?
    // `,
    //       [username]
    // );
      `
      SELECT c.ProductID, c.cantidad, p.UnitPrice
      FROM cesta c
      JOIN Products p ON c.ProductID = p.ProductID
      WHERE c.cestaId = ? AND c.username = ?
    `,
      [idCesta, username] // <-- ¡CORREGIDO! Usamos idCesta y username
    );

    for (const item of cestaItems as any[]) {
      await db.run(
        `
        INSERT INTO "Order Details" (OrderID, ProductID, UnitPrice, Quantity, Discount)
        VALUES (?, ?, ?, ?, 0)
      `,
        [orderId, item.ProductID, item.UnitPrice, item.cantidad]
      );
    }

    const totalResult = await db.get(
      `
      SELECT SUM(UnitPrice * Quantity) as TotalAmount
      FROM "Order Details"
      WHERE OrderID = ?
    `,
      [orderId]
    );
    const totalAmount = (totalResult as any)?.TotalAmount ?? 0;

    await db.run("DELETE FROM cesta WHERE username = ?", [username]);

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
  await ensureCobroTable(db); // por si acaso
  const fecha = new Date().toISOString();
  const res = await db.run(
    `INSERT INTO cobro (orderId, customerId, amount, fecha, authorizationCode)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, customerId, amount, fecha, authorizationCode]
  );
  return res.lastID;
}

// ───────────────────────────────────────────────────────────────────────────────
// Cambio de contraseña (simple)
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
