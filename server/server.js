import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
const PORT = 3001;
const db = new Database("database.db");

app.use(cors());
app.use(express.json());

// --- DATABASE SCHEMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('MOVIE', 'SERIES')) NOT NULL,
    release_year INTEGER,
    rating TEXT CHECK(rating IN ('SKIP', 'TIMEPASS', 'GO_FOR_IT', 'LISAN_AL_GAIB')) NOT NULL,
    date_watched TEXT NOT NULL,
    is_rewatch INTEGER DEFAULT 0,
    season INTEGER,
    episode INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- API ROUTES ---

// GET all logs
app.get("/api/logs", (req, res) => {
    const stmt = db.prepare(
        "SELECT * FROM logs ORDER BY date_watched DESC, created_at DESC"
    );
    const logs = stmt.all();
    res.json(logs);
});

// POST new log
app.post("/api/logs", (req, res) => {
    const {
        title,
        type,
        release_year,
        rating,
        date_watched,
        is_rewatch,
        season,
        episode,
        notes,
    } = req.body;
    const stmt = db.prepare(`
    INSERT INTO logs (title, type, release_year, rating, date_watched, is_rewatch, season, episode, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    try {
        const info = stmt.run(
            title,
            type,
            release_year,
            rating,
            date_watched,
            is_rewatch ? 1 : 0,
            season || null,
            episode || null,
            notes
        );
        res.status(201).json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (Update) existing log
app.put("/api/logs/:id", (req, res) => {
    const {
        title,
        type,
        release_year,
        rating,
        date_watched,
        is_rewatch,
        season,
        episode,
        notes,
    } = req.body;
    const { id } = req.params;

    const stmt = db.prepare(`
    UPDATE logs 
    SET title=?, type=?, release_year=?, rating=?, date_watched=?, is_rewatch=?, season=?, episode=?, notes=?
    WHERE id=?
  `);

    try {
        const info = stmt.run(
            title,
            type,
            release_year,
            rating,
            date_watched,
            is_rewatch ? 1 : 0,
            season || null,
            episode || null,
            notes,
            id
        );
        if (info.changes === 0)
            return res.status(404).json({ error: "Log not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE log
app.delete('/api/logs/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM logs WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

// SEARCH logs
app.get("/api/search", (req, res) => {
    const { q } = req.query;
    const stmt = db.prepare(
        "SELECT * FROM logs WHERE title LIKE ? ORDER BY date_watched DESC"
    );
    const logs = stmt.all(`%${q}%`);
    res.json(logs);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
