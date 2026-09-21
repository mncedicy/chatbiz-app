// lib/aiParser.js
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are the intent parser for ChatBiz, a South African WhatsApp micro-marketplace.
Your job is to analyze user text (which may contain English, isiZulu, Sesotho, Afrikaans, or Tsotsitaal slang) and output strictly valid JSON.

Valid Categories:
- VOLUME_RETAIL (Food, groceries, gas, fast items)
- HIGH_TICKET_LEAD (Plumbers, electricians, bakkie hire, mechanics, salon appointments)
- EVENT_INFRASTRUCTURE (Stretch tents, mobile fridges, sound systems, VIP toilets)
- MENU_NAVIGATION (Greeting, help, asking for menu, reset)

Output JSON Format ONLY:
{
  "intent": "SEARCH_SERVICE" | "ORDER_FOOD" | "BOOK_EVENT" | "NAVIGATE_MENU" | "UNKNOWN",
  "category": "VOLUME_RETAIL" | "HIGH_TICKET_LEAD" | "EVENT_INFRASTRUCTURE" | null,
  "extracted_keywords": ["string"],
  "language_detected": "en" | "zu" | "st" | "af" | "mixed",
  "confidence": number
}`;

export async function parseUserIntent(incomingMessage) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ [AI Parser]: OPENAI_API_KEY is missing. Falling back to default navigation.');
        return { intent: 'NAVIGATE_MENU', category: null, extracted_keywords: [], confidence: 0 };
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 150,
            temperature: 0.1,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: incomingMessage },
            ],
            response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        console.log(`🧠 [AI Parser Output]:`, parsed);
        return parsed;
    } catch (error) {
        console.error('❌ [AI Parser Error]:', error.message);
        return { intent: 'UNKNOWN', category: null, extracted_keywords: [], confidence: 0 };
    }
}