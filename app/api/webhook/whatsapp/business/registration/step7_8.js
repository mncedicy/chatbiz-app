// app/api/webhook/whatsapp/business/registration/step7_8.js
import pool from '@/lib/db';
import { sendMetaWhatsappMessage } from '../../metaClient';
import { updateSession } from '../../sessionEngine';

export async function handleStep7And8(params) {
    const { session, userMessage, businessPhoneNumberId, cleanPhoneNumber, user } = params;

    // STEP 7/8: Street Address -> Short Description (8/8)
    if (session.current_step === 'REG_7_STREET') {
        const streetInput = userMessage.trim();
        if (!streetInput) {
            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `⚠️ Please type your street name and house number.`
            );
            return true;
        }

        await updateSession(session.id, {
            currentStep: 'REG_8_DESC',
            metadata: { ...session.cached_metadata, pending_street: streetInput }
        });

        await sendMetaWhatsappMessage(
            businessPhoneNumberId,
            cleanPhoneNumber,
            `📝 *Register Your Business (8/8)*\n\n💡 *Help local customers find you!*\nType a short sentence about what you sell or do.\n\n*Example:* _"We sell fresh kotas, chips, and cold drinks with fast local delivery."_`
        );
        return true;
    }

    // STEP 8/8: Save Business & Finish
    if (session.current_step === 'REG_8_DESC') {
        const descInput = userMessage.trim();
        if (!descInput) {
            await sendMetaWhatsappMessage(
                businessPhoneNumberId,
                cleanPhoneNumber,
                `⚠️ Please write a short sentence about what your business offers.`
            );
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
            businessPhoneNumberId,
            cleanPhoneNumber,
            `🎉 *Your business is registered!*\n\n🏢 *Name:* ${bizName}\n🏷️ *Type:* ${bizType}\n📝 *About:* _"${descInput}"_\n📍 *Address:* ${combinedAddress}\n\nType *menu* to open your dashboard.`
        );
        return true;
    }

    return false;
}