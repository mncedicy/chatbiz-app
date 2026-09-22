// app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import { verifyMetaWebhookSignature } from './utils/auth';
import { handleMerchantPortal } from './business/portal';
import { handleRegistrationSteps } from './business/registration';
import { sendMainMenu } from './navigation/menu';
import { getOrCreateSession, updateSession } from '@/lib/sessionEngine';
import { sendMetaWhatsappMessage } from './metaClient';
import { parseUserIntent } from '@/lib/aiParser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ChatBiz_Secret_Secure_Token_2026";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
            return new Response(String(searchParams.get('hub.challenge')), {
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
        const cleanPhoneNumber = String(messageNode.from || '').trim();
        const businessPhoneNumberId = valueBlock.metadata?.phone_number_id;

        const sessionResult = await getOrCreateSession(cleanPhoneNumber);
        const session = sessionResult?.session || { active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' };
        const user = sessionResult?.user || { first_name: 'WhatsApp', last_name: 'User', title: null };

        let userMessage = '';
        let selectedButtonId = null;

        if (messageNode.type === 'text') {
            userMessage = (messageNode.text?.body || '').trim();
        } else if (messageNode.type === 'interactive') {
            selectedButtonId = messageNode.interactive?.button_reply?.id || messageNode.interactive?.list_reply?.id;
            userMessage = messageNode.interactive?.button_reply?.title || messageNode.interactive?.list_reply?.title || '';
        }

        const handlerParams = { session, user, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber };

        // Global Reset Command
        if (userMessage.toLowerCase() === 'menu' || selectedButtonId === 'BTN_MAIN_MENU') {
            await sendMainMenu(handlerParams);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Business Portal Handler
        if (selectedButtonId === 'BTN_MERCHANT_PORTAL') {
            await handleMerchantPortal(handlerParams);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Start Business Registration
        if (selectedButtonId === 'BTN_CREATE_BUSINESS') {
            await updateSession(session.id, { currentStep: 'REG_1_NAME', activeMode: 'MERCHANT_MODE', metadata: {} });
            await sendMetaWhatsappMessage(
                businessPhoneNumberId, cleanPhoneNumber,
                `📝 *Business Registration (1/8)*\n\nPlease type the *official name* of your business (e.g., "Soweto Fast Kasi Bites").\n\n💡 _Type *menu* to cancel._`
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Process Ongoing Registration Steps
        if (session.current_step?.startsWith('REG_')) {
            await handleRegistrationSteps(handlerParams);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Default Navigation & Intent Fallback
        const isExplicitMenuTrigger = ['hi', 'hello', 'start', 'reset'].includes(userMessage.toLowerCase());
        const aiResult = await parseUserIntent(userMessage);

        if (session.current_step === 'MAIN_MENU' || aiResult.intent === 'NAVIGATE_MENU' || isExplicitMenuTrigger) {
            await sendMainMenu(handlerParams);
            return NextResponse.json({ success: true, status: 'MAIN_MENU_SENT' }, { status: 200 });
        }

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 Webhook Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}