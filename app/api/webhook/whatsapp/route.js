// File Location: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

// ============================================================================
// HARDCODED TESTING TOKENS (Matching your active Meta validation panel fields)
// ============================================================================
const VERIFY_TOKEN = "ChatBiz_Secret_Secure_Token_2026";
const APP_SECRET = "75f43d75c292f7f143cc843934756bec";

/**
 * Cryptographic validation checking that incoming payloads are authentically from Meta
 */
function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    if (!APP_SECRET) {
        console.warn('⚠️ [Security]: APP_SECRET environment variable is not set.');
        return true;
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

    return signatureHash === expectedHash;
}

// ----------------------------------------------------------------------------
// GET: META WEBHOOK HANDSHAKE VERIFICATION ROUTE (EcoRoute Reference Design)
// ----------------------------------------------------------------------------
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ CHATBIZ BACKEND: HANDSHAKE CHALLENGE RECEIVED AND AUTHENTICATED');
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
// POST: INCOMING MESSAGES INGRESS ROUTE (Strict Array Subscript Mapping)
// ----------------------------------------------------------------------------
export async function POST(req) {
    try {
        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        const isVerifiedSource = verifyMetaWebhookSignature(rawBodyText, signatureHeader);
        if (!isVerifiedSource) {
            return NextResponse.json({ error: 'Unauthorized signature.' }, { status: 401 });
        }

        const body = JSON.parse(rawBodyText);

        // STRICT VERIFICATION: Check structural array subscripts to successfully capture Meta incoming payload notifications
        if (!body.object || !body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            return NextResponse.json({ success: true, status: 'SKIPPED_EVENT' }, { status: 200 });
        }

        // Extracting messaging payload block records utilizing standard base [0] positions
        const valueBlock = body.entry[0].changes[0].value;
        const messageNode = valueBlock.messages[0];
        const metadataNode = valueBlock.metadata || {};

        const cleanPhoneNumber = String(messageNode.from || '').trim();
        const businessPhoneNumberId = metadataNode.phone_number_id || "1307900412406936";
        const messageType = messageNode.type;

        let incomingMessage = '';

        if (messageType === 'text') {
            incomingMessage = (messageNode.text?.body || '').trim();
            console.log(`\n📬 [ChatBiz Ingress Engine] Captured Plain Text Payload:`);
            console.log(`📱 Phone: ${cleanPhoneNumber} | 💬 Text: "${incomingMessage}"`);

            // TODO: Route text payload parameters directly to the hidden GPT-4o-mini parsing system
        } else if (messageType === 'interactive') {
            const interactiveType = messageNode.interactive?.type;
            if (interactiveType === 'button_reply') {
                incomingMessage = String(messageNode.interactive?.button_reply?.id || '').trim();
            } else if (interactiveType === 'list_reply') {
                incomingMessage = String(messageNode.interactive?.list_reply?.id || '').trim();
            }
            console.log(`\n🎯 [ChatBiz Ingress Engine] Captured Interactive Click Selection ID: "${incomingMessage}"`);

            // TODO: Process quick-reply buttons (e.g., [Accept Job], [Deposit Paid], [Completed])
        } else {
            console.log(`⚠️ [ChatBiz Ingress Engine] Bypassed unsupported media data type payload.`);
        }

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Pipeline Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}
