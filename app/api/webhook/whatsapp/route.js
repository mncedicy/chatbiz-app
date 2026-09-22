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
    if (!APP_SECRET) return true;
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
            return new Response(String(challenge), {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }
        return new Response('Forbidden', { status: 403 });
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

        // 1. Fetch Session & User Profile
        const sessionResult = await getOrCreateSession(cleanPhoneNumber);
        const session = sessionResult?.session || { active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' };
        const user = sessionResult?.user || { first_name: 'WhatsApp', last_name: 'User', title: null };

        // 2. Extract Message Content
        let userMessage = '';
        let selectedButtonId = null;

        if (messageNode.type === 'text') {
            userMessage = (messageNode.text?.body || '').trim();
        } else if (messageNode.type === 'interactive') {
            selectedButtonId = messageNode.interactive?.button_reply?.id || messageNode.interactive?.list_reply?.id;
            userMessage = messageNode.interactive?.button_reply?.title || messageNode.interactive?.list_reply?.title || '';
        }

        console.log(`📬 [Ingress] Step: ${session.current_step} | Input: "${userMessage}"`);

        // Global Cancel Command
        if (userMessage.toLowerCase() === 'menu' || selectedButtonId === 'BTN_MAIN_MENU') {
            await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE' });
            const mainMenu = buildInteractiveButtons(
                `Welcome to ChatBiz 🇿🇦`,
                `How can we help you today?`,
                [
                    { id: 'BTN_BUY_FIND', title: '🔍 Find Services' },
                    { id: 'BTN_MERCHANT_PORTAL', title: '🏪 Business Portal' }
                ]
            );
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, mainMenu);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP HANDLER 1: Capture Business Name (Fixes "no response" for "stims")
        // =========================================================================
        if (session.current_step === 'REGISTER_BIZ_NAME') {
            const businessNameInput = userMessage.trim();

            if (!businessNameInput) {
                await sendMetaWhatsappMessage(
                    businessPhoneNumberId,
                    cleanPhoneNumber,
                    `⚠️ Please type a valid business name.`
                );
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // Save business name and update step to Category (2/3)
            await updateSession(session.id, {
                currentStep: 'REGISTER_BIZ_CATEGORY',
                metadata: { ...session.cached_metadata, pending_business_name: businessNameInput }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `✅ Business Name set to: *${businessNameInput}*\n\n` +
                `📝 *Business Registration (2/3)*\n\n` +
                `What service or product does your business provide? (e.g., "Fast Food & Catering" or "Plumbing Services")`
            );

            return NextResponse.json({ success: true, status: 'BIZ_NAME_SAVED' }, { status: 200 });
        }

        // =========================================================================
        // STEP HANDLER 2: Capture Business Category
        // =========================================================================
        if (session.current_step === 'REGISTER_BIZ_CATEGORY') {
            const categoryInput = userMessage.trim();
            const bizName = session.cached_metadata?.pending_business_name || 'My Business';

            await updateSession(session.id, {
                currentStep: 'MAIN_MENU',
                metadata: { ...session.cached_metadata, pending_category: categoryInput }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `🎉 *Business Registered Successfully!*\n\n` +
                `🏢 *Name:* ${bizName}\n` +
                `🏷️ *Category:* ${categoryInput}\n\n` +
                `Type *menu* to access your dashboard.`
            );

            return NextResponse.json({ success: true, status: 'BIZ_REGISTRATION_COMPLETE' }, { status: 200 });
        }

        // =========================================================================
        // Fallback Intent Parser for general browsing
        // =========================================================================
        const aiResult = await parseUserIntent(userMessage);

        if (session.current_step === 'MAIN_MENU' || aiResult.intent === 'NAVIGATE_MENU') {
            const mainMenu = buildInteractiveButtons(
                `Welcome to ChatBiz 🇿🇦`,
                `How can we help you today?`,
                [
                    { id: 'BTN_BUY_FIND', title: '🔍 Find Services' },
                    { id: 'BTN_MERCHANT_PORTAL', title: '🏪 Business Portal' }
                ]
            );
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, mainMenu);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}