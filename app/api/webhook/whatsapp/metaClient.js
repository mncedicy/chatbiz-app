// app/api/webhook/whatsapp/metaClient.js

/**
 * Universal outbound utility to transmit text and interactive payloads to Meta Cloud API v22.0
 */
export async function sendMetaWhatsappMessage(businessPhoneNumberId, recipientPhone, payloadData) {
    const url = `https://graph.facebook.com/v22.0/${businessPhoneNumberId}/messages`;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!token) {
        console.error('🚨 [Meta API Egress Fault]: WHATSAPP_ACCESS_TOKEN is missing.');
        return false;
    }

    const cleanToken = token.trim();

    // Wraps text automatically or transmits raw interactive button payload
    const bodyPayload = typeof payloadData === 'string'
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'text',
            text: { body: payloadData }
        }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            ...payloadData
        };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
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

/**
 * Builder utility for interactive Meta button replies
 */
export function buildInteractiveButtons(headerText, bodyText, buttons) {
    return {
        type: 'interactive',
        interactive: {
            type: 'button',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            action: {
                buttons: buttons.map((btn) => ({
                    type: 'reply',
                    reply: { id: btn.id, title: btn.title }
                }))
            }
        }
    };
}