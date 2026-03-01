import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("tremseh.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT UNIQUE, -- email or phone
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT, -- real_estate, land, car
    title TEXT,
    description TEXT,
    price INTEGER, -- Changed to INTEGER for filtering
    contact_phone TEXT,
    image_url TEXT,
    -- New fields for filtering
    rooms INTEGER,
    area INTEGER,
    car_type TEXT,
    car_model TEXT,
    car_year INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  db.exec("ALTER TABLE ads ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/login", (req, res) => {
    const { identifier, name } = req.body;
    try {
      const stmt = db.prepare("INSERT OR IGNORE INTO users (identifier, name) VALUES (?, ?)");
      stmt.run(identifier, name);
      const user = db.prepare("SELECT * FROM users WHERE identifier = ?").get(identifier);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/ads", (req, res) => {
    const { category, minPrice, maxPrice, minArea, maxArea, rooms, carType, carModel, minYear, maxYear } = req.query;
    try {
      let query = "SELECT * FROM ads WHERE 1=1";
      const params: any[] = [];

      if (category && category !== 'all') {
        query += " AND category = ?";
        params.push(category);
      }
      if (minPrice) {
        query += " AND price >= ?";
        params.push(Number(minPrice));
      }
      if (maxPrice) {
        query += " AND price <= ?";
        params.push(Number(maxPrice));
      }
      if (minArea) {
        query += " AND area >= ?";
        params.push(Number(minArea));
      }
      if (maxArea) {
        query += " AND area <= ?";
        params.push(Number(maxArea));
      }
      if (rooms) {
        query += " AND rooms = ?";
        params.push(Number(rooms));
      }
      if (carType) {
        query += " AND car_type LIKE ?";
        params.push(`%${carType}%`);
      }
      if (carModel) {
        query += " AND car_model LIKE ?";
        params.push(`%${carModel}%`);
      }
      if (minYear) {
        query += " AND car_year >= ?";
        params.push(Number(minYear));
      }
      if (maxYear) {
        query += " AND car_year <= ?";
        params.push(Number(maxYear));
      }

      query += " ORDER BY created_at DESC";
      const ads = db.prepare(query).all(...params);
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.post("/api/ads", (req, res) => {
    const { user_id, category, title, description, price, contact_phone, image_url, rooms, area, car_type, car_model, car_year } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO ads (user_id, category, title, description, price, contact_phone, image_url, rooms, area, car_type, car_model, car_year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(user_id, category, title, description, Number(price), contact_phone, image_url, rooms ? Number(rooms) : null, area ? Number(area) : null, car_type, car_model, car_year ? Number(car_year) : null);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to post ad" });
    }
  });

  app.post("/api/contact", (req, res) => {
    const { subject, message, name, identifier } = req.body;
    // In a real production app, we would use a service like Nodemailer or SendGrid here.
    // The recipient is hardcoded as soheabwaheed@gmail.com in the backend logic.
    console.log(`New Contact Message to soheabwaheed@gmail.com:
      From: ${name} (${identifier})
      Subject: ${subject}
      Message: ${message}`);
    
    res.json({ success: true, message: "تم إرسال رسالتك بنجاح" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
