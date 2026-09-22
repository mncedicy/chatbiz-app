// app/api/webhook/whatsapp/business/registration/step7_8.js
import pool from '@/lib/db';
import { sendMetaWhatsappMessage } from '../../metaClient';
import { updateSession } from '@/app/api/webhook/whatsapp/sessionEngine';

export async function handleStep7And8(params) {
    const { session, userMessage, businessPhoneNumberId, cleanPhoneNumber, user } = params;

    // STEP 7/8: Street -> Prompt for AI Description (8/8)
    if (session.current_step === 'REG_7_STREET') {
        const streetInput = userMessage.trim();
        if (!streetInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a valid street address.`);
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_8_DESC',
            metadata: { ...session.cached_metadata, pending_street: streetInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `📝 *Business Registration (8/8)*\n\n🤖 *Why AI Description Matters*\nWhen local customers search using custom phrases, our AI searches this text to match your business directly!\n\n*Please type a short description of what you offer:*\n_Example: "We sell authentic quarter-loaf kotas, Russian chips, and soft drinks with fast local township delivery."_`
        );
        return true;
    }

    // STEP 8/8: Capture Description -> Save to DB
    if (session.current_step === 'REG_8_DESC') {
        const descInput = userMessage.trim();
        if (!descInput) {
            await sendMetaWhatsappMessage(businessPhoneNumberId, cleanPhoneNumber, `⚠️ Please type a short description for your business.`);
            return true;
        }

        const meta = session.cached_metadata || {};
        const bizName = meta.pending_business_name || 'My Business';
        const bizClass = meta.pending_business_class || 'VOLUME_RETAIL';
        const bizType = meta.pending_business_type || 'General';
        const province = meta.pending_province || 'Gauteng';
        const city = meta.pending_city || 'Johannesburg';
        const suburb = meta.pending_suburb || 'Central';
        const street = meta.pending_street || '';

        const combinedAddress = `${street}, ${suburb}, ${city}, ${province}`;
        const cityRegion = `${province} - ${city}`;

        let createdBizId = null;
        if (user.id) {
            const insertRes = await pool.query(
                `INSERT INTO merchant_profiles (
                    user_id, business_name, business_class, business_type, business_desc,
                    province, city, suburb, street_address, full_physical_address,
                    city_region, geographic_coordinates
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326))
                RETURNING id`,
                [user.id, bizName, bizClass, bizType, descInput, province, city, suburb, street, combinedAddress, cityRegion]
            );
            createdBizId = insertRes.rows[0]?.id;
        }

        await updateSession(session.id, {
            currentStep: 'MAIN_MENU',
            activeMode: 'MERCHANT_MODE',
            activeBusinessId: createdBizId,
            metadata: {}
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId, cleanPhoneNumber,
            `🎉 *Business Registered Successfully!*\n\n🏢 *Name:* ${bizName}\n⚙️ *Class:* \`${bizClass}\`\n🏷️ *Type:* ${bizType}\n📝 *Description:* _"${descInput}"_\n📍 *Address:* ${combinedAddress}\n\nType *menu* to open your dashboard.`
        );
        return true;
    }

    return false;
}