// app/api/webhook/whatsapp/utils/auth.js
import crypto from 'crypto';

const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

export function verifyMetaWebhookSignature(rawBody, signatureHeader) {
    if (!APP_SECRET) return true;
    if (!signatureHeader) return false;

    const signatureHash = signatureHeader.split('=')[1];
    const expectedHash = crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

    return signatureHash === expectedHash;
}