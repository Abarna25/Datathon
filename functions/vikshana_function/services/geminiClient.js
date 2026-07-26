const { GoogleGenAI } = require('@google/genai');


/**
 * Strips internal reasoning / chain-of-thought from the model's raw output.
 */
function stripReasoning(text) {
    if (!text) return text;

    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<\|thinking\|>[\s\S]*?<\|\/thinking\|>/gi, '');
    
    return cleaned.trim();
}

class GeminiClient {
    constructor() {
        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.apiKey = process.env.GEMINI_API_KEY;
        if (this.apiKey) {
             this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        }
    }

    async generate(messages, options = {}) {
        const {
            temperature = 0.1,
            maxTokens = 8192,
            retries = 3
        } = options;

        if (!this.apiKey) {
            throw new Error('[GeminiClient] Missing GEMINI_API_KEY. Cannot generate content.');
        }

        if (!this.ai) {
             this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        }

        let attempt = 0;
        let lastError = null;

        let systemInstruction = undefined;
        let contents = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content || " " }]
                });
            }
        }

        const generateConfig = {
            temperature,
            maxOutputTokens: maxTokens
        };
        if (systemInstruction) {
             generateConfig.systemInstruction = systemInstruction;
        }
        
        while (attempt < retries) {
            try {
                const response = await this.ai.models.generateContent({
                    model: this.model,
                    contents: contents,
                    config: generateConfig
                });

                const rawContent = response.text || "";

                return {
                    content: stripReasoning(rawContent),
                    finish_reason: 'stop'
                };

            } catch (error) {
                attempt++;
                lastError = error;
                console.warn(`[GeminiClient] Attempt ${attempt} failed:`, error.message);
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                }
            }
        }

        throw new Error(`[GeminiClient] API Call Failed after ${retries} attempts. ${lastError?.message}`);
    }
    
    async stream(messages, options = {}) {
         const {
            temperature = 0.1,
            maxTokens = 8192,
        } = options;
        
        if (!this.apiKey) {
            throw new Error('[GeminiClient] Missing GEMINI_API_KEY. Cannot stream content.');
        }
        
        if (!this.ai) {
             this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        }
        
        let systemInstruction = undefined;
        let contents = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content || " " }]
                });
            }
        }
        
        const generateConfig = {
            temperature,
            maxOutputTokens: maxTokens
        };
        if (systemInstruction) {
             generateConfig.systemInstruction = systemInstruction;
        }
        
        return await this.ai.models.generateContentStream({
            model: this.model,
            contents: contents,
            config: generateConfig
        });
    }
}

const client = new GeminiClient();
module.exports = client;
