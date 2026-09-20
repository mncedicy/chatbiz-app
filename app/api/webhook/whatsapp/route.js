// File Location: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Extend serverless execution timeout threshold to 30 seconds for AI parsing cycles
export const maxDuration = 30;

// ============================================================================
// HARDCODED TESTING TOKENS (Isolating variables for clear validation)
// ============================================================================
const VERIFY_TOKEN = "ChatBiz_Secret_Secure_Token_2026";
const APP_SECRET = "75f43d75c292f7f143cc843934756bec";

/**
 * Cryptographic verification checking that incoming payloads are authentically from Meta
 */
async function verifyMetaWebhookSignature(request, rawBody) {
    const signatureHeader = request.headers.get('x-hub-signature-256');
    if (!signatureHeader) {
        console.warn('⚠️ [Security]: Request missing x-hub-signature-256 header.');
        return false;
    }

    const elements = signatureHeader.split('=');
    const signatureHash = elements[1];

    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

    const isValid = signatureHash === expectedHash;
    if (!isValid) {
        console.warn(`❌ [Security Mismatch]: Expected ${expectedHash}, received ${signatureHash}`);
    }

    return isValid;
}

// ----------------------------------------------------------------------------
// GET: META WEBHOOK HANDSHAKE VERIFICATION ROUTE
// ----------------------------------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ CHATBIZ HARDCODED WEBHOOK SECURELY VERIFIED BY META!');

            // CRITICAL FIX: Meta requires the raw challenge string returned 
            // explicitly as 'text/plain' content type with zero wrapping quotes or object brackets.
            return new Response(challenge, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': String(challenge ? challenge.length : 0)
                },
            });
        }
    }

    // Return standard forbidden fallback message if security check fails
    return new Response('Forbidden', { status: 403 });
}

// ----------------------------------------------------------------------------
// POST: INCOMING MESSAGES INGRESS ROUTE
// ----------------------------------------------------------------------------
export async function POST(request) {
    try {
        // Read the request text buffer stream once for security validation
        const rawBody = await request.text();

        const isAuthentic = await verifyMetaWebhookSignature(request, rawBody);
        if (!isAuthentic) {
            console.warn('❌ [Security Mismatch]: Invalid signature header payload rejected.');
            return new Response('Unauthorized Signature', { status: 401 });
        }

        // Once signature is validated, convert raw body safely to JSON object
        const body = JSON.parse(rawBody);

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0]?.value;

            if (changes && changes.messages) {
                const messageData = changes.messages[0];
                const customerPhone = messageData.from;
                const messageType = messageData.type;

                console.log(`\n📬 INCOMING SECURED PACKET CAPTURED (QA)`);
                console.log(`📱 Phone: ${customerPhone} | 🔤 Type: ${messageType}`);

                if (messageType === 'text') {
                    console.log(`💬 Text Content: "${messageData.text.body}"`);
                }
            }

            // Instantly notify Meta's servers that the packet was accepted safely
            return new Response('EVENT_RECEIVED', { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('❌ ERROR PROCESSING PAYLOAD:', error);
        return new Response('Internal Error', { status: 500 });
    }
}
