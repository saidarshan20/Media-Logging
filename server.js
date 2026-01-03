import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Database Connection (Postgres)
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());

// --- SERVE STATIC FILES (Frontend Assets) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ye line assets (JS/CSS) serve karegi
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized: Galat password bhai!" });
  }
};

// --- DATABASE MIGRATION ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        release_year TEXT,
        rating TEXT NOT NULL,
        date_watched TEXT NOT NULL,
        is_rewatch BOOLEAN DEFAULT FALSE,
        season INTEGER,
        episode INTEGER,
        total_episodes INTEGER,
        notes TEXT,
        status TEXT DEFAULT 'COMPLETED',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database connected & Table verified.");
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};
initDB();

// --- API ROUTES (Ye pehle aane chahiye) ---

// GET all logs
app.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM logs ORDER BY date_watched DESC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new log
app.post('/api/logs', requireAuth, async (req, res) => {
    const { title, type, release_year, rating, date_watched, is_rewatch, season, episode, notes, status, total_episodes } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO logs (title, type, release_year, rating, date_watched, is_rewatch, season, episode, notes, status, total_episodes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [title, type, release_year, rating, date_watched, is_rewatch, season || null, episode || null, notes, status || 'COMPLETED', total_episodes || null]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (Update) existing log
app.put('/api/logs/:id', requireAuth, async (req, res) => {
    const { title, type, release_year, rating, date_watched, is_rewatch, season, episode, notes, status, total_episodes } = req.body;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE logs 
             SET title=$1, type=$2, release_year=$3, rating=$4, date_watched=$5, is_rewatch=$6, season=$7, episode=$8, notes=$9, status=$10, total_episodes=$11
             WHERE id=$12`,
            [title, type, release_year, rating, date_watched, is_rewatch, season || null, episode || null, notes, status || 'COMPLETED', total_episodes || null, id]
        );
        
        if (result.rowCount === 0) return res.status(404).json({ error: "Log not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE log
app.delete('/api/logs/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM logs WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEARCH logs
app.get('/api/search', requireAuth, async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query('SELECT * FROM logs WHERE title ILIKE $1 ORDER BY date_watched DESC', [`%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CATCH-ALL ROUTE (Ye SABSE LAST mein hona chahiye) ---
// Agar upar koi API route match nahi hua, toh React App bhej do
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});