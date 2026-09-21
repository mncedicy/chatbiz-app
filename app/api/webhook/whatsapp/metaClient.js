// File Location: app/api/webhook/whatsapp/metaClient.js

/**
 * Universal outbound utility to transmit authenticated messages to the Meta Cloud API v22.0
 * @param {string} businessPhoneNumberId - Meta's identifier tracking which bot number is sending the message
 * @param {string} recipientPhone - The target user's mobile number (e.g., 27630117260)
 * @param {string} messageText - The raw body text string to send back to the chat thread
 */
export async function sendMetaWhatsappMessage(businessPhoneNumberId, recipientPhone, messageText) {
    // Retaining v22.0 Graph API endpoint channels exactly as specified
    const url = `https://graph.facebook.com/v22.0/${businessPhoneNumberId}/messages`;

    // Grabs the token variable string out of your secure Vercel environment configurations
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!token) {
        console.error('🚨 [Meta API Egress Fault]: WHATSAPP_ACCESS_TOKEN is completely unassigned in server variables.');
        return false;
    }

    // ============================================================================
    // AUDITING UTILITY: OAUTH TOKEN MASKED STRING LOGGER
    // ============================================================================
    const cleanToken = token.trim();
    const tokenLength = cleanToken.length;
    const startSegment = cleanToken.slice(0, 8);
    const endSegment = cleanToken.slice(-8);

    console.log(`\n🔍 [OAuth Audit Log]: Evaluating server variable metrics...`);
    console.log(`📊 Raw Token String Character Length: ${tokenLength}`);
    console.log(`🔑 Masked Runtime Token Layout: ${startSegment}...[HIDDEN_CHARACTERS]...${endSegment}`);

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
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ [Meta API Egress Error]: Status ${response.status}`, data);
            return false;
        }

        console.log(`🚀 [Egress Engine]: Message safely transmitted via v22.0 to user: ${recipientPhone}`);
        return true;
    } catch (error) {
        console.error('❌ [Egress Fatal Exception]: Failed to connect to Meta Graph API:', error);
        return false;
    }
}
