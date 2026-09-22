// app\api\webhook\whatsapp\aiParser.js

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the primary intent and dialect parser for ChatBiz, a South African WhatsApp marketplace.
Users will send messages in South African English, isiZulu, Sesotho, Afrikaans, Tsotsitaal, or mixed code-switched text.

Examples of slang & dialect handling:
- "Eita bra, need a plumber in Soweto" -> SEARCH_SERVICE (High Ticket)
- "Sharp fede, order kota in Alex" -> ORDER_FOOD (Volume Retail)
- "Sawubona, ngicela imenu" -> NAVIGATE_MENU
- "Hoe gaan dit, I need a stretch tent" -> BOOK_EVENT (Event Infrastructure)

Valid Categories:
- VOLUME_RETAIL (Food, groceries, gas, fast items)
- HIGH_TICKET_LEAD (Plumbers, electricians, bakkie hire, mechanics, salon appointments)
- EVENT_INFRASTRUCTURE (Stretch tents, mobile fridges, sound systems, VIP toilets)
- MENU_NAVIGATION (Greeting, help, asking for menu, reset)

Output strictly adhering to the JSON schema.`;

function localKeywordFallback(text) {
    const clean = text.toLowerCase().trim();
    if (['menu', 'hi', 'hello', 'start', 'reset', 'main menu', 'sawubona', 'eita', 'hozek', 'shap'].some(w => clean.includes(w))) {
        return { intent: 'NAVIGATE_MENU', category: null, extracted_keywords: [], language_detected: 'mixed', confidence: 0.9 };
    }
    if (['buy', 'find', 'plumber', 'kota', 'electrician', 'service', 'food', 'order', 'looking for'].some(w => clean.includes(w))) {
        return { intent: 'SEARCH_SERVICE', category: 'VOLUME_RETAIL', extracted_keywords: [clean], language_detected: 'mixed', confidence: 0.7 };
    }
    return { intent: 'UNKNOWN', category: null, extracted_keywords: [], language_detected: 'en', confidence: 0.3 };
}

export async function parseUserIntent(incomingMessage) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ [AI Parser]: GEMINI_API_KEY missing. Using fallback parser.');
        return localKeywordFallback(incomingMessage);
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: incomingMessage,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: {
                            type: Type.STRING,
                            enum: ['SEARCH_SERVICE', 'ORDER_FOOD', 'BOOK_EVENT', 'NAVIGATE_MENU', 'UNKNOWN']
                        },
                        category: {
                            type: Type.STRING,
                            nullable: true,
                            enum: ['VOLUME_RETAIL', 'HIGH_TICKET_LEAD', 'EVENT_INFRASTRUCTURE']
                        },
                        extracted_keywords: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        language_detected: { type: Type.STRING },
                        confidence: { type: Type.NUMBER }
                    },
                    required: ['intent', 'extracted_keywords', 'language_detected', 'confidence']
                },
                temperature: 0.1
            }
        });

        const parsed = JSON.parse(response.text);
        console.log(`🧠 [Gemini SA-Aware Parser Output]:`, parsed);
        return parsed;
    } catch (error) {
        console.warn('⚠️ [Gemini API Exception]: Falling back to local rules.', error.message);
        return localKeywordFallback(incomingMessage);
    }
}