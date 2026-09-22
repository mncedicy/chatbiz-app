// app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendMetaWhatsappMessage, buildInteractiveButtons, buildInteractiveList } from './metaClient';
import { getOrCreateSession, updateSession, getUserBusinesses } from '@/lib/sessionEngine';
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

        console.log(`📬 [Ingress] Step: ${session.current_step} | Input: "${userMessage}" | ButtonID: "${selectedButtonId}"`);

        // =========================================================================
        // 1. BUSINESS PORTAL CLICK HANDLER
        // =========================================================================
        if (selectedButtonId === 'BTN_MERCHANT_PORTAL') {
            await updateSession(session.id, { currentStep: 'BUSINESS_SELECTION', activeMode: 'MERCHANT_MODE' });

            const businesses = await getUserBusinesses(user.id);
            const userBusinessCount = businesses.length;
            const MAX_BUSINESSES = 5;

            // User has 0 businesses
            if (userBusinessCount === 0) {
                const noBizPayload = buildInteractiveButtons(
                    "🏪 Business Portal",
                    `Hello ${user.first_name || 'Friend'}, you don't have any registered businesses yet.\n\nYou can register up to 5 businesses on ChatBiz!`,
                    [
                        { id: 'BTN_CREATE_BUSINESS', title: '➕ Register Business' },
                        { id: 'BTN_MAIN_MENU', title: '⬅️ Main Menu' }
                    ]
                );
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, noBizPayload);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // User has 1 or 2 businesses
            if (userBusinessCount <= 2) {
                const buttons = businesses.map((biz) => ({
                    id: `BTN_SELECT_BIZ_${biz.id}`,
                    title: biz.business_name.length > 20 ? biz.business_name.substring(0, 17) + '...' : biz.business_name
                }));

                if (userBusinessCount < MAX_BUSINESSES) {
                    buttons.push({ id: 'BTN_CREATE_BUSINESS', title: '➕ Register Business' });
                }

                buttons.push({ id: 'BTN_MAIN_MENU', title: '⬅️ Main Menu' });

                const bizMenuPayload = buildInteractiveButtons(
                    "🏪 Business Portal",
                    `Welcome!\nSelect a business to manage (${userBusinessCount}/${MAX_BUSINESSES}):`,
                    buttons
                );

                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, bizMenuPayload);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // User has 3 to 5 businesses (Use Section List)
            const listRows = businesses.map((biz) => ({
                id: `BTN_SELECT_BIZ_${biz.id}`,
                title: biz.business_name,
                description: `Category: ${biz.business_class?.replace('_', ' ') || 'General'}`
            }));

            if (userBusinessCount < MAX_BUSINESSES) {
                listRows.push({
                    id: 'BTN_CREATE_BUSINESS',
                    title: '➕ Register New Business',
                    description: `You have used ${userBusinessCount}/5 slots`
                });
            }

            listRows.push({
                id: 'BTN_MAIN_MENU',
                title: '⬅️ Main Menu',
                description: 'Return to customer portal'
            });

            const bizListPayload = buildInteractiveList(
                "🏪 Business Portal",
                `Welcome!\nYou have ${userBusinessCount}/${MAX_BUSINESSES} registered businesses. Select an option below:`,
                "Select Business",
                [
                    {
                        title: "Your Businesses",
                        rows: listRows
                    }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, bizListPayload);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // 2. REGISTER BIZ STEP 1: Capture Name ("stims")
        // =========================================================================
        if (session.current_step === 'REGISTER_BIZ_NAME' && userMessage.toLowerCase() !== 'menu') {
            const businessNameInput = userMessage.trim();

            if (!businessNameInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid business name.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

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
        // 3. REGISTER BIZ STEP 2: Capture Category
        // =========================================================================
        if (session.current_step === 'REGISTER_BIZ_CATEGORY' && userMessage.toLowerCase() !== 'menu') {
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
                `Type *menu* to return to the main menu.`
            );

            return NextResponse.json({ success: true, status: 'BIZ_REGISTRATION_COMPLETE' }, { status: 200 });
        }

        // =========================================================================
        // 4. REGISTER BUSINESS BUTTON CLICK
        // =========================================================================
        if (selectedButtonId === 'BTN_CREATE_BUSINESS') {
            await updateSession(session.id, { currentStep: 'REGISTER_BIZ_NAME', activeMode: 'MERCHANT_MODE' });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (1/3)*\n\nPlease type the *official name* of your business (e.g., "Soweto Fast Kasi Bites").\n\n💡 _Type *menu* to cancel._`
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // 5. ORIGINAL RESTORED MAIN MENU HANDLER
        // =========================================================================
        const isExplicitMenuTrigger = ['menu', 'hi', 'hello', 'start', 'reset'].includes(userMessage.toLowerCase()) || selectedButtonId === 'BTN_MAIN_MENU';

        const aiResult = await parseUserIntent(userMessage);

        if (session.current_step === 'MAIN_MENU' || aiResult.intent === 'NAVIGATE_MENU' || isExplicitMenuTrigger) {
            await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE' });

            const isRegisteredUser = user.first_name && user.first_name !== 'WhatsApp';
            const userTitle = user.title ? `${user.title} ` : '';
            const greetingName = isRegisteredUser ? `${userTitle}${user.first_name}` : 'Friend';

            const headerText = `Welcome to ChatBiz 🇿🇦`;
            const bodyText = `Sawubona / Hello ${greetingName}!\n\n` +
                `📱 *Account:* +${cleanPhoneNumber}\n` +
                `⚙️ *Mode:* Merchant 🏪\n\n` +
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

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}