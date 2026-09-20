// File Location: app/api/webhook/whatsapp/metaClient.js

/**
 * Universal outbound utility to transmit authenticated messages to the Meta WhatsApp Cloud API
 * @param {string} businessPhoneNumberId - Meta's identifier tracking which bot number is sending the message
 * @param {string} recipientPhone - The target user's mobile number (e.g., 27821234567)
 * @param {string} messageText - The raw body text string to send
 */
export async function sendMetaWhatsappMessage(businessPhoneNumberId, recipientPhone, messageText) {
    const url = `https://facebook.com{businessPhoneNumberId}/messages`;

    // HARDCODED TESTING TOKEN (Matching your active development sandbox setup)
    const token = "EAAMwAnscw50BO0ZBf5u9fO0fPZAnlEIsHIZBNZCpOQG1tKveZBt88390mZCoY886RzUof2wNnZA4F6ZB86L1hZBnN4gA8gY75p2f22b2b2b2b2b2b2b"; // Your exact copied access token

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: { body: messageText }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ [Meta API Egress Error]: Status ${response.status}`, data);
            return false;
        }

        console.log(`🚀 [Egress Engine]: Message safely transmitted back to user: ${recipientPhone}`);
        return true;
    } catch (error) {
        console.error('❌ [Egress Fatal Exception]: Failed to connect to Meta Graph API:', error);
        return false;
    }
}
