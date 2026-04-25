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

// Verify email setup on server start
transporter.verify((error) => {
  if (error) {
    console.error(
      "🚨 Nodemailer Error: Please check your EMAIL_USER and EMAIL_PASS.",
      error,
    );
  } else {
    console.log("✅ Mail server is ready to send invoices.");
  }
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
      await pool.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}'`,
      );
      await pool.query(
        `UPDATE products SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''`,
      );
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
    if (sort === "price-asc") query += " ORDER BY price ASC";
    else if (sort === "price-desc") query += " ORDER BY price DESC";
    else query += " ORDER BY id DESC";

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

  app.post(
    "/api/products",
    (req, res, next) => {
      upload.array("images", 10)(req, res, (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Image upload failed", details: err });
        next();
      });
    },
    async (req, res) => {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }

      try {
        const { title, description, price, category, stock } = req.body;
        const imageUrls = req.files.map((file) => file.path);

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

  app.patch(
    "/api/products/:id",
    upload.array("images", 10),
    async (req, res) => {
      try {
        const { title, description, price, category, stock } = req.body;
        let imageUrls = null;

        if (req.files && req.files.length > 0)
          imageUrls = req.files.map((f) => f.path);

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

        if (fields.length === 0)
          return res.status(400).json({ error: "No fields to update" });

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

      let itemsHtml = "";

      for (const item of items) {
        const pId = item.productId || item.id; // Support both front-end structures

        // Fetch product title for the email invoice
        const productRes = await client.query(
          "SELECT title FROM products WHERE id = $1",
          [pId],
        );
        const productTitle = productRes.rows[0]?.title || "Unknown Product";
        const itemTotal = item.quantity * item.price;

        // Build HTML table rows for the invoice
        itemsHtml += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${productTitle}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-size: 14px;">Rs. ${Number(item.price).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #333; font-size: 14px;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-size: 14px; font-weight: bold;">Rs. ${itemTotal.toFixed(2)}</td>
          </tr>
        `;

        await client.query(
          `INSERT INTO order_items ("orderId", "productId", quantity, price) VALUES ($1, $2, $3, $4)`,
          [orderId, pId, item.quantity, item.price],
        );
        await client.query(
          `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
          [item.quantity, pId],
        );
      }

      await client.query("COMMIT");

      // Construct a strictly formatted HTML Invoice/Bill
      const mailOptions = {
        from: `"Cute Crochets Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Invoice for Order #${trackingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #ff6b81; color: white; padding: 25px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">Itemized Invoice</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Thank you for shopping with Cute Crochets!</p>
            </div>
            
            <div style="padding: 30px;">
              
              <!-- Customer & Tracking Info (Using table for email-client safety) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
                <tr>
                  <td valign="top" style="width: 50%;">
                    <p style="margin: 0 0 5px 0; color: #888; font-size: 11px; text-transform: uppercase; font-weight: bold;">Billed To</p>
                    <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">${customerName}</h3>
                    <p style="margin: 0 0 3px 0; color: #555; font-size: 14px;">${email}</p>
                    <p style="margin: 0; color: #555; font-size: 14px;">${phone}</p>
                  </td>
                  <td valign="top" style="width: 50%; text-align: right;">
                    <p style="margin: 0 0 5px 0; color: #888; font-size: 11px; text-transform: uppercase; font-weight: bold;">Order / Tracking ID</p>
                    <h3 style="margin: 0 0 5px 0; color: #ff6b81; font-size: 18px;">${trackingId}</h3>
                    <p style="margin: 0; color: #555; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
                  </td>
                </tr>
              </table>

              <!-- Itemized Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #fcfcfc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #666; font-size: 13px; text-transform: uppercase;">Product Description</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; color: #666; font-size: 13px; text-transform: uppercase;">Unit Price</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd; color: #666; font-size: 13px; text-transform: uppercase;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; color: #666; font-size: 13px; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total & Payment Method -->
              <div style="border-top: 2px solid #eee; padding-top: 15px; text-align: right;">
                <h2 style="margin: 0; color: #333; font-size: 22px;">Total Bill: Rs. ${Number(total).toFixed(2)}</h2>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Payment Method: <strong>${paymentMethod || "Online"}</strong></p>
              </div>

              <!-- Shipping Address Box -->
              <div style="margin-top: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; text-transform: uppercase;">Shipping Address</h4>
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${address}</p>
              </div>

            </div>
          </div>
        `,
      };

      // Ensure the email is dispatched and log any errors
      try {
        console.log(`Attempting to send invoice email to: ${email}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Invoice email sent successfully to ${email}`);
      } catch (emailErr) {
        console.error("🚨 CRITICAL: Failed to send invoice email:", emailErr);
      }

      res.json({ success: true, orderId, trackingId });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Order Transaction Error:", err);
      res.status(500).json({ error: "Order failed" });
    } finally {
      client.release();
    }
  });

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
