// app/api/webhook/whatsapp/business/registration/step5_6.js
import { sendMetaWhatsappMessage } from '../../metaClient';
import { updateSession } from '../../sessionEngine';

export async function handleStep5And6(params) {
    const { session, userMessage, businessPhoneNumberId, cleanPhoneNumber } = params;

    // STEP 5/8: Type Suburb / Township (6/8)
    if (session.current_step === 'REG_5_CITY') {
        const cityInput = userMessage.trim();
        if (!cityInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type the name of your city or town.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_6_SUBURB',
            metadata: { ...session.cached_metadata, pending_city: cityInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Register Your Business (6/8)*\n\nCity: *${cityInput}*\n\nWhich *Suburb or Township* is your business based in?\n_(Examples: Soweto, Sandton, Khayelitsha, Umlazi)_`
        );
        return true;
    }

    // STEP 6/8: Type Street Address (7/8)
    if (session.current_step === 'REG_6_SUBURB') {
        const suburbInput = userMessage.trim();
        if (!suburbInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type your suburb or township name.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_7_STREET',
            metadata: { ...session.cached_metadata, pending_suburb: suburbInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Register Your Business (7/8)*\n\nSuburb: *${suburbInput}*\n\nWhat is your *Street Name and House/Stand Number*?\n_(Example: 1234 Vilakazi Street)_`
        );
        return true;
    }

    return false;
}