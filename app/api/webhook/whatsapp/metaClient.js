// File Location: app/api/webhook/whatsapp/metaClient.js

/**
 * Universal outbound utility to transmit authenticated messages, lists, and button menus to the Meta Cloud API
 * @param {string} businessPhoneNumberId - Meta's identifier tracking which bot number is sending the message
 * @param {string} recipientPhone - The target user's mobile number (e.g., 27821234567)
 * @param {string} messageText - The raw body text string to send back to the chat thread
 */
export async function sendMetaWhatsappMessage(businessPhoneNumberId, recipientPhone, messageText) {
    // UPDATED: Dynamically tracking the newly specified v22.0 Graph API endpoint channel paths
    const url = `https://graph.facebook.com/v22.0/${businessPhoneNumberId}/messages`;

    // Grabs token directly from your Vercel Project Settings for secure authorization configurations
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!token) {
        console.error('🚨 [Meta API Egress Fault]: WHATSAPP_ACCESS_TOKEN is not defined inside server variables.');
        return false;
    }

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

        console.log(`🚀 [Egress Engine]: Message safely transmitted back via v22.0 to user: ${recipientPhone}`);
        return true;
    } catch (error) {
        console.error('❌ [Egress Fatal Exception]: Failed to connect to Meta Graph API:', error);
        return false;
    }
}
