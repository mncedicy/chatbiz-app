// app/api/webhook/whatsapp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
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

        // Global Cancel Command
        if (userMessage.toLowerCase() === 'menu' || selectedButtonId === 'BTN_MAIN_MENU') {
            await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE' });

            const isRegisteredUser = user.first_name && user.first_name !== 'WhatsApp';
            const userTitle = user.title ? `${user.title} ` : '';
            const greetingName = isRegisteredUser ? `${userTitle}${user.first_name}` : 'Friend';

            const mainMenu = buildInteractiveButtons(
                `Welcome to ChatBiz 🇿🇦`,
                `Sawubona / Hello ${greetingName}!\n\n` +
                `📱 *Account:* +${cleanPhoneNumber}\n` +
                `⚙️ *Mode:* Merchant 🏪\n\n` +
                `How can we help you today? Choose an option below:`,
                [
                    { id: 'BTN_BUY_FIND', title: '🔍 Find Services' },
                    { id: 'BTN_MERCHANT_PORTAL', title: '🏪 Business Portal' }
                ]
            );
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, mainMenu);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // 1. BUSINESS PORTAL CLICK HANDLER
        // =========================================================================
        if (selectedButtonId === 'BTN_MERCHANT_PORTAL') {
            await updateSession(session.id, { currentStep: 'BUSINESS_SELECTION', activeMode: 'MERCHANT_MODE' });

            const businesses = await getUserBusinesses(user.id);
            const userBusinessCount = businesses.length;
            const MAX_BUSINESSES = 5;

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
        // START REGISTRATION: BUTTON CLICK -> STEP 1/8
        // =========================================================================
        if (selectedButtonId === 'BTN_CREATE_BUSINESS') {
            await updateSession(session.id, { currentStep: 'REG_1_NAME', activeMode: 'MERCHANT_MODE', metadata: {} });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (1/8)*\n\nPlease type the *official name* of your business (e.g., "Soweto Fast Kasi Bites").\n\n💡 _Type *menu* to cancel._`
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 1/8: Capture Business Name -> Present Business Class (2/8)
        // =========================================================================
        if (session.current_step === 'REG_1_NAME') {
            const businessNameInput = userMessage.trim();

            if (!businessNameInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid business name.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            await updateSession(session.id, {
                currentStep: 'REG_2_CLASS',
                metadata: { ...session.cached_metadata, pending_business_name: businessNameInput }
            });

            const classListPayload = buildInteractiveList(
                "📝 Business Registration (2/8)",
                `Business Name: *${businessNameInput}*\n\nSelect the primary architectural model for your operations:`,
                "Select Model",
                [
                    {
                        title: "Business Class Models",
                        rows: [
                            {
                                id: 'BCLASS_VOLUME_RETAIL',
                                title: '🍗 Volume Retail',
                                description: 'E-commerce cart, item menus, instant checkout'
                            },
                            {
                                id: 'BCLASS_HIGH_TICKET_LEAD',
                                title: '🛠️ High-Ticket Lead',
                                description: 'On-demand dispatch, quotes, milestone billing'
                            },
                            {
                                id: 'BCLASS_EVENT_INFRASTRUCTURE',
                                title: '📅 Event Infrastructure',
                                description: 'Multi-day rental matrix, inventory block allocation'
                            }
                        ]
                    }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, classListPayload);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 2/8: Capture Business Class -> Present Business Type List (3/8)
        // =========================================================================
        if (session.current_step === 'REG_2_CLASS' && selectedButtonId?.startsWith('BCLASS_')) {
            const selectedClass = selectedButtonId.replace('BCLASS_', '');

            await updateSession(session.id, {
                currentStep: 'REG_3_TYPE',
                metadata: { ...session.cached_metadata, pending_business_class: selectedClass }
            });

            let typeRows = [];
            if (selectedClass === 'VOLUME_RETAIL') {
                typeRows = [
                    { id: 'BTYPE_Kitchens', title: '🍳 Kitchens & Fast Food', description: 'Local meals, combos, daily menus' },
                    { id: 'BTYPE_Resellers', title: '🛍️ Resellers & Retail', description: 'Clothing, hair products, accessories' },
                    { id: 'BTYPE_Gas', title: '🔥 LPG Gas Refill', description: 'Gas cylinder delivery & swaps' }
                ];
            } else if (selectedClass === 'HIGH_TICKET_LEAD') {
                typeRows = [
                    { id: 'BTYPE_Plumbers_Electricians', title: '🛠️ Trade Services', description: 'Plumbing, electrical, repairs' },
                    { id: 'BTYPE_Roadside_Tyre', title: '🚗 Roadside & Tyre', description: 'Emergency repairs, towing, breakdown' },
                    { id: 'BTYPE_Bakkie_Hire', title: '🚚 Bakkie & Transport', description: 'Hauling, furniture moves, deliveries' }
                ];
            } else {
                typeRows = [
                    { id: 'BTYPE_Tents_DJs', title: '🎪 Tents & DJ Sound', description: 'Stretch tents, sound systems, staging' },
                    { id: 'BTYPE_Fridges_Toilets', title: '🚽 Mobile Fridges/Toilets', description: 'VIP toilets, mobile cooling trailers' },
                    { id: 'BTYPE_Salons_Daycares', title: '💇 Salons & Bookings', description: 'Appointments, beauty, daycare slots' }
                ];
            }

            const typeListPayload = buildInteractiveList(
                "📝 Business Registration (3/8)",
                `Selected Class: *${selectedClass.replace('_', ' ')}*\n\nChoose the exact business type:`,
                "Select Type",
                [
                    {
                        title: "Business Types",
                        rows: typeRows
                    }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, typeListPayload);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 3/8: Capture Business Type -> Present Province List (4/8)
        // =========================================================================
        if (session.current_step === 'REG_3_TYPE' && selectedButtonId?.startsWith('BTYPE_')) {
            const selectedType = userMessage;

            await updateSession(session.id, {
                currentStep: 'REG_4_PROVINCE',
                metadata: { ...session.cached_metadata, pending_business_type: selectedType }
            });

            const provinceListPayload = buildInteractiveList(
                "📝 Business Registration (4/8)",
                `Business Type set to: *${selectedType}*\n\nSelect your operating Province in South Africa:`,
                "Select Province",
                [
                    {
                        title: "Provinces",
                        rows: [
                            { id: 'PROV_Gauteng', title: 'Gauteng', description: 'Johannesburg, Pretoria, Ekurhuleni' },
                            { id: 'PROV_WesternCape', title: 'Western Cape', description: 'Cape Town, Winelands, Garden Route' },
                            { id: 'PROV_KwaZuluNatal', title: 'KwaZulu-Natal', description: 'Durban, Pietermaritzburg' },
                            { id: 'PROV_EasternCape', title: 'Eastern Cape', description: 'Gqeberha, East London' },
                            { id: 'PROV_FreeState', title: 'Free State', description: 'Bloemfontein, Welkom' },
                            { id: 'PROV_Limpopo', title: 'Limpopo', description: 'Polokwane, Tzaneen' },
                            { id: 'PROV_Mpumalanga', title: 'Mpumalanga', description: 'Mbombela, Witbank' },
                            { id: 'PROV_NorthWest', title: 'North West', description: 'Rustenburg, Mahikeng' },
                            { id: 'PROV_NorthernCape', title: 'Northern Cape', description: 'Kimberley, Upington' }
                        ]
                    }
                ]
            );

            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, provinceListPayload);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 4/8: Capture Province -> Prompt for City (5/8)
        // =========================================================================
        if (session.current_step === 'REG_4_PROVINCE' && selectedButtonId?.startsWith('PROV_')) {
            const selectedProvince = userMessage;

            await updateSession(session.id, {
                currentStep: 'REG_5_CITY',
                metadata: { ...session.cached_metadata, pending_province: selectedProvince }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (5/8)*\n\n` +
                `Province set to: *${selectedProvince}*\n\n` +
                `What *City / Municipality* do you operate in? (e.g. "Johannesburg", "Pretoria", or "Cape Town")`
            );

            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 5/8: Capture City -> Prompt for Suburb (6/8)
        // =========================================================================
        if (session.current_step === 'REG_5_CITY') {
            const cityInput = userMessage.trim();

            if (!cityInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid city name.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            await updateSession(session.id, {
                currentStep: 'REG_6_SUBURB',
                metadata: { ...session.cached_metadata, pending_city: cityInput }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (6/8)*\n\n` +
                `City set to: *${cityInput}*\n\n` +
                `What *Suburb or Township* is your business based in? (e.g. "Soweto", "Sandton", or "Khayelitsha")`
            );

            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 6/8: Capture Suburb -> Prompt for Street (7/8)
        // =========================================================================
        if (session.current_step === 'REG_6_SUBURB') {
            const suburbInput = userMessage.trim();

            if (!suburbInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid suburb or township.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            await updateSession(session.id, {
                currentStep: 'REG_7_STREET',
                metadata: { ...session.cached_metadata, pending_suburb: suburbInput }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (7/8)*\n\n` +
                `Suburb set to: *${suburbInput}*\n\n` +
                `Type your *Street Name and House/Stand Number* (e.g. "1234 Vilakazi Street").`
            );

            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 7/8: Capture Street -> Prompt for AI Business Description (8/8)
        // =========================================================================
        if (session.current_step === 'REG_7_STREET') {
            const streetInput = userMessage.trim();

            if (!streetInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid street address.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            await updateSession(session.id, {
                currentStep: 'REG_8_DESC',
                metadata: { ...session.cached_metadata, pending_street: streetInput }
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `📝 *Business Registration (8/8)*\n\n` +
                `🤖 *Why AI Description Matters*\n` +
                `When local customers search using custom phrases (e.g. *"beef kota with extra cheese"* or *"mobile fridge for hire"*), our AI searches this text to match your business directly!\n\n` +
                `*Please type a summary of what you offer:*\n` +
                `_Example: "We sell authentic quarter-loaf kotas, Russian chips, and soft drinks with fast local township delivery."_`
            );

            return NextResponse.json({ success: true }, { status: 200 });
        }

        // =========================================================================
        // STEP 8/8: Capture Description -> Insert Full Structured Details & Save Record
        // =========================================================================
        if (session.current_step === 'REG_8_DESC') {
            const descInput = userMessage.trim();

            if (!descInput) {
                await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a short description for your business.`);
                return NextResponse.json({ success: true }, { status: 200 });
            }

            const meta = session.cached_metadata || {};
            const bizName = meta.pending_business_name || 'My Business';
            const bizClass = meta.pending_business_class || 'VOLUME_RETAIL';
            const bizType = meta.pending_business_type || 'General';
            const province = meta.pending_province || 'Gauteng';
            const city = meta.pending_city || 'Johannesburg';
            const suburb = meta.pending_suburb || 'Central';
            const street = meta.pending_street || '';

            const combinedAddress = `${street}, ${suburb}, ${city}, ${province}`;
            const cityRegion = `${province} - ${city}`;

            let createdBizId = null;
            if (user.id) {
                const insertRes = await pool.query(
                    `INSERT INTO merchant_profiles (
                        user_id, 
                        business_name, 
                        business_class, 
                        business_type,
                        business_desc,
                        province,
                        city,
                        suburb,
                        street_address,
                        full_physical_address, 
                        city_region, 
                        geographic_coordinates
                    )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326))
                     RETURNING id`,
                    [
                        user.id,
                        bizName,
                        bizClass,
                        bizType,
                        descInput,
                        province,
                        city,
                        suburb,
                        street,
                        combinedAddress,
                        cityRegion
                    ]
                );
                createdBizId = insertRes.rows[0]?.id;
            }

            await updateSession(session.id, {
                currentStep: 'MAIN_MENU',
                activeMode: 'MERCHANT_MODE',
                activeBusinessId: createdBizId,
                metadata: {}
            });

            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `🎉 *Business Registered Successfully!*\n\n` +
                `🏢 *Name:* ${bizName}\n` +
                `⚙️ *Class:* \`${bizClass}\`\n` +
                `🏷️ *Type:* ${bizType}\n` +
                `📝 *Description:* _"${descInput}"_\n` +
                `📍 *Address:* ${combinedAddress}\n\n` +
                `Type *menu* to open your dashboard.`
            );

            return NextResponse.json({ success: true, status: 'BIZ_REGISTRATION_COMPLETE' }, { status: 200 });
        }

        // =========================================================================
        // MAIN MENU & AI PARSER FALLBACK
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