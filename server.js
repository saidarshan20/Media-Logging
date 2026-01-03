import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Default password (change in env)

// Database Connection (Postgres)
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon/Render
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend Static Files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// YAHAN CHANGE HAI: 'dist' ki jagah 'client', 'dist'
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Catch-all route mein bhi change:
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

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

// --- API ROUTES ---

// GET all logs (Protected)
app.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM logs ORDER BY date_watched DESC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new log (Protected)
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

// PUT (Update) existing log (Protected)
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

// DELETE log (Protected)
app.delete('/api/logs/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM logs WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEARCH logs (Protected)
app.get('/api/search', requireAuth, async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query('SELECT * FROM logs WHERE title ILIKE $1 ORDER BY date_watched DESC', [`%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route to serve React App for any other URL (Important for routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});