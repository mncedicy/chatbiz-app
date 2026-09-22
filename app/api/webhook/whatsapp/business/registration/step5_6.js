// app/api/webhook/whatsapp/business/registration/step5_6.js
import { sendMetaWhatsappMessage } from '../../metaClient';
import { updateSession } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function handleStep5And6(params) {
    const { session, userMessage, businessPhoneNumberId, cleanPhoneNumber } = params;

    // STEP 5/8: City -> Prompt for Suburb (6/8)
    if (session.current_step === 'REG_5_CITY') {
        const cityInput = userMessage.trim();
        if (!cityInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid city name.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_6_SUBURB',
            metadata: { ...session.cached_metadata, pending_city: cityInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (6/8)*\n\nCity set to: *${cityInput}*\n\nWhat *Suburb or Township* is your business based in? (e.g. "Soweto", "Sandton", or "Khayelitsha")`
        );
        return true;
    }

    // STEP 6/8: Suburb -> Prompt for Street (7/8)
    if (session.current_step === 'REG_6_SUBURB') {
        const suburbInput = userMessage.trim();
        if (!suburbInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid suburb or township.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_7_STREET',
            metadata: { ...session.cached_metadata, pending_suburb: suburbInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (7/8)*\n\nSuburb set to: *${suburbInput}*\n\nType your *Street Name and House/Stand Number* (e.g. "1234 Vilakazi Street").`
        );
        return true;
    }

    return false;
}