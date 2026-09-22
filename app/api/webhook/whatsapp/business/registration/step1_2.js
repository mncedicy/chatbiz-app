// app/api/webhook/whatsapp/business/registration/step1_2.js
import { sendMetaWhatsappMessage, buildInteractiveList } from '../../metaClient';
import { updateSession } from '../../sessionEngine';

export async function handleStep1And2(params) {
    const { session, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber } = params;

    // STEP 1/8: Business Name -> Choose How You Sell (2/8)
    if (session.current_step === 'REG_1_NAME') {
        const businessNameInput = userMessage.trim();
        if (!businessNameInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid business name.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_2_CLASS',
            metadata: { ...session.cached_metadata, pending_business_name: businessNameInput }
        });

        const classListPayload = buildInteractiveList(
            "📝 Register Your Business (2/8)",
            `Business Name: *${businessNameInput}*\n\nHow do you sell your products or services?`,
            "Choose Model",
            [{
                title: "Business Types",
                rows: [
                    { id: 'BCLASS_VOLUME_RETAIL', title: '🛍️ Shop & Quick Orders', description: 'Food menus, online shop, fast sales' },
                    { id: 'BCLASS_HIGH_TICKET_LEAD', title: '🛠️ Service & Bookings', description: 'Repairs, quotes, call-outs, hiring' },
                    { id: 'BCLASS_EVENT_INFRASTRUCTURE', title: '📅 Event Rentals', description: 'Tent hire, sound systems, party gear' }
                ]
            }]
        );
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, classListPayload);
        return true;
    }

    // STEP 2/8: Choose Category (3/8)
    if (session.current_step === 'REG_2_CLASS' && selectedButtonId?.startsWith('BCLASS_')) {
        const selectedClass = selectedButtonId.replace('BCLASS_', '');
        await updateSession(session.id, {
            currentStep: 'REG_3_TYPE',
            metadata: { ...session.cached_metadata, pending_business_class: selectedClass }
        });

        let typeRows = [];
        if (selectedClass === 'VOLUME_RETAIL') {
            typeRows = [
                { id: 'BTYPE_Kitchens', title: '🍳 Food & Fast Food', description: 'Meals, takeaway, daily food menus' },
                { id: 'BTYPE_Resellers', title: '🛍️ Clothes & Retail', description: 'Clothing, hair, beauty products, shops' },
                { id: 'BTYPE_Gas', title: '🔥 LPG Gas Refill', description: 'Gas cylinder delivery and refills' }
            ];
        } else if (selectedClass === 'HIGH_TICKET_LEAD') {
            typeRows = [
                { id: 'BTYPE_Plumbers_Electricians', title: '🛠️ Handyman & Repairs', description: 'Plumbing, electrical, fixing home items' },
                { id: 'BTYPE_Roadside_Tyre', title: '🚗 Breakdown & Tyres', description: 'Tyre repairs, towing, roadside help' },
                { id: 'BTYPE_Bakkie_Hire', title: '🚚 Bakkie & Transport', description: 'Deliveries, moving furniture, transport' }
            ];
        } else {
            typeRows = [
                { id: 'BTYPE_Tents_DJs', title: '🎪 Tents & DJ Sound', description: 'Stretch tents, sound systems, party gear' },
                { id: 'BTYPE_Fridges_Toilets', title: '🚽 Mobile Toilets & Fridges', description: 'VIP toilets, mobile cooling trailers' },
                { id: 'BTYPE_Salons_Daycares', title: '💇 Hair Salons & Care', description: 'Salon slots, beauty appointments, daycare' }
            ];
        }

        const typeListPayload = buildInteractiveList(
            "📝 Register Your Business (3/8)",
            `Choose the category that fits best:`,
            "Select Category",
            [{ title: "Categories", rows: typeRows }]
        );
        await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, typeListPayload);
        return true;
    }

    return false;
}