// // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //  ------------------------ 07-03-27 ----- CORRECCIÓN: Agregamos permisos de usuarios con roles ----- //

// import "server-only";

// import sqlite3 from "sqlite3";
// import { open } from "sqlite";
// import path from "node:path";
// import bcrypt from "bcryptjs";
// import jwt, { JwtPayload } from "jsonwebtoken";

// type UserRole = "customer" | "manager" | "admin";

// type TokenPayload = JwtPayload & {
//   username: string;
//   role: UserRole;
// };

// const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto";
// const DB_FILE = process.env.SQLITE_DB_PATH || "./northwind.db";

// async function getDb() {
//   const dbPath = path.isAbsolute(DB_FILE)
//     ? DB_FILE
//     : path.join(process.cwd(), DB_FILE);

//   const db = await open({
//     filename: dbPath,
//     driver: sqlite3.Database,
//   });

//   return db;
// }

// export async function verifyToken(token: string) {
//   try {
//     const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
//     return payload;
//   } catch (error) {
//     console.error("Error verifying token:", error);
//     return null;
//   }
// }

// // --------------------------------------------------------
// // USERS / AUTH
// // --------------------------------------------------------

// export async function insertUser(
//   username: string,
//   password: string,
//   acceptPolicy: boolean,
//   acceptMarketing: boolean
// ) {
//   const db = await getDb();
//   const hashedPassword = await bcrypt.hash(password, 10);

//   await db.run(
//     `INSERT INTO users (username, password, acceptPolicy, acceptMarketing, role)
//      VALUES (?, ?, ?, ?, ?)`,
//     [username, hashedPassword, acceptPolicy, acceptMarketing, "customer"]
//   );

//   return { ok: true };
// }

// export async function verifyUser(username: string, password: string) {
//   const db = await getDb();

//   const user = await db.get<{
//     username: string;
//     password: string;
//     role: UserRole;
//   }>(
//     `SELECT username, password, role
//      FROM users
//      WHERE username = ?`,
//     [username]
//   );

//   if (!user) return null;

//   const ok = await bcrypt.compare(password, user.password);
//   if (!ok) return null;

//   const token = jwt.sign(
//     {
//       username: user.username,
//       role: user.role,
//     },
//     JWT_SECRET,
//     {
//       expiresIn: "31d",
//     }
//   );

//   return {
//     username: user.username,
//     role: user.role,
//     token,
//   };
// }

// export async function getUserByUsername(username: string) {
//   const db = await getDb();

//   const user = await db.get<{
//     id: number;
//     username: string;
//     role: UserRole;
//     acceptPolicy: number;
//     acceptMarketing: number;
//     created_at: string;
//   }>(
//     `SELECT id, username, role, acceptPolicy, acceptMarketing, created_at
//      FROM users
//      WHERE username = ?`,
//     [username]
//   );

//   return user;
// }

// export async function getUsers() {
//   const db = await getDb();

//   const users = await db.all<{
//     id: number;
//     username: string;
//     role: UserRole;
//     created_at: string;
//   }[]>(
//     `SELECT id, username, role, created_at
//      FROM users
//      ORDER BY username`
//   );

//   return users;
// }

// export async function setUserRole(username: string, role: UserRole) {
//   const db = await getDb();

//   await db.run(
//     `UPDATE users
//      SET role = ?
//      WHERE username = ?`,
//     [role, username]
//   );

//   return { ok: true };
// }

// export async function isAdmin(username: string) {
//   const db = await getDb();

//   const user = await db.get<{ role: UserRole }>(
//     `SELECT role
//      FROM users
//      WHERE username = ?`,
//     [username]
//   );

//   return user?.role === "admin";
// }

// export async function isManager(username: string) {
//   const db = await getDb();

//   const user = await db.get<{ role: UserRole }>(
//     `SELECT role
//      FROM users
//      WHERE username = ?`,
//     [username]
//   );

//   return user?.role === "manager" || user?.role === "admin";
// }

// export async function setPassword(username: string, newPassword: string) {
//   const db = await getDb();
//   const hashedPassword = await bcrypt.hash(newPassword, 10);

//   await db.run(`UPDATE users SET password = ? WHERE username = ?`, [
//     hashedPassword,
//     username,
//   ]);

//   return { ok: true };
// }

// export async function associateCestaIdWithUsername(
//   cestaId: string,
//   username: string
// ) {
//   const db = await getDb();

//   await db.run(`UPDATE cesta SET username = ? WHERE cestaId = ?`, [
//     username,
//     cestaId,
//   ]);

//   return { ok: true };
// }

// // --------------------------------------------------------
// // PRODUCTS
// // --------------------------------------------------------

// export async function getProducts() {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         ProductID, 
//         ProductName, 
//         UnitPrice, 
//         UnitsInStock,
//         CategoryID
//      FROM Products
//      ORDER BY ProductID`
//   );

//   return rows;
// }

// export async function getProduct(productId: number) {
//   const db = await getDb();

//   const row = await db.get(
//     `SELECT 
//         ProductID, 
//         ProductName, 
//         UnitPrice, 
//         UnitsInStock,
//         CategoryID
//      FROM Products 
//      WHERE ProductID = ?`,
//     [productId]
//   );

//   return row;
// }

// export async function getCategories() {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         CategoryID,
//         CategoryName
//      FROM Categories
//      ORDER BY CategoryName`
//   );

//   return rows;
// }

// export async function getProductsByCategory(categoryId: number) {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         ProductID, 
//         ProductName, 
//         UnitPrice, 
//         UnitsInStock,
//         CategoryID
//      FROM Products
//      WHERE CategoryID = ?
//      ORDER BY ProductID`,
//     [categoryId]
//   );

//   return rows;
// }

// export async function getProductsPaginated(limit: number, offset: number) {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         ProductID, 
//         ProductName, 
//         UnitPrice, 
//         UnitsInStock,
//         CategoryID
//      FROM Products
//      ORDER BY ProductID
//      LIMIT ? OFFSET ?`,
//     [limit, offset]
//   );

//   return rows;
// }

// export async function countProducts() {
//   const db = await getDb();

//   const row = await db.get<{ total: number }>(
//     `SELECT COUNT(*) as total FROM Products`
//   );

//   return row?.total || 0;
// }

// export async function getProductsByCategoryPaginated(
//   categoryId: number,
//   limit: number,
//   offset: number
// ) {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         ProductID, 
//         ProductName, 
//         UnitPrice, 
//         UnitsInStock,
//         CategoryID
//      FROM Products
//      WHERE CategoryID = ?
//      ORDER BY ProductID
//      LIMIT ? OFFSET ?`,
//     [categoryId, limit, offset]
//   );

//   return rows;
// }

// export async function countProductsByCategory(categoryId: number) {
//   const db = await getDb();

//   const row = await db.get<{ total: number }>(
//     `SELECT COUNT(*) as total
//      FROM Products
//      WHERE CategoryID = ?`,
//     [categoryId]
//   );

//   return row?.total || 0;
// }

// // --------------------------------------------------------
// // CESTA
// // --------------------------------------------------------

// export async function getCesta(cestaId: string) {
//   const db = await getDb();

//   const items = await db.all(
//     `SELECT 
//         c.id, 
//         c.productId, 
//         c.cestaId, 
//         c.username, 
//         c.cantidad,
//         p.ProductName, 
//         p.UnitPrice
//      FROM cesta c
//      JOIN Products p ON c.productId = p.ProductID
//      WHERE c.cestaId = ?
//      ORDER BY c.id`,
//     [cestaId]
//   );

//   return items;
// }

// export async function addToCesta(
//   cestaId: string,
//   username: string,
//   productId: number,
//   cantidad: number
// ) {
//   const db = await getDb();

//   const existing = await db.get<{ id: number; cantidad: number }>(
//     `SELECT id, cantidad FROM cesta WHERE cestaId = ? AND productId = ?`,
//     [cestaId, productId]
//   );

//   if (existing) {
//     const newQty = existing.cantidad + cantidad;
//     await db.run(`UPDATE cesta SET cantidad = ? WHERE id = ?`, [
//       newQty,
//       existing.id,
//     ]);
//     return { ok: true, action: "updated", cantidad: newQty };
//   }

//   await db.run(
//     `INSERT INTO cesta (productId, cestaId, username, cantidad) VALUES (?, ?, ?, ?)`,
//     [productId, cestaId, username, cantidad]
//   );

//   return { ok: true, action: "inserted" };
// }

// export async function setCantidadCesta(
//   cestaId: string,
//   productId: number,
//   cantidad: number
// ) {
//   const db = await getDb();

//   if (cantidad <= 0) {
//     await db.run(`DELETE FROM cesta WHERE cestaId = ? AND productId = ?`, [
//       cestaId,
//       productId,
//     ]);
//     return { ok: true, action: "deleted" };
//   }

//   const existing = await db.get<{ id: number }>(
//     `SELECT id FROM cesta WHERE cestaId = ? AND productId = ?`,
//     [cestaId, productId]
//   );

//   if (!existing) {
//     await db.run(
//       `INSERT INTO cesta (productId, cestaId, username, cantidad) VALUES (?, ?, ?, ?)`,
//       [productId, cestaId, "", cantidad]
//     );
//     return { ok: true, action: "inserted", cantidad };
//   }

//   await db.run(
//     `UPDATE cesta SET cantidad = ? WHERE cestaId = ? AND productId = ?`,
//     [cantidad, cestaId, productId]
//   );

//   return { ok: true, action: "updated", cantidad };
// }

// export async function deleteItemCesta(cestaId: string, productId: number) {
//   const db = await getDb();

//   await db.run(`DELETE FROM cesta WHERE cestaId = ? AND productId = ?`, [
//     cestaId,
//     productId,
//   ]);

//   return { ok: true };
// }

// // --------------------------------------------------------
// // ORDERS
// // --------------------------------------------------------

// export async function createOrder(customerId: string, totalAmount: number) {
//   const db = await getDb();

//   const cartItems = await db.all(
//     `SELECT c.productId, SUM(c.cantidad) as cantidad, MAX(p.UnitPrice) as UnitPrice
//      FROM cesta c
//      JOIN Products p ON c.productId = p.ProductID
//      WHERE c.username = ?
//      GROUP BY c.productId`,
//     [customerId]
//   );

//   if (!cartItems || cartItems.length === 0) {
//     throw new Error("La cesta está vacía");
//   }

//   await db.run("BEGIN TRANSACTION");

//   try {
//     const result = await db.run(
//       `INSERT INTO Orders (CustomerID, OrderDate) VALUES (?, date('now'))`,
//       [customerId]
//     );

//     const newOrderId = result.lastID;
//     console.log(`✅ Pedido ${newOrderId} iniciado. Insertando detalles...`);

//     for (const item of cartItems) {
//       const price = item.UnitPrice || 0;
//       const qty = item.cantidad || 1;

//       await db.run(
//         `INSERT INTO "Order Details" (OrderID, ProductID, UnitPrice, Quantity, Discount) 
//          VALUES (?, ?, ?, ?, ?)`,
//         [newOrderId, item.productId, price, qty, 0]
//       );
//     }

//     await db.run(`DELETE FROM cesta WHERE username = ?`, [customerId]);

//     await db.run("COMMIT");
//     console.log(`✅ Pedido ${newOrderId} creado con éxito.`);

//     return { orderId: newOrderId, totalAmount };
//   } catch (error) {
//     await db.run("ROLLBACK");
//     console.error("❌ ERROR CRÍTICO EN CREATE ORDER:", error);
//     throw error;
//   }
// }

// export async function getCustomerOrders(customerId: string) {
//   const db = await getDb();

//   const rows = await db.all(
//     `SELECT 
//         o.OrderID, 
//         o.OrderDate, 
//         o.RequiredDate, 
//         o.ShippedDate,
//         o.Paid,
//         SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) as TotalAmount
//      FROM Orders o
//      LEFT JOIN "Order Details" od ON o.OrderID = od.OrderID
//      WHERE o.CustomerID = ?
//      GROUP BY o.OrderID
//      ORDER BY o.OrderID DESC`,
//     [customerId]
//   );

//   return rows;
// }

// export async function getOrder(orderId: number) {
//   const db = await getDb();

//   const order = await db.get(
//     `SELECT OrderID, CustomerID, OrderDate, RequiredDate, ShippedDate
//      FROM Orders
//      WHERE OrderID = ?`,
//     [orderId]
//   );

//   const details = await db.all(
//     `SELECT od.ProductID, p.ProductName, od.UnitPrice, od.Quantity, od.Discount
//      FROM "Order Details" od
//      JOIN Products p ON p.ProductID = od.ProductID
//      WHERE od.OrderID = ?`,
//     [orderId]
//   );

//   return { order, details };
// }

// // --------------------------------------------------------
// // CUSTOMER
// // --------------------------------------------------------

// export async function getCustomer(customerId: string) {
//   const db = await getDb();

//   const customer = await db.get(
//     `SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone
//      FROM Customers
//      WHERE CustomerID = ?`,
//     [customerId]
//   );

//   return customer;
// }

// export async function saveCustomer(customerId: string, data: any) {
//   const db = await getDb();

//   await db.run(
//     `UPDATE Customers
//      SET CompanyName = ?, ContactName = ?, ContactTitle = ?, Address = ?, City = ?, Region = ?, PostalCode = ?, Country = ?, Phone = ?
//      WHERE CustomerID = ?`,
//     [
//       data.CompanyName,
//       data.ContactName,
//       data.ContactTitle,
//       data.Address,
//       data.City,
//       data.Region,
//       data.PostalCode,
//       data.Country,
//       data.Phone,
//       customerId,
//     ]
//   );

//   return { ok: true };
// }

// export async function markOrderAsPaid(orderId: number) {
//   const db = await getDb();

//   const items = await db.all(
//     `SELECT ProductID, Quantity FROM "Order Details" WHERE OrderID = ?`,
//     [orderId]
//   );

//   for (const item of items) {
//     await db.run(
//       `UPDATE Products 
//        SET UnitsInStock = UnitsInStock - ? 
//        WHERE ProductID = ?`,
//       [item.Quantity, item.ProductID]
//     );
//   }

//   await db.run(`UPDATE Orders SET Paid = 1 WHERE OrderID = ?`, [orderId]);

//   return { ok: true };
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////  ------------------------ 15-03-26 ----- CORRECCIÓN: Agregamos permisos de usuarios con roles ----- //

import "server-only";

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

type UserRole = "customer" | "manager" | "admin";

type TokenPayload = JwtPayload & {
  username: string;
  role: UserRole;
};

type ActivityLog = {
  id: number;
  username: string;
  action: string;
  details: string | null;
  createdAt: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "mi_secreto";
const DB_FILE = process.env.SQLITE_DB_PATH || "./northwind.db";

async function getDb() {
  const dbPath = path.isAbsolute(DB_FILE)
    ? DB_FILE
    : path.join(process.cwd(), DB_FILE);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return db;
}

/* -------------------------------------------------------- */
/* LOGS */
/* -------------------------------------------------------- */

async function ensureLogsTable() {
  const db = await getDb();

  await db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export async function addActivityLog(
  username: string,
  action: string,
  details?: string
) {
  const db = await getDb();
  await ensureLogsTable();

  await db.run(
    `INSERT INTO activity_logs (username, action, details, createdAt)
     VALUES (?, ?, ?, datetime('now'))`,
    [username, action, details ?? null]
  );

  return { ok: true };
}

export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  await ensureLogsTable();

  const rows = await db.all<ActivityLog[]>(
    `SELECT id, username, action, details, createdAt
     FROM activity_logs
     ORDER BY id DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
}

/* -------------------------------------------------------- */
/* TOKEN */
/* -------------------------------------------------------- */

export async function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

/* -------------------------------------------------------- */
/* USERS / AUTH */
/* -------------------------------------------------------- */

export async function insertUser(
  username: string,
  password: string,
  acceptPolicy: boolean,
  acceptMarketing: boolean
) {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.run(
    `INSERT INTO users (username, password, acceptPolicy, acceptMarketing, role)
     VALUES (?, ?, ?, ?, ?)`,
    [username, hashedPassword, acceptPolicy, acceptMarketing, "customer"]
  );

  return { ok: true };
}

export async function verifyUser(username: string, password: string) {
  const db = await getDb();
  await ensureLogsTable();

  const user = await db.get<{
    username: string;
    password: string;
    role: UserRole;
  }>(
    `SELECT username, password, role
     FROM users
     WHERE username = ?`,
    [username]
  );

  if (!user) {
    await db.run(
      `INSERT INTO activity_logs (username, action, details, createdAt)
       VALUES (?, ?, ?, datetime('now'))`,
      [username, "LOGIN_FAILED", "Usuario no encontrado"]
    );
    return null;
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    await db.run(
      `INSERT INTO activity_logs (username, action, details, createdAt)
       VALUES (?, ?, ?, datetime('now'))`,
      [username, "LOGIN_FAILED", "Contraseña incorrecta"]
    );
    return null;
  }

  const token = jwt.sign(
    {
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "31d",
    }
  );

  await db.run(
    `INSERT INTO activity_logs (username, action, details, createdAt)
     VALUES (?, ?, ?, datetime('now'))`,
    [user.username, "LOGIN_SUCCESS", `Rol: ${user.role}`]
  );

  return {
    username: user.username,
    role: user.role,
    token,
  };
}

export async function getUserByUsername(username: string) {
  const db = await getDb();

  const user = await db.get<{
    id: number;
    username: string;
    role: UserRole;
    acceptPolicy: number;
    acceptMarketing: number;
    created_at: string;
  }>(
    `SELECT id, username, role, acceptPolicy, acceptMarketing, created_at
     FROM users
     WHERE username = ?`,
    [username]
  );

  return user;
}

export async function getUsers() {
  const db = await getDb();

  const users = await db.all<
    {
      id: number;
      username: string;
      role: UserRole;
      created_at: string;
    }[]
  >(
    `SELECT id, username, role, created_at
     FROM users
     ORDER BY username`
  );

  return users;
}

export async function setUserRole(username: string, role: UserRole) {
  const db = await getDb();

  await db.run(
    `UPDATE users
     SET role = ?
     WHERE username = ?`,
    [role, username]
  );

  await addActivityLog(username, "ROLE_CHANGED", `Nuevo rol: ${role}`);

  return { ok: true };
}

export async function isAdmin(username: string) {
  const db = await getDb();

  const user = await db.get<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE username = ?`,
    [username]
  );

  return user?.role === "admin";
}

export async function isManager(username: string) {
  const db = await getDb();

  const user = await db.get<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE username = ?`,
    [username]
  );

  return user?.role === "manager" || user?.role === "admin";
}

export async function setPassword(username: string, newPassword: string) {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.run(`UPDATE users SET password = ? WHERE username = ?`, [
    hashedPassword,
    username,
  ]);

  await addActivityLog(username, "PASSWORD_CHANGED", "Cambio de contraseña");

  return { ok: true };
}

export async function associateCestaIdWithUsername(
  cestaId: string,
  username: string
) {
  const db = await getDb();

  await db.run(`UPDATE cesta SET username = ? WHERE cestaId = ?`, [
    username,
    cestaId,
  ]);

  await addActivityLog(
    username,
    "ASSOCIATE_CART",
    `cestaId asociada: ${cestaId}`
  );

  return { ok: true };
}

/* -------------------------------------------------------- */
/* PRODUCTS */
/* -------------------------------------------------------- */

export async function getProducts() {
  const db = await getDb();

  const rows = await db.all(
    `SELECT 
        ProductID, 
        ProductName, 
        UnitPrice, 
        UnitsInStock,
        CategoryID
     FROM Products
     ORDER BY ProductID`
  );

  return rows;
}

export async function getProduct(productId: number) {
  const db = await getDb();

  const row = await db.get(
    `SELECT 
        ProductID, 
        ProductName, 
        UnitPrice, 
        UnitsInStock,
        CategoryID
     FROM Products 
     WHERE ProductID = ?`,
    [productId]
  );

  return row;
}

export async function getCategories() {
  const db = await getDb();

  const rows = await db.all(
    `SELECT 
        CategoryID,
        CategoryName
     FROM Categories
     ORDER BY CategoryName`
  );

  return rows;
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();

  const rows = await db.all(
    `SELECT 
        ProductID, 
        ProductName, 
        UnitPrice, 
        UnitsInStock,
        CategoryID
     FROM Products
     WHERE CategoryID = ?
     ORDER BY ProductID`,
    [categoryId]
  );

  return rows;
}

export async function getProductsPaginated(limit: number, offset: number) {
  const db = await getDb();

  const rows = await db.all(
    `SELECT 
        ProductID, 
        ProductName, 
        UnitPrice, 
        UnitsInStock,
        CategoryID
     FROM Products
     ORDER BY ProductID
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows;
}

export async function countProducts() {
  const db = await getDb();

  const row = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total FROM Products`
  );

  return row?.total || 0;
}

export async function getProductsByCategoryPaginated(
  categoryId: number,
  limit: number,
  offset: number
) {
  const db = await getDb();

  const rows = await db.all(
    `SELECT 
        ProductID, 
        ProductName, 
        UnitPrice, 
        UnitsInStock,
        CategoryID
     FROM Products
     WHERE CategoryID = ?
     ORDER BY ProductID
     LIMIT ? OFFSET ?`,
    [categoryId, limit, offset]
  );

  return rows;
}

export async function countProductsByCategory(categoryId: number) {
  const db = await getDb();

  const row = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM Products
     WHERE CategoryID = ?`,
    [categoryId]
  );

  return row?.total || 0;
}

/* -------------------------------------------------------- */
/* CESTA */
/* -------------------------------------------------------- */

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

export async function addToCesta(
  cestaId: string,
  username: string,
  productId: number,
  cantidad: number
) {
  const db = await getDb();

  const existing = await db.get<{ id: number; cantidad: number }>(
    `SELECT id, cantidad FROM cesta WHERE cestaId = ? AND productId = ?`,
    [cestaId, productId]
  );

  if (existing) {
    const newQty = existing.cantidad + cantidad;
    await db.run(`UPDATE cesta SET cantidad = ? WHERE id = ?`, [
      newQty,
      existing.id,
    ]);

    await addActivityLog(
      username,
      "CART_UPDATED",
      `Producto ${productId}, nueva cantidad ${newQty}`
    );

    return { ok: true, action: "updated", cantidad: newQty };
  }

  await db.run(
    `INSERT INTO cesta (productId, cestaId, username, cantidad) VALUES (?, ?, ?, ?)`,
    [productId, cestaId, username, cantidad]
  );

  await addActivityLog(
    username,
    "CART_ADD",
    `Producto ${productId}, cantidad ${cantidad}`
  );

  return { ok: true, action: "inserted" };
}

export async function setCantidadCesta(
  cestaId: string,
  productId: number,
  cantidad: number
) {
  const db = await getDb();

  if (cantidad <= 0) {
    await db.run(`DELETE FROM cesta WHERE cestaId = ? AND productId = ?`, [
      cestaId,
      productId,
    ]);
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

  await db.run(`DELETE FROM cesta WHERE cestaId = ? AND productId = ?`, [
    cestaId,
    productId,
  ]);

  return { ok: true };
}

/* -------------------------------------------------------- */
/* ORDERS */
/* -------------------------------------------------------- */

export async function createOrder(customerId: string, totalAmount: number) {
  const db = await getDb();

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

  await db.run("BEGIN TRANSACTION");

  try {
    const result = await db.run(
      `INSERT INTO Orders (CustomerID, OrderDate) VALUES (?, date('now'))`,
      [customerId]
    );

    const newOrderId = result.lastID;
    console.log(`✅ Pedido ${newOrderId} iniciado. Insertando detalles...`);

    for (const item of cartItems) {
      const price = item.UnitPrice || 0;
      const qty = item.cantidad || 1;

      await db.run(
        `INSERT INTO "Order Details" (OrderID, ProductID, UnitPrice, Quantity, Discount) 
         VALUES (?, ?, ?, ?, ?)`,
        [newOrderId, item.productId, price, qty, 0]
      );
    }

    await db.run(`DELETE FROM cesta WHERE username = ?`, [customerId]);

    await db.run("COMMIT");
    console.log(`✅ Pedido ${newOrderId} creado con éxito.`);

    await addActivityLog(
      customerId,
      "ORDER_CREATED",
      `Pedido ${newOrderId}, total ${totalAmount}`
    );

    return { orderId: newOrderId, totalAmount };
  } catch (error) {
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
        o.Paid,
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

/* -------------------------------------------------------- */
/* CUSTOMER */
/* -------------------------------------------------------- */

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

  await addActivityLog(
    customerId,
    "CUSTOMER_UPDATED",
    "Perfil de cliente actualizado"
  );

  return { ok: true };
}

export async function markOrderAsPaid(orderId: number) {
  const db = await getDb();

  const items = await db.all(
    `SELECT ProductID, Quantity FROM "Order Details" WHERE OrderID = ?`,
    [orderId]
  );

  for (const item of items) {
    await db.run(
      `UPDATE Products 
       SET UnitsInStock = UnitsInStock - ? 
       WHERE ProductID = ?`,
      [item.Quantity, item.ProductID]
    );
  }

  await db.run(`UPDATE Orders SET Paid = 1 WHERE OrderID = ?`, [orderId]);

  await addActivityLog(
    "system",
    "ORDER_PAID",
    `Pedido ${orderId} marcado como pagado`
  );

  return { ok: true };
}