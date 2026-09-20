// File Location: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const maxDuration = 30;

// ============================================================================
// HARDCODED TESTING TOKENS (Updated with a trailing 1 to flush Meta's cache)
// ============================================================================
const VERIFY_TOKEN = "ChatBiz_Secret_Secure_Token_20261";
const APP_SECRET = "75f43d75c292f7f143cc843934756bec";

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
// GET: Meta Handshake Verification Loop
// ----------------------------------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ CHATBIZ BACKEND: VERIFICATION CHALLENGE RECEIVED AND AUTHENTICATED');

            // Return raw challenge text string exactly as text/plain content type
            return new Response(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': String(challenge ? challenge.length : 0)
                },
            });
        }
    }
    return new Response('Forbidden Check Mismatch', { status: 403 });
}

// ----------------------------------------------------------------------------
// POST: Incoming Message Ingress
// ----------------------------------------------------------------------------
export async function POST(request) {
    try {
        const rawBody = await request.text();
        const isAuthentic = await verifyMetaWebhookSignature(request, rawBody);

        if (!isAuthentic) {
            console.warn('❌ [Security Mismatch]: Invalid signature header.');
            return new Response('Unauthorized Signature', { status: 401 });
        }

        const body = JSON.parse(rawBody);
        if (body.object === 'whatsapp_business_account') {
            const changes = body.entry?.[0]?.changes?.[0]?.value;
            if (changes && changes.messages) {
                const messageData = changes.messages[0];
                console.log(`📬 Message captured from: ${messageData.from}`);
                console.log(`💬 Text: "${messageData.text?.body}"`);
            }
            return new Response('EVENT_RECEIVED', { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('❌ Error processing payload:', error);
        return new Response('Internal Error', { status: 500 });
    }
}
