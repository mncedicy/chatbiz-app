// app/api/webhook/whatsapp/business/registration/step3_4.js
import { sendMetaWhatsappMessage, buildInteractiveList } from '../../metaClient';
import { updateSession } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function handleStep3And4(params) {
    const { session, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber } = params;

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
        return true;
    }

    // STEP 4/8: Province -> Prompt for City (5/8)
    if (session.current_step === 'REG_4_PROVINCE' && selectedButtonId?.startsWith('PROV_')) {
        await updateSession(session.id, {
            currentStep: 'REG_5_CITY',
            metadata: { ...session.cached_metadata, pending_province: userMessage }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (5/8)*\n\nProvince set to: *${userMessage}*\n\nWhat *City / Municipality* do you operate in? (e.g. "Johannesburg", "Pretoria", or "Cape Town")`
        );
        return true;
    }

    return false;
}