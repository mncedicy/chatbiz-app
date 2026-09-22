// app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMetaWhatsappMessage, buildInteractiveButtons } from './metaClient';
import { getOrCreateSession, updateSession } from '@/lib/sessionEngine';
import { parseUserIntent } from '@/lib/aiParser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ChatBiz_Secret_Secure_Token_2026";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    if (!APP_SECRET) {
        console.warn('⚠️ [Security]: WHATSAPP_APP_SECRET missing. Bypassing check.');
        return true;
    }
    if (!signatureHeader) return false;

    const signatureHash = signatureHeader.split('=')[1];
    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

    return signatureHash === expectedHash;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ [ChatBiz Webhook]: Handshake verification successful.');
            return new Response(String(challenge), {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }
        return new Response('Forbidden Verification Token Mismatch', { status: 403 });
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const rawBodyText = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256') || '';

        if (!verifyMetaWebhookSignature(rawBodyText, signatureHeader)) {
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

        // 1. Fetch Session & User with safe destructuring
        const sessionResult = await getOrCreateSession(cleanPhoneNumber);
        const session = sessionResult?.session || { active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' };
        const user = sessionResult?.user || { first_name: 'WhatsApp', last_name: 'User', title: null };

        // 2. Extract Message Content
        let userMessage = '';
        let selectedButtonId = null;

        if (messageNode.type === 'text') {
            userMessage = (messageNode.text?.body || '').trim();
        } else if (messageNode.type === 'interactive') {
            selectedButtonId = messageNode.interactive?.button_reply?.id;
            userMessage = messageNode.interactive?.button_reply?.title || '';
        }

        const firstNameDisplay = user.first_name || 'User';
        console.log(`\n📬 [Ingress] User: ${cleanPhoneNumber} (${firstNameDisplay}) | Step: ${session.current_step} | Input: "${userMessage}"`);

        // 3. Handle Button Selections
        if (selectedButtonId) {
            if (selectedButtonId === 'BTN_BUY_FIND') {
                await updateSession(session.id, { currentStep: 'SEARCH_SERVICES', activeMode: 'CUSTOMER_MODE' });
                await sendMetaWhatsappMessage(
                    businessPhoneNumberId,
                    cleanPhoneNumber,
                    `🔍 *Find Services & Products*\n\nTell me what you're looking for (e.g., "I need a plumber in Soweto" or "Want to order kota").`
                );
                return NextResponse.json({ success: true }, { status: 200 });
            }

            if (selectedButtonId === 'BTN_MERCHANT_PORTAL') {
                await updateSession(session.id, { currentStep: 'MERCHANT_PORTAL', activeMode: 'MERCHANT_MODE' });
                const merchantMenu = buildInteractiveButtons(
                    "🏪 Merchant Dashboard",
                    `Welcome to your business hub, ${firstNameDisplay}.\n\nSelect an option below:`,
                    [
                        { id: 'BTN_MY_ORDERS', title: '📋 My Orders' },
                        { id: 'BTN_WALLET', title: '🪙 Token Wallet' },
                        { id: 'BTN_SWITCH_CUSTOMER', title: '🛒 Back to Shop' }
                    ]
                );
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, merchantMenu);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            if (selectedButtonId === 'BTN_SWITCH_CUSTOMER') {
                await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE' });
            }
        }

        // 4. AI Intent Parsing for free-text messages
        const aiResult = await parseUserIntent(userMessage);

        // 5. Main Menu Handler with Personalization
        if (session.current_step === 'MAIN_MENU' || aiResult.intent === 'NAVIGATE_MENU') {
            const isRegisteredUser = user.first_name && user.first_name !== 'WhatsApp';
            const userTitle = user.title ? `${user.title} ` : '';
            const greetingName = isRegisteredUser ? `${userTitle}${user.first_name}` : 'Friend';

            const headerText = `Welcome to ChatBiz 🇿🇦`;
            const bodyText = `Sawubona / Hello ${greetingName}!\n\n` +
                `📱 *Account:* +${cleanPhoneNumber}\n` +
                `⚙️ *Mode:* ${session.active_mode === 'MERCHANT_MODE' ? 'Merchant 🏪' : 'Customer 🛒'}\n\n` +
                `How can we help you today? Choose an option below:`;

            const mainMenu = buildInteractiveButtons(
                headerText,
                bodyText,
                [
                    { id: 'BTN_BUY_FIND', title: '🔍 Find Services' },
                    { id: 'BTN_MERCHANT_PORTAL', title: '🏪 Business Portal' }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, mainMenu);
            return NextResponse.json({ success: true, status: 'MAIN_MENU_SENT' }, { status: 200 });
        }

        // 6. Search Handler
        if (session.current_step === 'SEARCH_SERVICES') {
            const reply = `🤖 *AI Understanding:* Intent: *${aiResult.intent}* | Category: *${aiResult.category || 'General'}*\nKeywords: ${aiResult.extracted_keywords.join(', ') || 'None'}\n\nSearching nearby providers...`;

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, reply);
            return NextResponse.json({ success: true, status: 'SEARCH_PROCESSED' }, { status: 200 });
        }

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Pipeline Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}