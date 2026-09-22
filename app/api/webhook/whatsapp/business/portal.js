// app/api/webhook/whatsapp/business/portal.js
import { sendMetaWhatsappMessage, buildInteractiveButtons } from '../metaClient';
import { updateSession, getUserBusinesses } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function handleMerchantPortal(params) {
    const { session, user, businessPhoneNumberId, cleanPhoneNumber } = params;

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
        return;
    }

    const businessListText = businesses
        .map((b, i) => `${i + 1}. *${b.business_name}* (${b.business_class?.replace('_', ' ') || 'General'})`)
        .join('\n');

    const actionButtons = [];
    if (userBusinessCount < MAX_BUSINESSES) {
        actionButtons.push({ id: 'BTN_CREATE_BUSINESS', title: '➕ Register Business' });
    }
    actionButtons.push({ id: 'BTN_MAIN_MENU', title: '⬅️ Main Menu' });

    const unifiedPayload = buildInteractiveButtons(
        "🏪 Your Registered Businesses",
        `You currently have *${userBusinessCount}/${MAX_BUSINESSES}* registered businesses:\n\n${businessListText}`,
        actionButtons
    );

    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, unifiedPayload);
}