// app/api/webhook/whatsapp/business/registration/step3_4.js
import { sendMetaWhatsappMessage, buildInteractiveList } from '../../metaClient';
import { updateSession } from '../../sessionEngine';

export async function handleStep3And4(params) {
    const { session, userMessage, selectedButtonId, businessPhoneNumberId, cleanPhoneNumber } = params;

    // STEP 3/8: Choose Category -> Choose Province (4/8)
    if (session.current_step === 'REG_3_TYPE' && selectedButtonId?.startsWith('BTYPE_')) {
        const selectedType = userMessage;
        await updateSession(session.id, {
            currentStep: 'REG_4_PROVINCE',
            metadata: { ...session.cached_metadata, pending_business_type: selectedType }
        });

        const provinceListPayload = buildInteractiveList(
            "📝 Register Your Business (4/8)",
            `Category: *${selectedType}*\n\nWhich province is your business in?`,
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

    // STEP 4/8: Choose City (5/8)
    if (session.current_step === 'REG_4_PROVINCE' && selectedButtonId?.startsWith('PROV_')) {
        await updateSession(session.id, {
            currentStep: 'REG_5_CITY',
            metadata: { ...session.cached_metadata, pending_province: userMessage }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Register Your Business (5/8)*\n\nProvince: *${userMessage}*\n\nWhich *City or Town* are you in?\n_(Examples: Johannesburg, Pretoria, Cape Town, Durban)_`
        );
        return true;
    }

    return false;
}