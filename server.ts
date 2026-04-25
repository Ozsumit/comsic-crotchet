import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Setup Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Database Setup
const db = new Database("crochet-shop.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    imageUrl TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trackingId TEXT UNIQUE,
    customerName TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    paymentMethod TEXT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders (id),
    FOREIGN KEY (productId) REFERENCES products (id)
  );
`);

// Multer for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  // --- API Routes ---

  // Get all products

  // Get a single product

  // --- API Routes ---

  // 1. NEW: Get all unique categories for the Shop dropdown
  app.get("/api/categories", (req, res) => {
    try {
      const rows = db
        .prepare(
          "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''",
        )
        .all();
      const categories = rows.map((row) => row.category);
      res.json(categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // 2. UPDATED: Get all products (Now supports Search, Category Filters, and Price Sort)
  app.get("/api/products", (req, res) => {
    const { category, search, sort, limit } = req.query;

    // Use WHERE 1=1 so we can easily append AND clauses
    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];

    // Filter by Category
    if (category && category !== "all") {
      query += " AND category = ?";
      params.push(category);
    }

    // Filter by Search Text (matches title or description)
    if (search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort by Price or Newest
    if (sort === "price-asc") {
      query += " ORDER BY price ASC";
    } else if (sort === "price-desc") {
      query += " ORDER BY price DESC";
    } else {
      query += " ORDER BY id DESC"; // Default: Newest first
    }

    // Limit results if needed
    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit, 10));
    }

    try {
      const products = db.prepare(query).all(...params);
      res.json(products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app.get("/api/products/:id", (req, res) => {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  });
  // Delete a Product
  app.delete("/api/products/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM order_items WHERE productId = ?").run(
        req.params.id,
      );
      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Delete an Order
  app.delete("/api/orders/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM order_items WHERE orderId = ?").run(
        req.params.id,
      );
      db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Create an order
  app.post("/api/orders", (req, res) => {
    const { customerName, phone, email, address, items, total, paymentMethod } =
      req.body;

    const trackingId =
      "TRK" +
      Date.now() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const insertTransaction = db.transaction((orderData, orderItems) => {
      // FIX IS HERE: Added 7 placeholders (?, ?, ?, ?, ?, ?, ?) to match the 7 inserted columns
      const stmt = db.prepare(
        "INSERT INTO orders (trackingId, customerName, phone, email, address, paymentMethod, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
      );
      const info = stmt.run(
        orderData.trackingId,
        orderData.customerName,
        orderData.phone,
        orderData.email,
        orderData.address,
        orderData.paymentMethod,
        orderData.total,
      );
      const orderId = info.lastInsertRowid;

      const itemStmt = db.prepare(
        "INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)",
      );
      for (const item of orderItems) {
        itemStmt.run(orderId, item.productId, item.quantity, item.price);
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
          item.quantity,
          item.productId,
        );
      }
      return orderId;
    });

    try {
      const orderId = insertTransaction(
        {
          trackingId,
          customerName,
          phone,
          email,
          address,
          paymentMethod,
          total,
        },
        items,
      );

      // --- SEND ACTUAL EMAIL ---
      const mailOptions = {
        from: `"Cute Crochets Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Yay! Your Order is Confirmed ✨",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ff6b81;">Order Confirmed! 🎉</h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for your purchase! Your cute crochets are getting ready to ship.</p>
            
            <div style="background-color: #fff0f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #666;">Tracking ID</p>
              <h3 style="margin: 5px 0 0 0; color: #ff6b81; font-family: monospace;">${trackingId}</h3>
              <h3 style="margin: 5px 0 0 0; color: #c3f0c2; font-family: monospace;"><a href="https://crotchet.sumit.info.np/track?id=${trackingId}" target="_blank" rel="noopener noreferrer">Track Your Order</a></h3>
            </div>
            
            <p><strong>Total Paid:</strong> $${total.toFixed(2)}</p>
            <p><strong>Shipping Address:</strong><br/> ${address}</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
              Save this email to track your order. If you have any questions, just reply to this email!
            </p>
          </div>
        `,
      };

      transporter
        .sendMail(mailOptions)
        .then(() =>
          console.log(`Confirmation email sent successfully to ${email}`),
        )
        .catch((err) => console.error("Failed to send email:", err));

      res.json({ success: true, orderId, trackingId });
    } catch (err) {
      console.error("Order Transaction Error:", err);
      res.status(500).json({ error: "Order failed" });
    }
  });

  // Get orders
  app.get("/api/orders", (req, res) => {
    const orders = db
      .prepare("SELECT * FROM orders ORDER BY createdAt DESC")
      .all();
    const items = db
      .prepare(
        "SELECT oi.*, p.title, p.imageUrl FROM order_items oi JOIN products p ON oi.productId = p.id",
      )
      .all();

    const formattedOrders = orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    }));

    res.json(formattedOrders);
  });

  // Track single order
  app.get("/api/orders/track/:trackingId", (req, res) => {
    const order = db
      .prepare("SELECT * FROM orders WHERE trackingId = ?")
      .get(req.params.trackingId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const items = db
      .prepare(
        "SELECT oi.*, p.title, p.imageUrl FROM order_items oi JOIN products p ON oi.productId = p.id WHERE orderId = ?",
      )
      .all(order.id);
    res.json({ ...order, items });
  });

  // Update order status (Admin)
  app.patch("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(
      status,
      req.params.id,
    );
    res.json({ success: true });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);

    const count = db.prepare("SELECT COUNT(*) as count FROM products").get();
    if (count.count === 0) {
      db.prepare(
        `INSERT INTO products (title, description, price, imageUrl, category, stock) VALUES 
        ('Pastel Bunny Plush', 'A soft and cuddly handmade bunny.', 25.00, 'https://picsum.photos/seed/bunny/400', 'plushies', 5),
        ('Mint Froggy Coaster', 'Keep your desk clean and cute.', 12.00, 'https://picsum.photos/seed/frog/400', 'accessories', 10),
        ('Chunky Knit Sweater', 'Warm pastel gradient sweater.', 65.00, 'https://picsum.photos/seed/sweater/400', 'apparel', 2),
        ('Strawberry Cow Amigurumi', 'Moo-velous little friend.', 30.00, 'https://picsum.photos/seed/cow/400', 'plushies', 4)
      `,
      ).run();
      console.log("Seeded database with initial products.");
    }
  });
}

startServer();
