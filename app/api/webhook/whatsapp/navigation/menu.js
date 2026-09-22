// app/api/webhook/whatsapp/navigation/menu.js
import { sendMetaWhatsappMessage, buildInteractiveButtons } from '../metaClient';
import { updateSession } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function sendMainMenu(params) {
    const { session, user, businessPhoneNumberId, cleanPhoneNumber } = params;

    await updateSession(session.id, { currentStep: 'MAIN_MENU', activeMode: 'CUSTOMER_MODE' });

    const isRegisteredUser = user.first_name && user.first_name !== 'WhatsApp';
    const userTitle = user.title ? `${user.title} ` : '';
    const greetingName = isRegisteredUser ? `${userTitle}${user.first_name}` : 'Friend';

    const mainMenu = buildInteractiveButtons(
        `Welcome to ChatBiz 🇿🇦`,
        `Sawubona / Hello ${greetingName}!\n\n📱 *Account:* +${cleanPhoneNumber}\n⚙️ *Mode:* Merchant 🏪\n\nHow can we help you today? Choose an option below:`,
        [
            { id: 'BTN_BUY_FIND', title: '🔍 Find Services' },
            { id: 'BTN_MERCHANT_PORTAL', title: '🏪 Business Portal' }
        ]
    );

    await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, mainMenu);
}