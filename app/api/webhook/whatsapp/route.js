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

        // 1. Fetch Session & User Profile
        const sessionResult = await getOrCreateSession(cleanPhoneNumber);
        const session = sessionResult?.session || { active_mode: 'CUSTOMER_MODE', current_step: 'MAIN_MENU' };
        const user = sessionResult?.user || { first_name: 'WhatsApp', last_name: 'User', title: null };

        // 2. Extract Message Input
        let userMessage = '';
        let selectedButtonId = null;

        if (messageNode.type === 'text') {
            userMessage = (messageNode.text?.body || '').trim();
        } else if (messageNode.type === 'interactive') {
            selectedButtonId = messageNode.interactive?.button_reply?.id || messageNode.interactive?.list_reply?.id;
            userMessage = messageNode.interactive?.button_reply?.title || messageNode.interactive?.list_reply?.title || '';
        }

        const firstNameDisplay = user.first_name || 'User';
        console.log(`\n📬 [Ingress] User: ${cleanPhoneNumber} (${firstNameDisplay}) | Step: ${session.current_step} | Input: "${userMessage}"`);

        // 3. Handle Business Portal Selection Trigger
        if (selectedButtonId === 'BTN_MERCHANT_PORTAL' || userMessage.toLowerCase() === 'business portal') {
            await updateSession(session.id, { currentStep: 'BUSINESS_SELECTION', activeMode: 'MERCHANT_MODE' });

            const businesses = await getUserBusinesses(user.id);
            const userBusinessCount = businesses.length;
            const MAX_BUSINESSES = 5;

            // Scenario A: User has 0 businesses registered
            if (userBusinessCount === 0) {
                const noBizPayload = buildInteractiveButtons(
                    "🏪 Business Portal",
                    `Hello ${firstNameDisplay}, you don't have any registered businesses yet.\n\nYou can register up to 5 businesses on ChatBiz!`,
                    [
                        { id: 'BTN_CREATE_BUSINESS', title: '➕ Register Business' },
                        { id: 'BTN_MAIN_MENU', title: '⬅️ Main Menu' }
                    ]
                );
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, noBizPayload);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // Scenario B: User has 1 or 2 businesses (Use standard buttons <= 3 total actions)
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
                    `Welcome ${firstNameDisplay}!\nSelect a business to manage (${userBusinessCount}/${MAX_BUSINESSES}):`,
                    buttons
                );

                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, bizMenuPayload);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // Scenario C: User has 3 to 5 businesses (Use Interactive Section List)
            const listRows = businesses.map((biz) => ({
                id: `BTN_SELECT_BIZ_${biz.id}`,
                title: biz.business_name,
                description: `Category: ${biz.business_class.replace('_', ' ')}`
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
                `Welcome ${firstNameDisplay}!\nYou have ${userBusinessCount}/${MAX_BUSINESSES} registered businesses. Select an option below:`,
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

        // 4. Handle Specific Business Selection
        if (selectedButtonId && selectedButtonId.startsWith('BTN_SELECT_BIZ_')) {
            const selectedBizId = selectedButtonId.replace('BTN_SELECT_BIZ_', '');

            await updateSession(session.id, {
                currentStep: 'MERCHANT_DASHBOARD',
                activeMode: 'MERCHANT_MODE',
                activeBusinessId: parseInt(selectedBizId, 10)
            });

            const dashboardMenu = buildInteractiveButtons(
                "🏪 Business Dashboard",
                `Business ID #${selectedBizId} Active.\n\nWhat would you like to manage?`,
                [
                    { id: 'BTN_MY_ORDERS', title: '📋 My Orders' },
                    { id: 'BTN_WALLET', title: '🪙 Token Wallet' },
                    { id: 'BTN_MERCHANT_PORTAL', title: '⬅️ Switch Business' }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, dashboardMenu);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // 5. Handle "➕ Register Business" Button
        if (selectedButtonId === 'BTN_CREATE_BUSINESS') {
            const businesses = await getUserBusinesses(user.id);

            if (businesses.length >= 5) {
                await sendMetaWhatsappMessage(
                    businessPhoneNumberId,
                    cleanPhoneNumber,
                    `🚫 *Limit Reached*\n\nYou have reached the maximum limit of 5 registered businesses.`
                );
                return NextResponse.json({ success: true }, { status: 200 });
            }

            await updateSession(session.id, { currentStep: 'REGISTER_BIZ_NAME', activeMode: 'MERCHANT_MODE' });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (1/3)*\n\nPlease type the *official name* of your business (e.g., "Soweto Fast Kasi Bites").\n\n💡 _Type *menu* to cancel._`
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // 6. Handle Main Menu Actions & Explicit Keywords
        const isMenuTrigger = ['menu', 'hi', 'hello', 'start', 'reset', 'main menu'].includes(userMessage.toLowerCase()) || selectedButtonId === 'BTN_MAIN_MENU' || selectedButtonId === 'BTN_SWITCH_CUSTOMER';

        const aiResult = await parseUserIntent(userMessage);

        if (session.current_step === 'MAIN_MENU' || aiResult.intent === 'NAVIGATE_MENU' || isMenuTrigger) {
            if (session.id && session.current_step !== 'MAIN_MENU') {
                await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE', activeBusinessId: null });
            }

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

        return NextResponse.json({ success: true, status: 'EVENT_PROCESSED' }, { status: 200 });

    } catch (err) {
        console.error('🚨 ChatBiz Webhook Pipeline Error:', err.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}