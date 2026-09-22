// app/api/webhook/whatsapp/business/registration/step1_2.js
import { sendMetaWhatsappMessage, buildInteractiveList } from '../../metaClient';
import { updateSession } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function handleStep1And2(params) {
    const { session, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber } = params;

    // STEP 1/8: Capture Business Name -> Present Business Class (2/8)
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
        return true;
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
        return true;
    }

    return false;
}