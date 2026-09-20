// File: app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const maxDuration = 30;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'ChatBiz_Secret_Secure_Token_2026';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Cryptographic verification function optimized for Next.js Request Streams
async function verifyMetaWebhookSignature(request, rawBody) {
    if (!APP_SECRET) {
        console.warn('⚠️ [Security]: WHATSAPP_APP_SECRET is not set. Bypassing for testing.');
        return true;
    }

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
            console.log('✅ CHATBIZ QA WEBHOOK SECURELY VERIFIED BY META!');
            return new Response(challenge, { status: 200 });
        }
    }
    return new Response('Forbidden', { status: 403 });
}

// ----------------------------------------------------------------------------
// POST: Authenticated Message Ingress Route
// ----------------------------------------------------------------------------
export async function POST(request) {
    try {
        // Read the incoming request stream buffer once to verify authenticity
        const rawBody = await request.text();

        const isAuthentic = await verifyMetaWebhookSignature(request, rawBody);
        if (!isAuthentic) {
            console.warn('❌ [Security Mismatch]: Invalid signature header payload.');
            return new Response('Unauthorized Signature', { status: 101 }); // Reject unauthorized data
        }

        // Once validated, safe to convert the verified string buffer into JSON
        const body = JSON.parse(rawBody);


        if (body.object === 'whatsapp_business_account') {
            const changes = body.entry?.[0]?.changes?.[0]?.value;

            if (changes && changes.messages) {
                const messageData = changes.messages[0];
                const customerPhone = messageData.from;
                const messageType = messageData.type;

                console.log(`\n📬 INCOMING SECURED PACKET (QA)`);
                console.log(`📱 Phone: ${customerPhone} | 🔤 Type: ${messageType}`);

                if (messageType === 'text') {
                    console.log(`💬 Text: "${messageData.text.body}"`);
                }
            }
            return new Response('EVENT_RECEIVED', { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('❌ ERROR PROCESSING PAYLOAD:', error);
        return new Response('Internal Error', { status: 500 });
    }
}
