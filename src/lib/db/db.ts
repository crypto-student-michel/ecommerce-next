
import "server-only";

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

type TokenPayload = JwtPayload & {
  username: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto";
const DB_FILE = process.env.SQLITE_DB_PATH || "./northwind.db";

async function getDb() {
  const dbPath = path.isAbsolute(DB_FILE) ? DB_FILE : path.join(process.cwd(), DB_FILE);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return db;
}

export async function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// --------------------------------------------------------
// USERS / AUTH
// --------------------------------------------------------

export async function insertUser(
  username: string, 
  password: string, 
  acceptPolicy: boolean, 
  acceptMarketing: boolean
) {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.run(
    `INSERT INTO users (username, password, acceptPolicy, acceptMarketing) VALUES (?, ?, ?, ?)`,
    [username, hashedPassword, acceptPolicy, acceptMarketing]
  );

  return { ok: true };
}

export async function verifyUser(username: string, password: string) {
  const db = await getDb();
  const user = await db.get<{ username: string; password: string }>(
    `SELECT username, password FROM users WHERE username = ?`,
    [username]
  );

  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "31d" });
  return { username: user.username, token };
}

export async function setPassword(username: string, newPassword: string) {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.run(
    `UPDATE users SET password = ? WHERE username = ?`,
    [hashedPassword, username]
  );

  return { ok: true };
}

export async function associateCestaIdWithUsername(cestaId: string, username: string) {
  const db = await getDb();

  await db.run(
    `UPDATE cesta SET username = ? WHERE cestaId = ?`,
    [username, cestaId]
  );

  return { ok: true };
}

// --------------------------------------------------------
// PRODUCTS
// --------------------------------------------------------

export async function getProducts() {
  const db = await getDb();
  const rows = await db.all(
    `SELECT ProductID, ProductName, UnitPrice, UnitsInStock FROM Products ORDER BY ProductID`
  );
  return rows;
}

export async function getProduct(productId: number) {
  const db = await getDb();
  const row = await db.get(
    `SELECT ProductID, ProductName, UnitPrice, UnitsInStock FROM Products WHERE ProductID = ?`,
    [productId]
  );
  return row;
}

// --------------------------------------------------------
// CESTA
// --------------------------------------------------------

export async function getCesta(cestaId: string) {
  const db = await getDb();
  
  const items = await db.all(
    `SELECT 
        c.id, 
        c.productId, 
        c.cestaId, 
        c.username, 
        c.cantidad,
        p.ProductName, 
        p.UnitPrice
     FROM cesta c
     JOIN Products p ON c.productId = p.ProductID
     WHERE c.cestaId = ?
     ORDER BY c.id`,
    [cestaId]
  );
  
  return items;
}

export async function addToCesta(cestaId: string, username: string, productId: number, cantidad: number) {
  const db = await getDb();

  const existing = await db.get<{ id: number; cantidad: number }>(
    `SELECT id, cantidad FROM cesta WHERE cestaId = ? AND productId = ?`,
    [cestaId, productId]
  );

  if (existing) {
    const newQty = existing.cantidad + cantidad;
    await db.run(
      `UPDATE cesta SET cantidad = ? WHERE id = ?`,
      [newQty, existing.id]
    );
    return { ok: true, action: "updated", cantidad: newQty };
  }

  await db.run(
    `INSERT INTO cesta (productId, cestaId, username, cantidad) VALUES (?, ?, ?, ?)`,
    [productId, cestaId, username, cantidad]
  );

  return { ok: true, action: "inserted" };
}

export async function setCantidadCesta(cestaId: string, productId: number, cantidad: number) {
  const db = await getDb();

  if (cantidad <= 0) {
    await db.run(
      `DELETE FROM cesta WHERE cestaId = ? AND productId = ?`,
      [cestaId, productId]
    );
    return { ok: true, action: "deleted" };
  }

  const existing = await db.get<{ id: number }>(
    `SELECT id FROM cesta WHERE cestaId = ? AND productId = ?`,
    [cestaId, productId]
  );

  if (!existing) {
    await db.run(
      `INSERT INTO cesta (productId, cestaId, username, cantidad) VALUES (?, ?, ?, ?)`,
      [productId, cestaId, "", cantidad]
    );
    return { ok: true, action: "inserted", cantidad };
  }

  await db.run(
    `UPDATE cesta SET cantidad = ? WHERE cestaId = ? AND productId = ?`,
    [cantidad, cestaId, productId]
  );

  return { ok: true, action: "updated", cantidad };
}

export async function deleteItemCesta(cestaId: string, productId: number) {
  const db = await getDb();
  await db.run(
    `DELETE FROM cesta WHERE cestaId = ? AND productId = ?`,
    [cestaId, productId]
  );
  return { ok: true };
}

// --------------------------------------------------------
// ORDERS (SOLUCIÓN DEFINITIVA)
// --------------------------------------------------------

export async function createOrder(customerId: string, totalAmount: number) {
  const db = await getDb();

  // 1. Obtenemos los productos AGRUPADOS por ID
  // ✅ CORRECCIÓN CLAVE: Usamos GROUP BY y SUM(c.cantidad)
  // Esto fusiona si tienes el mismo producto varias veces en la cesta,
  // evitando el error "UNIQUE constraint failed"
  const cartItems = await db.all(
    `SELECT c.productId, SUM(c.cantidad) as cantidad, MAX(p.UnitPrice) as UnitPrice
     FROM cesta c
     JOIN Products p ON c.productId = p.ProductID
     WHERE c.username = ?
     GROUP BY c.productId`,
    [customerId]
  );

  if (!cartItems || cartItems.length === 0) {
    throw new Error("La cesta está vacía");
  }

  // --- TRANSACCIÓN ---
  // Asegura que se guarda TODO (cabecera + detalles) o NADA.
  await db.run("BEGIN TRANSACTION");

  try {
    // 2. Crear cabecera del pedido
    const result = await db.run(
      `INSERT INTO Orders (CustomerID, OrderDate) VALUES (?, date('now'))`,
      [customerId]
    );
    
    const newOrderId = result.lastID;
    console.log(`✅ Pedido ${newOrderId} iniciado. Insertando detalles...`);

    // 3. Insertar detalles uno a uno
    for (const item of cartItems) {
      const price = item.UnitPrice || 0;
      const qty = item.cantidad || 1;

      // Usamos comillas en "Order Details" porque la tabla tiene un espacio
      await db.run(
        `INSERT INTO "Order Details" (OrderID, ProductID, UnitPrice, Quantity, Discount) 
         VALUES (?, ?, ?, ?, ?)`,
        [newOrderId, item.productId, price, qty, 0]
      );
    }

    // 4. Vaciar cesta del usuario
    await db.run(`DELETE FROM cesta WHERE username = ?`, [customerId]);

    // Confirmar cambios
    await db.run("COMMIT");
    console.log(`✅ Pedido ${newOrderId} creado con éxito.`);

    return { orderId: newOrderId, totalAmount };

  } catch (error) {
    // Si algo falla, deshacemos todo para no dejar pedidos corruptos ($0.00)
    await db.run("ROLLBACK");
    console.error("❌ ERROR CRÍTICO EN CREATE ORDER:", error);
    throw error;
  }
}

export async function getCustomerOrders(customerId: string) {
  const db = await getDb();
  
  const rows = await db.all(
    `SELECT 
        o.OrderID, 
        o.OrderDate, 
        o.RequiredDate, 
        o.ShippedDate,
        o.Paid,  -- ✅ AÑADIDO: Leemos el estado de pago
        SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) as TotalAmount
     FROM Orders o
     LEFT JOIN "Order Details" od ON o.OrderID = od.OrderID
     WHERE o.CustomerID = ?
     GROUP BY o.OrderID
     ORDER BY o.OrderID DESC`,
    [customerId]
  );
  
  return rows;
}

export async function getOrder(orderId: number) {
  const db = await getDb();
  const order = await db.get(
    `SELECT OrderID, CustomerID, OrderDate, RequiredDate, ShippedDate
     FROM Orders
     WHERE OrderID = ?`,
    [orderId]
  );

  const details = await db.all(
    `SELECT od.ProductID, p.ProductName, od.UnitPrice, od.Quantity, od.Discount
     FROM "Order Details" od
     JOIN Products p ON p.ProductID = od.ProductID
     WHERE od.OrderID = ?`,
    [orderId]
  );

  return { order, details };
}

// --------------------------------------------------------
// CUSTOMER
// --------------------------------------------------------

export async function getCustomer(customerId: string) {
  const db = await getDb();
  const customer = await db.get(
    `SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone
     FROM Customers
     WHERE CustomerID = ?`,
    [customerId]
  );
  return customer;
}

export async function saveCustomer(customerId: string, data: any) {
  const db = await getDb();

  await db.run(
    `UPDATE Customers
     SET CompanyName = ?, ContactName = ?, ContactTitle = ?, Address = ?, City = ?, Region = ?, PostalCode = ?, Country = ?, Phone = ?
     WHERE CustomerID = ?`,
    [
      data.CompanyName,
      data.ContactName,
      data.ContactTitle,
      data.Address,
      data.City,
      data.Region,
      data.PostalCode,
      data.Country,
      data.Phone,
      customerId,
    ]
  );

  return { ok: true };
}
// nueva función para marcar el pedido como pagado y actualizar la función que obtiene los pedidos para que lea ese dato.
// export async function markOrderAsPaid(orderId: number) {
//   const db = await getDb();
//   await db.run(
//     `UPDATE Orders SET Paid = 1 WHERE OrderID = ?`,
//     [orderId]
//   );
//   return { ok: true };
// }

export async function markOrderAsPaid(orderId: number) {
  const db = await getDb();

  // 1. Obtenemos los productos que había en ese pedido
  const items = await db.all(
    `SELECT ProductID, Quantity FROM "Order Details" WHERE OrderID = ?`,
    [orderId]
  );

  // 2. Recorremos cada producto y RESTAMOS la cantidad al stock
  for (const item of items) {
    await db.run(
      `UPDATE Products 
       SET UnitsInStock = UnitsInStock - ? 
       WHERE ProductID = ?`,
      [item.Quantity, item.ProductID]
    );
  }

  // 3. Finalmente marcamos el pedido como pagado
  await db.run(
    `UPDATE Orders SET Paid = 1 WHERE OrderID = ?`,
    [orderId]
  );

  return { ok: true };
}