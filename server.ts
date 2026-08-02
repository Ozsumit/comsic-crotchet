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
  } as any,
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
    CREATE TABLE IF NOT EXISTS sellers (
      id SERIAL PRIMARY KEY,
      "sellerId" TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 1,
      "sellerId" TEXT
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

  // Ensure products has sellerId if it was already created previously
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "sellerId" TEXT;
    `);
  } catch (err) {
    console.error("Migration error adding sellerId to products:", err.message);
  }

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
  const PORT = parseInt(process.env.PORT || "3000", 10);

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
    const { category, search, sort, limit, sellerId } = req.query;

    let query = `SELECT id, title, description, price, category, stock, "imageUrls", "imageUrls"[1] AS "imageUrl", "sellerId" FROM products WHERE 1=1`;
    const params = [];
    let i = 1;

    if (category && category !== "all") {
      query += ` AND category = $${i++}`;
      params.push(category as string);
    }
    if (search) {
      query += ` AND (title ILIKE $${i} OR description ILIKE $${i + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      i += 2;
    }
    if (sellerId) {
      query += ` AND "sellerId" = $${i++}`;
      params.push(sellerId as string);
    }

    if (sort === "price-asc") query += " ORDER BY price ASC";
    else if (sort === "price-desc") query += " ORDER BY price DESC";
    else query += " ORDER BY id DESC";

    if (limit) {
      query += ` LIMIT $${i++}`;
      params.push(parseInt(limit as string, 10));
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
        `SELECT *, "imageUrls"[1] AS "imageUrl", "sellerId" FROM products WHERE id = $1`,
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
        const { title, description, price, category, stock, sellerId } = req.body;
        const imageUrls = (req.files as Express.Multer.File[]).map((file) => file.path);

        const result = await pool.query(
          `INSERT INTO products (title, description, price, "imageUrls", category, stock, "sellerId")
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *, "imageUrls"[1] AS "imageUrl", "sellerId"`,
          [
            title,
            description,
            parseFloat(price),
            imageUrls,
            category,
            parseInt(stock) || 1,
            sellerId || null,
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
        const { title, description, price, category, stock, sellerId, imageUrls: reqImageUrls } = req.body;
        let imageUrls = null;

        const filesArray = req.files as Express.Multer.File[];
        if (filesArray && filesArray.length > 0) {
          imageUrls = filesArray.map((f) => f.path);
        } else if (reqImageUrls) {
          try {
            imageUrls = Array.isArray(reqImageUrls) ? reqImageUrls : JSON.parse(reqImageUrls);
          } catch (e) {
            imageUrls = reqImageUrls;
          }
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
        if (sellerId !== undefined) {
          fields.push(`"sellerId" = $${i++}`);
          params.push(sellerId || null);
        }
        if (imageUrls) {
          fields.push(`"imageUrls" = $${i++}`);
          params.push(imageUrls);
        }

        if (fields.length === 0)
          return res.status(400).json({ error: "No fields to update" });

        params.push(req.params.id);
        const result = await pool.query(
          `UPDATE products SET ${fields.join(", ")} WHERE id = $${i} RETURNING *, "imageUrls"[1] AS "imageUrl", "sellerId"`,
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
      const sellerItemsMap = new Map<string, any[]>();

      for (const item of items) {
        const pId = item.productId || item.id; // Support both front-end structures

        // Fetch product title for the email invoice
        const productRes = await client.query(
          'SELECT title, "sellerId" FROM products WHERE id = $1',
          [pId],
        );
        const productTitle = productRes.rows[0]?.title || "Unknown Product";
        const productSellerId = productRes.rows[0]?.sellerId || null;
        const itemTotal = item.quantity * item.price;

        if (productSellerId) {
          if (!sellerItemsMap.has(productSellerId)) {
            sellerItemsMap.set(productSellerId, []);
          }
          sellerItemsMap.get(productSellerId)!.push({
            title: productTitle,
            quantity: item.quantity,
            price: item.price,
            total: itemTotal,
          });
        }

        // Build HTML table rows for the invoice
        itemsHtml += `
          <tr>
            <td style="padding: 15px 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; line-height: 1.4;">
              <strong>${productTitle}</strong>
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #555555; font-size: 14px;">
              Rs. ${Number(item.price).toFixed(2)}
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 14px;">
              ${item.quantity}
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333; font-size: 14px; font-weight: bold;">
              Rs. ${itemTotal.toFixed(2)}
            </td>
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

      // Send notifications to sellers
      for (const [sId, sItems] of sellerItemsMap.entries()) {
        try {
          const sellerRes = await pool.query(
            'SELECT name, email FROM sellers WHERE "sellerId" = $1',
            [sId]
          );
          if (sellerRes.rows.length > 0) {
            const seller = sellerRes.rows[0];
            let sellerItemsHtml = "";
            let sellerTotal = 0;

            for (const sItem of sItems) {
              sellerTotal += sItem.total;
              sellerItemsHtml += `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px;">
                    <strong>${sItem.title}</strong>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #555555; font-size: 14px;">
                    Rs. ${Number(sItem.price).toFixed(2)}
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center; color: #555555; font-size: 14px;">
                    ${sItem.quantity}
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333; font-size: 14px; font-weight: bold;">
                    Rs. ${Number(sItem.total).toFixed(2)}
                  </td>
                </tr>
              `;
            }

            const sellerMailOptions = {
              from: `"Pastel Stitches" <${process.env.EMAIL_USER}>`,
              to: seller.email,
              subject: `Yay! You sold an item! Order #${trackingId}`,
              html: `
                <div style="background-color: #f4f4f4; padding: 20px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="background-color: #ff6b81; color: #ffffff; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">Item Sold!</h1>
                      <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Congratulations, ${seller.name}! You made a sale!</p>
                    </div>
                    <div style="padding: 30px;">
                      <h3 style="color: #333333; margin-top: 0;">Order Details</h3>
                      <p style="font-size: 14px; color: #555555; line-height: 1.5;">
                        <strong>Order ID:</strong> ${trackingId}<br/>
                        <strong>Customer Name:</strong> ${customerName}<br/>
                        <strong>Phone:</strong> ${phone || "Not provided"}<br/>
                        <strong>Shipping Address:</strong> ${address}<br/>
                      </p>

                      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
                        <thead>
                          <tr style="background-color: #f9f9f9;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase;">Item</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase;">Price</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${sellerItemsHtml}
                        </tbody>
                      </table>

                      <h3 style="text-align: right; color: #333333;">Your Total Earnings: Rs. ${Number(sellerTotal).toFixed(2)}</h3>
                    </div>
                    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0; color: #888888; font-size: 13px;">Pastel Stitches Seller Portal</p>
                    </div>
                  </div>
                </div>
              `,
            };

            console.log(`Attempting to send sold notification to seller: ${seller.email}`);
            await transporter.sendMail(sellerMailOptions);
            console.log(`✅ Sold notification email sent successfully to ${seller.email}`);
          }
        } catch (sellerEmailErr) {
          console.error(`🚨 Failed to send notification email to seller of ID ${sId}:`, sellerEmailErr);
        }
      }

      // Construct a strictly formatted HTML Invoice/Bill
      const mailOptions = {
        from: `"Pastel Stitches" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your Receipt for Order #${trackingId}`,
        html: `
          <div style="background-color: #f4f4f4; padding: 20px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <div style="background-color: #ff6b81; color: #ffffff; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">Order Confirmation</h1>
                <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Thank you for shopping with Pastel Stitches!</p>
              </div>
              
              <div style="padding: 30px;">
                
                <!-- Quick Summary Box -->
                <div style="background-color: #fff0f2; border-left: 4px solid #ff6b81; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                  <p style="margin: 0; font-size: 16px; color: #333333;">
                    <strong>Order Total:</strong> Rs. ${Number(total).toFixed(2)} <br/>
                    <span style="font-size: 13px; color: #666666;">Payment Method: ${paymentMethod || "Online"}</span>
                  </p>
                </div>

                <!-- Customer & Tracking Info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                    <td valign="top" style="width: 50%; padding-right: 10px;">
                      <p style="margin: 0 0 5px 0; color: #888888; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Billed To</p>
                      <h3 style="margin: 0 0 5px 0; color: #333333; font-size: 16px;">${customerName}</h3>
                      <p style="margin: 0 0 3px 0; color: #555555; font-size: 14px;">${email}</p>
                      <p style="margin: 0; color: #555555; font-size: 14px;">${phone}</p>
                    </td>
                    <td valign="top" style="width: 50%; text-align: right; padding-left: 10px;">
                      <p style="margin: 0 0 5px 0; color: #888888; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Order ID</p>
                      <h3 style="margin: 0 0 10px 0; color: #ff6b81; font-size: 16px;">${trackingId}</h3>
                      <p style="margin: 0 0 12px 0; color: #555555; font-size: 13px;">Date: ${new Date().toLocaleDateString()}</p>
                      
                      <!-- Bulletproof Email Button -->
                      <a href="https://crotchet.sumit.info.np/track?id=${trackingId}" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #ff6b81; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: bold;">
                        Track Your Order
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Itemized Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <thead>
                    <tr>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dddddd; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <!-- Total Alignment -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                    <td style="text-align: right;">
                      <h2 style="margin: 0; color: #333333; font-size: 22px;">Total: Rs. ${Number(total).toFixed(2)}</h2>
                    </td>
                  </tr>
                </table>

                <!-- Shipping Address Box -->
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eeeeee;">
                  <h4 style="margin: 0 0 10px 0; color: #333333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h4>
                  <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">${address}</p>
                </div>

              </div>
              
              <!-- Footer Section -->
              <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; color: #888888; font-size: 13px;">
                  Have questions about your order? <br/>
                  Reply to this email or contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #ff6b81; text-decoration: none;">${process.env.EMAIL_USER}</a>.
                </p>
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
    const { sellerId } = req.query;
    try {
      let ordersQuery = `SELECT * FROM orders ORDER BY "createdAt" DESC`;
      let itemsQuery = `
        SELECT oi.*, p.title, p."imageUrls"[1] AS "imageUrl", p."sellerId"
        FROM order_items oi
        JOIN products p ON oi."productId" = p.id
      `;
      const ordersParams = [];
      const itemsParams = [];

      if (sellerId) {
        ordersQuery = `
          SELECT DISTINCT o.*
          FROM orders o
          JOIN order_items oi ON o.id = oi."orderId"
          JOIN products p ON oi."productId" = p.id
          WHERE p."sellerId" = $1
          ORDER BY o."createdAt" DESC
        `;
        ordersParams.push(sellerId);

        itemsQuery = `
          SELECT oi.*, p.title, p."imageUrls"[1] AS "imageUrl", p."sellerId"
          FROM order_items oi
          JOIN products p ON oi."productId" = p.id
          WHERE p."sellerId" = $1
        `;
        itemsParams.push(sellerId);
      }

      const orders = await pool.query(ordersQuery, ordersParams);
      const items = await pool.query(itemsQuery, itemsParams);

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
  // SELLER ROUTES
  // ─────────────────────────────────────────────

  app.post("/api/sellers/enroll", async (req, res) => {
    const { name, email, sellerId, password } = req.body;
    if (!name || !email || !sellerId || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      // Check if sellerId already exists
      const checkResult = await pool.query(
        'SELECT id FROM sellers WHERE "sellerId" = $1',
        [sellerId]
      );
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: "Seller ID already taken" });
      }

      // Check if email already exists
      const emailCheck = await pool.query(
        'SELECT id FROM sellers WHERE email = $1',
        [email]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const result = await pool.query(
        `INSERT INTO sellers (name, email, "sellerId", password)
         VALUES ($1, $2, $3, $4) RETURNING id, name, email, "sellerId"`,
        [name, email, sellerId, password]
      );

      res.json({ success: true, seller: result.rows[0] });
    } catch (err) {
      console.error("Failed to enroll seller:", err);
      res.status(500).json({ error: "Failed to enroll seller" });
    }
  });

  app.post("/api/sellers/login", async (req, res) => {
    const { sellerId, password } = req.body;
    if (!sellerId || !password) {
      return res.status(400).json({ error: "Seller ID and password are required" });
    }

    try {
      const result = await pool.query(
        'SELECT * FROM sellers WHERE "sellerId" = $1 AND password = $2',
        [sellerId, password]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid Seller ID or password" });
      }

      const seller = result.rows[0];
      res.json({
        success: true,
        seller: {
          id: seller.id,
          sellerId: seller.sellerId,
          name: seller.name,
          email: seller.email,
        }
      });
    } catch (err) {
      console.error("Seller login failed:", err);
      res.status(500).json({ error: "Seller login failed" });
    }
  });

  app.get("/api/sellers", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT s.id, s."sellerId", s.name, s.email, s."createdAt",
               CAST((SELECT COUNT(*) FROM products p WHERE p."sellerId" = s."sellerId") AS INTEGER) AS "productCount",
               COALESCE((
                 SELECT CAST(SUM(oi.quantity * oi.price) AS REAL)
                 FROM order_items oi
                 JOIN products p ON oi."productId" = p.id
                 WHERE p."sellerId" = s."sellerId"
               ), 0.0) AS "totalSales"
        FROM sellers s
        ORDER BY s.id DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch sellers:", err);
      res.status(500).json({ error: "Failed to fetch sellers" });
    }
  });

  app.patch("/api/sellers/:id", async (req, res) => {
    const { name, email } = req.body;
    try {
      const result = await pool.query(
        `UPDATE sellers SET name = $1, email = $2 WHERE id = $3 RETURNING id, "sellerId", name, email`,
        [name, email, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Seller not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Failed to update seller:", err);
      res.status(500).json({ error: "Failed to update seller" });
    }
  });

  app.delete("/api/sellers/:id", async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sellerRes = await client.query('SELECT "sellerId" FROM sellers WHERE id = $1', [req.params.id]);
      if (sellerRes.rows.length === 0) {
        return res.status(404).json({ error: "Seller not found" });
      }
      const sellerId = sellerRes.rows[0].sellerId;

      await client.query('UPDATE products SET "sellerId" = NULL WHERE "sellerId" = $1', [sellerId]);
      await client.query('DELETE FROM sellers WHERE id = $1', [req.params.id]);

      await client.query("COMMIT");
      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Failed to delete seller:", err);
      res.status(500).json({ error: "Failed to delete seller" });
    } finally {
      client.release();
    }
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (o.email)
          o.email,
          o."customerName" AS name,
          o.phone,
          o.address,
          CAST(stats.order_count AS INTEGER) AS "orderCount",
          CAST(stats.total_spent AS REAL) AS "totalSpent",
          stats.last_order_date AS "lastOrderDate"
        FROM orders o
        JOIN (
          SELECT
            email,
            COUNT(id) AS order_count,
            SUM(total) AS total_spent,
            MAX("createdAt") AS last_order_date
          FROM orders
          GROUP BY email
        ) stats ON o.email = stats.email
        ORDER BY o.email, o."createdAt" DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      res.status(500).json({ error: "Failed to fetch customers" });
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
