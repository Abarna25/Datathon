const { GoogleGenAI } = require('@google/genai');

/**
 * Service to extract entities from unstructured police language text.
 * Addresses Requirement #1: Police Language Understanding & Entity Recognition
 */
class EntityExtractionService {
    constructor() {
        // Initialize Gemini client (assumes GEMINI_API_KEY is in environment)
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    /**
     * Extracts structured entities from text (English/Kannada).
     * @param {string} text The raw text (e.g. FIR description or officer note).
     * @returns {Promise<Object>} The extracted entities in JSON format.
     */
    async extractEntities(text) {
        const prompt = `
You are a specialized Criminal Intelligence AI.
Extract the following entities from the provided text, which may contain a mix of English and Kannada police terminology.
If an entity is not present, omit the field.

Entities to extract:
- suspects: Array of objects { name, aliases (array), age, gender, identifiers (e.g., scars, tattoos, phone numbers, IMEI) }
- locations: Array of strings representing exact locations or landmarks.
- vehicles: Array of objects { type, color, registration_number, description }
- weapons: Array of strings
- dates: Array of strings representing dates, times, or temporal ranges
- crime_type: String (e.g., theft, burglary, assault)

Return strictly as a JSON object, with no markdown formatting around it.

Text to analyze:
"${text}"
`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            let jsonText = response.text;
            // Clean up possible markdown code blocks from the response
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Entity Extraction Error:", error);
            throw new Error("Failed to extract entities from text.");
        }
    }
}

module.exports = new EntityExtractionService();
