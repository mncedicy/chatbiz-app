// app\api\webhook\whatsapp\sessionEngine.js 

import pool from '../../../../lib/db';

const SESSION_TIMEOUT_MINUTES = 30;

export async function getUserBusinesses(userId) {
    if (!userId) return [];
    const res = await pool.query(
        'SELECT id, business_name, business_class, is_fica_verified FROM merchant_profiles WHERE user_id = $1 ORDER BY id ASC',
        [userId]
    );
    return res.rows;
}

export async function getOrCreateSession(phoneNumber) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let userRes = await client.query(
            'SELECT id, title, first_name, last_name, email_address, preferred_language FROM core_users WHERE phone_number = $1',
            [phoneNumber]
        );

        let user;

        if (userRes.rowCount === 0) {
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

        if (!user) {
            user = { id: null, first_name: 'WhatsApp', last_name: 'User', title: null, preferred_language: 'en' };
        }

        let session;
        if (user.id) {
            let sessionRes = await client.query(
                'SELECT * FROM whatsapp_sessions WHERE user_id = $1',
                [user.id]
            );

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
        } else {
            session = { id: 'temp_session', active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' };
        }

        await client.query('COMMIT');
        return { session, user };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [Session Engine Error]:', error);
        return {
            session: { id: 'error_fallback', active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' },
            user: { id: null, first_name: 'WhatsApp', last_name: 'User', title: null, preferred_language: 'en' }
        };
    } finally {
        client.release();
    }
}

export async function updateSession(sessionId, updates = {}) {
    if (!sessionId || sessionId === 'temp_session' || sessionId === 'error_fallback') {
        return null;
    }

    const { currentStep, activeMode, activeBusinessId, metadata } = updates;

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
    if (activeBusinessId !== undefined) {
        query += `, active_business_id = $${paramIdx++}`;
        values.push(activeBusinessId);
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