import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer"; // <-- 1. Import Nodemailer

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- 2. Setup Nodemailer Transporter ---
// (Replace with your actual email and an App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pokhrelsumit36@gmail.com", // Replace with your email
    pass: "lfut ieuk lnwx xjku",
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
  app.get("/api/products", (req, res) => {
    const { category, limit } = req.query;
    let query = "SELECT * FROM products";
    const params = [];

    if (category && category !== "all") {
      query += " WHERE category = ?";
      params.push(category);
    }

    query += " ORDER BY id DESC"; // newest first

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit, 10));
    }

    const products = db.prepare(query).all(...params);
    res.json(products);
  });

  // Get a single product
  app.get("/api/products/:id", (req, res) => {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  });

  // Create a product (admin)
  app.post("/api/products", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Image is required" });

    const { title, description, price, category, stock } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO products (title, description, price, imageUrl, category, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title,
      description,
      parseFloat(price),
      imageUrl,
      category,
      parseInt(stock || "1", 10),
    );

    res.json({ id: info.lastInsertRowid, ...req.body, imageUrl });
  });

  // Create an order
  app.post("/api/orders", (req, res) => {
    const { customerName, email, address, items, total, paymentMethod } =
      req.body;
    const trackingId =
      "TRK" +
      Date.now() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const insertTransaction = db.transaction((orderData, orderItems) => {
      const stmt = db.prepare(
        "INSERT INTO orders (trackingId, customerName, email, address, paymentMethod, total) VALUES (?, ?, ?, ?, ?, ?)",
      );
      const info = stmt.run(
        orderData.trackingId,
        orderData.customerName,
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
        { trackingId, customerName, email, address, paymentMethod, total },
        items,
      );

      // --- 3. SEND ACTUAL EMAIL ---
      // We do this asynchronously so it doesn't slow down the response to the user
      const mailOptions = {
        from: '"Cute Crochets Shop" <your-email@gmail.com>', // Sender address
        to: email, // Receiver address (customer)
        subject: "Yay! Your Order is Confirmed ✨", // Subject line
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ff6b81;">Order Confirmed! 🎉</h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for your purchase! Your cute crochets are getting ready to ship.</p>
            
            <div style="background-color: #fff0f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #666;">Tracking ID</p>
              <h3 style="margin: 5px 0 0 0; color: #ff6b81; font-family: monospace;">${trackingId}</h3>
              <h3 style="margin: 5px 0 0 0; color: #c3f0c2; font-family: monospace;"><a href="https://crotchet.sumit.info.np/track/${trackingId}" target="_blank" rel="noopener noreferrer">${trackingId}</a></h3>

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
      // ----------------------------

      res.json({ success: true, orderId, trackingId });
    } catch (err) {
      console.error(err);
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
