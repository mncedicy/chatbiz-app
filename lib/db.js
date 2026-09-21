// lib/db.js
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
    console.error('🚨 [Database Error]: NEON_DATABASE_URL is missing in environment variables.');
}

const pool = new Pool({
    connectionString: connectionString,
});

export default pool;