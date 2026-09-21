// lib/sessionEngine.js
import pool from './db';

const SESSION_TIMEOUT_MINUTES = 30;

/**
 * Gets or initializes a user's session state and user details from Neon PostgreSQL
 * @param {string} phoneNumber - User's mobile number
 */
export async function getOrCreateSession(phoneNumber) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch complete user profile matching chatbiz_neon_database_2.md
        let userRes = await client.query(
            'SELECT id, title, first_name, last_name, email_address, preferred_language FROM core_users WHERE phone_number = $1',
            [phoneNumber]
        );

        let user;

        if (userRes.rowCount === 0) {
            // Create new baseline user if non-existent
            const newUser = await client.query(
                `INSERT INTO core_users (phone_number, first_name, last_name, preferred_language) 
         VALUES ($1, 'WhatsApp', 'User', 'en') 
         RETURNING id, title, first_name, last_name, email_address, preferred_language`,
                [phoneNumber]
            );
            user = newUser.rows[0];
        } else {
            user = userRes.rows[0];
        }

        // 2. Fetch or create active session
        let sessionRes = await client.query(
            'SELECT * FROM whatsapp_sessions WHERE user_id = $1',
            [user.id]
        );

        let session;
        const now = new Date();

        if (sessionRes.rowCount === 0) {
            const newSession = await client.query(
                `INSERT INTO whatsapp_sessions (user_id, active_mode, current_step, cached_metadata, updated_at)
         VALUES ($1, 'CUSTOMER_MODE', 'MAIN_MENU', '{}'::jsonb, NOW())
         RETURNING *`,
                [user.id]
            );
            session = newSession.rows[0];
        } else {
            session = sessionRes.rows[0];
            const lastUpdate = new Date(session.updated_at);
            const diffMinutes = (now - lastUpdate) / (1000 * 60);

            // 30-Minute Inactivity Reset
            if (diffMinutes > SESSION_TIMEOUT_MINUTES) {
                console.log(`⏱️ [Session Reset]: User ${phoneNumber} inactive for ${Math.round(diffMinutes)}m. Resetting to MAIN_MENU.`);
                const resetRes = await client.query(
                    `UPDATE whatsapp_sessions 
           SET current_step = 'MAIN_MENU', 
               cached_metadata = '{}'::jsonb, 
               updated_at = NOW() 
           WHERE id = $1 
           RETURNING *`,
                    [session.id]
                );
                session = resetRes.rows[0];
            }
        }

        await client.query('COMMIT');
        return { session, user };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [Session Engine Error]:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Updates session step, mode, and metadata
 */
export async function updateSession(sessionId, updates = {}) {
    const { currentStep, activeMode, metadata } = updates;

    let query = 'UPDATE whatsapp_sessions SET updated_at = NOW()';
    const values = [];
    let paramIdx = 1;

    if (currentStep) {
        query += `, current_step = $${paramIdx++}`;
        values.push(currentStep);
    }
    if (activeMode) {
        query += `, active_mode = $${paramIdx++}`;
        values.push(activeMode);
    }
    if (metadata) {
        query += `, cached_metadata = $${paramIdx++}::jsonb`;
        values.push(JSON.stringify(metadata));
    }

    query += ` WHERE id = $${paramIdx} RETURNING *`;
    values.push(sessionId);

    const res = await pool.query(query, values);
    return res.rows[0];
}