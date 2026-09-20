// app\api\webhook\whatsapp\route.js

import { NextResponse } from 'next/server';

// Extend serverless execution timeout threshold to 30 seconds for AI cycles
export const maxDuration = 30;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ChatBiz_Secret_Secure_Token_2026';

// ----------------------------------------------------------------------------
// META WEBHOOK HANDSHAKE VERIFICATION ROUTE (GET /api/webhook)
// ----------------------------------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ CHATBIZ NEXT.JS WEBHOOK SECURELY VERIFIED BY META!');
            return new Response(challenge, { status: 200 });
        } else {
            console.log('❌ WEBHOOK HANDSHAKE FAILED: TOKEN MISMATCH');
            return new Response('Forbidden', { status: 403 });
        }
    }
    return new Response('Bad Request', { status: 400 });
}

// ----------------------------------------------------------------------------
// RECEIVE INCOMING MESSAGES & CONTEXT PARSING (POST /api/webhook)
// ----------------------------------------------------------------------------
export async function POST(request) {
    try {
        const body = await request.json();

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0]?.value;

            if (changes && changes.messages) {
                const messageData = changes.messages[0];
                const customerPhone = messageData.from;
                const messageType = messageData.type;

                console.log(`\n📬 INCOMING CHATBIZ METADATA PACKET DETECTED (NEXT.JS)`);
                console.log(`📱 Customer Number: ${customerPhone}`);
                console.log(`🔤 Message Type: ${messageType}`);

                if (messageType === 'text') {
                    const textContent = messageData.text.body;
                    console.log(`💬 Copied Text Payload: "${textContent}"`);
                }
            }

            return new Response('EVENT_RECEIVED', { status: 200 });
        } else {
            return new Response('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error('❌ ERROR PROCESSING WEBHOOK PAYLOAD:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
