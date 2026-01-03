import Database from 'better-sqlite3';
import pg from 'pg';

// --- CONFIGURATION ---
// Yahan wo lamba URL paste karo jo tumne Render ke "Environment Variables" mein daala tha
// (Neon Dashboard se copy kar sakte ho)
const NEON_DB_URL = "postgresql://______________"; 

const SQLITE_FILE = 'database.db'; 

// --- SCRIPT ---
const sqlite = new Database(SQLITE_FILE);
const { Pool } = pg;
const pool = new Pool({
    connectionString: NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
    console.log("🚀 Migration Shuru...");

    // 1. Local SQLite se data padho
    try {
        const rows = sqlite.prepare('SELECT * FROM logs').all();
        console.log(`📂 SQLite mein ${rows.length} memories mili.`);

        // 2. Cloud DB mein data daalo
        for (const row of rows) {
            await pool.query(`
                INSERT INTO logs (
                    title, type, release_year, rating, date_watched, 
                    is_rewatch, season, episode, notes, status, total_episodes
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                row.title, 
                row.type, 
                row.release_year, 
                row.rating, 
                row.date_watched, 
                row.is_rewatch ? true : false, // 1/0 ko true/false mein badla
                row.season || null, 
                row.episode || null, 
                row.notes, 
                row.status || 'COMPLETED',
                row.total_episodes || null
            ]);
            console.log(`✅ Moved: ${row.title}`);
        }
        console.log("\n🎉 Sab transfer ho gaya! Ab website refresh karo.");
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        pool.end();
    }
};

migrate();
