import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PostgreSQL Pool Setup ---
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// --- Cloudinary Setup ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "crochet-shop",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
  },
});

const upload = multer({ storage });

// --- Setup Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Database Initialization ---
async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      "trackingId" TEXT UNIQUE,
      "customerName" TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      "paymentMethod" TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      "orderId" INTEGER NOT NULL REFERENCES orders(id),
      "productId" INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    );
  `);

  // Zero-Downtime Migration: Handled via safe JS to avoid PL/pgSQL syntax issues
  try {
    const colCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='imageUrl'
    `);

    if (colCheck.rows.length > 0) {
      console.log(
        "Database Migration: Converting 'imageUrl' string to 'imageUrls' array...",
      );

      // 1. Ensure the new column exists
      await pool.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}'`,
      );

      // 2. Transfer existing strings into an array gracefully
      await pool.query(
        `UPDATE products SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''`,
      );

      // 3. Drop the old column
      await pool.query(`ALTER TABLE products DROP COLUMN "imageUrl"`);
      console.log("Database Migration completed successfully.");
    }
  } catch (err) {
    console.error("Migration notice:", err.message);
  }

  console.log("Database tables verified/created.");
}

// --- Seed Database ---
async function seedDatabase() {
  const count = await pool.query("SELECT COUNT(*) as count FROM products");
  if (parseInt(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO products (title, description, price, "imageUrls", category, stock) VALUES
      ('Pastel Bunny Plush', 'A soft and cuddly handmade bunny.', 25.00, ARRAY['https://picsum.photos/seed/bunny/400'], 'plushies', 5),
      ('Mint Froggy Coaster', 'Keep your desk clean and cute.', 12.00, ARRAY['https://picsum.photos/seed/frog/400'], 'accessories', 10),
      ('Chunky Knit Sweater', 'Warm pastel gradient sweater.', 65.00, ARRAY['https://picsum.photos/seed/sweater/400'], 'apparel', 2),
      ('Strawberry Cow Amigurumi', 'Moo-velous little friend.', 30.00, ARRAY['https://picsum.photos/seed/cow/400'], 'plushies', 4)
    `);
    console.log("Seeded database with initial products.");
  }
}

// --- Main Server ---
async function startServer() {
  await setupDatabase();
  await seedDatabase();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // ─────────────────────────────────────────────
  // PRODUCT ROUTES
  // ─────────────────────────────────────────────

  // GET all unique categories
  app.get("/api/categories", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT DISTINCT category FROM products
         WHERE category IS NOT NULL AND category != ''
         ORDER BY category ASC`,
      );
      res.json(result.rows.map((r) => r.category));
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET all products (with backward compatible imageUrl alias)
  app.get("/api/products", async (req, res) => {
    const { category, search, sort, limit } = req.query;

    let query = `SELECT id, title, description, price, category, stock, "imageUrls", "imageUrls"[1] AS "imageUrl" FROM products WHERE 1=1`;
    const params = [];
    let i = 1;

    if (category && category !== "all") {
      query += ` AND category = $${i++}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (title ILIKE $${i} OR description ILIKE $${i + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      i += 2;
    }

    if (sort === "price-asc") {
      query += " ORDER BY price ASC";
    } else if (sort === "price-desc") {
      query += " ORDER BY price DESC";
    } else {
      query += " ORDER BY id DESC";
    }

    if (limit) {
      query += ` LIMIT $${i++}`;
      params.push(parseInt(limit, 10));
    }

    try {
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // GET single product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT *, "imageUrls"[1] AS "imageUrl" FROM products WHERE id = $1`,
        [req.params.id],
      );
      if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Failed to fetch product:", err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // POST create a new product (handles multiple image uploads)
  app.post(
    "/api/products",
    (req, res, next) => {
      upload.array("images", 10)(req, res, (err) => {
        if (err) {
          console.error("🚨 CLOUDINARY UPLOAD ERROR:", err);
          return res
            .status(500)
            .json({ error: "Image upload failed", details: err });
        }
        next();
      });
    },
    async (req, res) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }

      try {
        const { title, description, price, category, stock } = req.body;
        const imageUrls = req.files.map((file) => file.path); // Array of Cloudinary URLs

        const result = await pool.query(
          `INSERT INTO products (title, description, price, "imageUrls", category, stock)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, "imageUrls"[1] AS "imageUrl"`,
          [
            title,
            description,
            parseFloat(price),
            imageUrls,
            category,
            parseInt(stock) || 1,
          ],
        );

        res.json(result.rows[0]);
      } catch (err) {
        console.error("Failed to create product:", err.message || err);
        res
          .status(500)
          .json({ error: "Failed to create product", details: err.message });
      }
    },
  );

  // PATCH update a product
  app.patch(
    "/api/products/:id",
    upload.array("images", 10),
    async (req, res) => {
      try {
        const { title, description, price, category, stock } = req.body;
        let imageUrls = null;

        // If new files are supplied, overwrite images
        if (req.files && req.files.length > 0) {
          imageUrls = req.files.map((f) => f.path);
        }

        const fields = [];
        const params = [];
        let i = 1;

        if (title !== undefined) {
          fields.push(`title = $${i++}`);
          params.push(title);
        }
        if (description !== undefined) {
          fields.push(`description = $${i++}`);
          params.push(description);
        }
        if (price !== undefined) {
          fields.push(`price = $${i++}`);
          params.push(parseFloat(price));
        }
        if (category !== undefined) {
          fields.push(`category = $${i++}`);
          params.push(category);
        }
        if (stock !== undefined) {
          fields.push(`stock = $${i++}`);
          params.push(parseInt(stock, 10));
        }
        if (imageUrls) {
          fields.push(`"imageUrls" = $${i++}`);
          params.push(imageUrls);
        }

        if (fields.length === 0) {
          return res.status(400).json({ error: "No fields to update" });
        }

        params.push(req.params.id);
        const result = await pool.query(
          `UPDATE products SET ${fields.join(", ")} WHERE id = $${i} RETURNING *, "imageUrls"[1] AS "imageUrl"`,
          params,
        );

        if (!result.rows[0])
          return res.status(404).json({ error: "Not found" });
        res.json(result.rows[0]);
      } catch (err) {
        console.error("Failed to update product:", err);
        res.status(500).json({ error: "Failed to update product" });
      }
    },
  );

  // DELETE a product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM order_items WHERE "productId" = $1`, [
        req.params.id,
      ]);
      await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete product:", err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ─────────────────────────────────────────────
  // ORDER ROUTES
  // ─────────────────────────────────────────────

  // POST create an order
  app.post("/api/orders", async (req, res) => {
    const { customerName, phone, email, address, items, total, paymentMethod } =
      req.body;
    const trackingId =
      "TRK" +
      Date.now() +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const orderResult = await client.query(
        `INSERT INTO orders ("trackingId", "customerName", phone, email, address, "paymentMethod", total)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [trackingId, customerName, phone, email, address, paymentMethod, total],
      );
      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)`,
          [orderId, item.productId, item.quantity, item.price],
        );
        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.productId],
        );
      }

      await client.query("COMMIT");

      // Send confirmation email
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
            </div>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          </div>
        `,
      };

      transporter
        .sendMail(mailOptions)
        .catch((err) => console.error("Email err:", err));
      res.json({ success: true, orderId, trackingId });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Order Transaction Error:", err);
      res.status(500).json({ error: "Order failed" });
    } finally {
      client.release();
    }
  });

  // GET all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await pool.query(
        `SELECT * FROM orders ORDER BY "createdAt" DESC`,
      );
      const items = await pool.query(
        `SELECT oi.*, p.title, p."imageUrls"[1] AS "imageUrl"
         FROM order_items oi
         JOIN products p ON oi."productId" = p.id`,
      );

      const formattedOrders = orders.rows.map((o) => ({
        ...o,
        items: items.rows.filter((i) => i.orderId === o.id),
      }));

      res.json(formattedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // GET track single order
  app.get("/api/orders/track/:trackingId", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM orders WHERE "trackingId" = $1`,
        [req.params.trackingId],
      );
      if (!result.rows[0])
        return res.status(404).json({ error: "Order not found" });

      const order = result.rows[0];
      const items = await pool.query(
        `SELECT oi.*, p.title, p."imageUrls"[1] AS "imageUrl"
         FROM order_items oi
         JOIN products p ON oi."productId" = p.id
         WHERE oi."orderId" = $1`,
        [order.id],
      );

      res.json({ ...order, items: items.rows });
    } catch (err) {
      console.error("Failed to track order:", err);
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  // PATCH update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
        status,
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // DELETE an order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM order_items WHERE "orderId" = $1`, [
        req.params.id,
      ]);
      await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // ─────────────────────────────────────────────
  // VITE / STATIC FILES
  // ─────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
