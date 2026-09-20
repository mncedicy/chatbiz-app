// File Location: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Extend serverless execution threshold specifically for incoming AI parsing cycles
export const maxDuration = 30;

// ============================================================================
// HARDCODED TESTING TOKENS (Matching your active Meta validation fields)
// ============================================================================
const VERIFY_TOKEN = "ChatBiz_Secret_Secure_Token_2026";
const APP_SECRET = "75f43d75c292f7f143cc843934756bec";

/**
 * Cryptographic validation checking that incoming payloads are authentically from Meta
 */
async function verifyMetaWebhookSignature(request, rawBody) {
    const signatureHeader = request.headers.get('x-hub-signature-256');
    if (!signatureHeader) return false;

    const elements = signatureHeader.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

    return signatureHash === expectedHash;
}

// ----------------------------------------------------------------------------
// GET: META WEBHOOK HANDSHAKE VERIFICATION ROUTE (Flawless Plain-Text Return)
// ----------------------------------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ CHATBIZ BACKEND: HANDSHAKE CHALLENGE MATCHED');

            // CRITICAL FIX: Utilizing native NextResponse primitives forces Vercel 
            // to send back the raw scalar string with zero background chunk headers
            return new NextResponse(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
    }
    return new NextResponse('Forbidden Check Mismatch', { status: 403 });
}

// ----------------------------------------------------------------------------
// POST: INCOMING MESSAGES INGRESS ROUTE
// ----------------------------------------------------------------------------
export async function POST(request) {
    try {
        const rawBody = await request.text();
        const isAuthentic = await verifyMetaWebhookSignature(request, rawBody);

        if (!isAuthentic) {
            console.warn('❌ [Security Mismatch]: Invalid signature header.');
            return new NextResponse('Unauthorized Signature', { status: 401 });
        }

        const body = JSON.parse(rawBody);
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0]?.value;

            if (changes && changes.messages) {
                const messageData = changes.messages[0];
                console.log(`\n📬 INCOMING SECURED PACKET CAPTURED (QA)`);
                console.log(`📱 Phone: ${messageData.from} | 🔤 Type: ${messageData.type}`);

                if (messageData.type === 'text') {
                    console.log(`💬 Text Content: "${messageData.text?.body}"`);
                }
            }
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        }
        return new NextResponse('Not Found', { status: 404 });
    } catch (error) {
        console.error('❌ ERROR PROCESSING PAYLOAD:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
