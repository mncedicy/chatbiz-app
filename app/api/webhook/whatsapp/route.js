// File Location: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMetaWhatsappMessage } from './metaClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

// ============================================================================
// HARDCODED TESTING TOKENS (Update with your specific CHATBIZ dashboard keys)
// ============================================================================
const VERIFY_TOKEN = "ChatBiz_Secret_Secure_Token_2026";

// 🔴 FIX: Replace this string with your copied ChatBiz App Secret (App Settings > Basic)
const APP_SECRET = "75f43d75c292f7f143cc843934756bec";

/**
 * Cryptographic validation checking that incoming payloads are authentically from Meta
 */
function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    if (!APP_SECRET || APP_SECRET.startsWith("PASTE_")) {
        console.warn('⚠️ [Security]: Valid ChatBiz APP_SECRET is missing. Bypassing check for development.');
        return true; // Temporary bypass to let you test immediately if you don't have the secret handy
    }

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
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return new Response(String(challenge), {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            });
        }

        return new Response('Forbidden Verification Token Mismatch', { status: 403 });
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}

// ----------------------------------------------------------------------------
// POST: INCOMING MESSAGES INGRESS & ECHO RE-ENGAGEMENT LOOP
// ----------------------------------------------------------------------------
export async function POST(req) {
    try {
        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            console.error('❌ [Access Denied]: Webhook signature mismatch.');
            return NextResponse.json({ error: 'Unauthorized signature.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT' }, { status: 200 });
        }

        const valueBlock = body.entry[0].changes[0].value;
        const messageNode = valueBlock.messages[0];
        const metadataNode = valueBlock.metadata || {};

        const cleanPhoneNumber = String(messageNode.from || '').trim();
        const businessPhoneNumberId = metadataNode.phone_number_id;
        const messageType = messageNode.type;

        if (messageType === 'text') {
            const incomingMessage = (messageNode.text?.body || '').trim();
            console.log(`\n📬 [ChatBiz Ingress Engine] Message from: ${cleanPhoneNumber} -> "${incomingMessage}"`);

            // AUTOMATED ECHO REPLY STRING
            const replyText = `🤖 [ChatBiz QA Server]: Hello! I successfully intercepted your text message: "${incomingMessage}". The bidirectional communication loop is now completely operational! ⚡`;

            // Transmit the reply string back to the phone via Meta Graph API
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, replyText);
        }

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Pipeline Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}
