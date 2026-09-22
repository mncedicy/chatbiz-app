import pool from '@/lib/db';
import { sendMetaWhatsappMessage, buildInteractiveList } from '../metaClient';
import { updateSession } from '@/lib/sessionEngine';

export async function handleRegistrationSteps(params) {
    const { session, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber, user } = params;

    // STEP 1/8: Capture Business Name -> Present Business Class (2/8)
    if (session.current_step === 'REG_1_NAME') {
        const businessNameInput = userMessage.trim();
        if (!businessNameInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid business name.`);
            return;
        }

        await updateSession(session.id, {
            currentStep: 'REG_2_CLASS',
            metadata: { ...session.cached_metadata, pending_business_name: businessNameInput }
        });

        const classListPayload = buildInteractiveList(
            "📝 Business Registration (2/8)",
            `Business Name: *${businessNameInput}*\n\nSelect the primary architectural model for your operations:`,
            "Select Model",
            [{
                title: "Business Class Models",
                rows: [
                    { id: 'BCLASS_VOLUME_RETAIL', title: '🍗 Volume Retail', description: 'E-commerce cart, item menus, instant checkout' },
                    { id: 'BCLASS_HIGH_TICKET_LEAD', title: '🛠️ High-Ticket Lead', description: 'On-demand dispatch, quotes, milestone billing' },
                    { id: 'BCLASS_EVENT_INFRASTRUCTURE', title: '📅 Event Infrastructure', description: 'Multi-day rental matrix, inventory block allocation' }
                ]
            }]
        );
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, classListPayload);
        return;
    }

    // STEP 2/8: Capture Business Class -> Present Business Type List (3/8)
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
            [{ title: "Business Types", rows: typeRows }]
        );
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, typeListPayload);
        return;
    }

    // STEP 3/8: Capture Business Type -> Present Province List (4/8)
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
            [{
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
            }]
        );
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, provinceListPayload);
        return;
    }

    // STEP 4/8: Province -> City
    if (session.current_step === 'REG_4_PROVINCE' && selectedButtonId?.startsWith('PROV_')) {
        await updateSession(session.id, {
            currentStep: 'REG_5_CITY',
            metadata: { ...session.cached_metadata, pending_province: userMessage }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (5/8)*\n\nProvince set to: *${userMessage}*\n\nWhat *City / Municipality* do you operate in? (e.g. "Johannesburg", "Pretoria", or "Cape Town")`
        );
        return;
    }

    // STEP 5/8: City -> Suburb
    if (session.current_step === 'REG_5_CITY') {
        const cityInput = userMessage.trim();
        if (!cityInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid city name.`);
            return;
        }

        await updateSession(session.id, {
            currentStep: 'REG_6_SUBURB',
            metadata: { ...session.cached_metadata, pending_city: cityInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (6/8)*\n\nCity set to: *${cityInput}*\n\nWhat *Suburb or Township* is your business based in? (e.g. "Soweto", "Sandton", or "Khayelitsha")`
        );
        return;
    }

    // STEP 6/8: Suburb -> Street
    if (session.current_step === 'REG_6_SUBURB') {
        const suburbInput = userMessage.trim();
        if (!suburbInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid suburb or township.`);
            return;
        }

        await updateSession(session.id, {
            currentStep: 'REG_7_STREET',
            metadata: { ...session.cached_metadata, pending_suburb: suburbInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (7/8)*\n\nSuburb set to: *${suburbInput}*\n\nType your *Street Name and House/Stand Number* (e.g. "1234 Vilakazi Street").`
        );
        return;
    }

    // STEP 7/8: Street -> Description
    if (session.current_step === 'REG_7_STREET') {
        const streetInput = userMessage.trim();
        if (!streetInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid street address.`);
            return;
        }

        await updateSession(session.id, {
            currentStep: 'REG_8_DESC',
            metadata: { ...session.cached_metadata, pending_street: streetInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (8/8)*\n\n🤖 *Why AI Description Matters*\nWhen local customers search using custom phrases, our AI searches this text to match your business directly!\n\n*Please type a short description of what you offer:*\n_Example: "We sell authentic quarter-loaf kotas, Russian chips, and soft drinks with fast local township delivery."_`
        );
        return;
    }

    // STEP 8/8: Save to Database
    if (session.current_step === 'REG_8_DESC') {
        const descInput = userMessage.trim();
        if (!descInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a short description for your business.`);
            return;
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
                    user_id, business_name, business_class, business_type, business_desc,
                    province, city, suburb, street_address, full_physical_address,
                    city_region, geographic_coordinates
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326))
                RETURNING id`,
                [user.id, bizName, bizClass, bizType, descInput, province, city, suburb, street, combinedAddress, cityRegion]
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
            businessPhoneNumberId, cleanPhoneNumber,
            `🎉 *Business Registered Successfully!*\n\n🏢 *Name:* ${bizName}\n⚙️ *Class:* \`${bizClass}\`\n🏷️ *Type:* ${bizType}\n📝 *Description:* _"${descInput}"_\n📍 *Address:* ${combinedAddress}\n\nType *menu* to open your dashboard.`
        );
    }
}