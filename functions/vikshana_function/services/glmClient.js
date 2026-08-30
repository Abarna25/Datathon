const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Strips internal reasoning / chain-of-thought from the model's raw output.
 * Ensures the reasoning strings don't leak into the final output.
 */
function stripReasoning(text) {
    if (!text) return text;

    const thinkEndIdx = text.toLowerCase().indexOf('</think>');
    if (thinkEndIdx !== -1) {
        text = text.slice(thinkEndIdx + 8);
    }
    const thinkingEndIdx = text.indexOf('<|/thinking|>');
    if (thinkingEndIdx !== -1) {
        text = text.slice(thinkingEndIdx + 13);
    }

    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<\|thinking\|>[\s\S]*?<\|\/thinking\|>/gi, '');
    
    // Quick cleanup of any markdown json formatting that might bleed in
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/```$/, '');

    return cleaned.trim();
}

class GLMClient {
    constructor() {
        this.endpoint = process.env.GLM_ENDPOINT;
        this.model = process.env.GLM_MODEL;
        this.org = process.env.CATALYST_ORG;
        this.apiKey = process.env.GLM_API_KEY || process.env.CATALYST_TOKEN;
    }

    async getFreshAccessToken() {
        return process.env.GLM_API_KEY || process.env.CATALYST_TOKEN;
    }

    async generate(messages, options = {}) {
        const {
            temperature = 0.1,
            maxTokens = 8192,
            tools = undefined,
            tool_choice = undefined,
            retries = 1,
            timeoutMs = 30000
        } = options;

        let currentApiKey = process.env.GLM_API_KEY || process.env.CATALYST_TOKEN;
        try {
            const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
            const tokenMatch = envContent.match(/CATALYST_TOKEN=(.*)/);
            if (tokenMatch && tokenMatch[1]) {
                currentApiKey = tokenMatch[1].trim();
            }
        } catch (err) {
            // ignore
        }

        if (!this.endpoint || !this.model || !currentApiKey) {
            throw new Error('[GLMClient] AI Copilot offline: missing GLM configuration in .env.');
        }

        let attempt = 0;
        let lastError = null;
        
        while (attempt < retries) {
            try {
                const sanitizedMessages = messages.map(m => ({
                    role: m.role,
                    content: m.content || " "
                }));

                const payload = {
                    model: this.model,
                    messages: sanitizedMessages,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    chat_template_kwargs: {
                        enable_thinking: true
                    }
                };

                if (tools && tools.length > 0) {
                    payload.tools = tools;
                    if (tool_choice) payload.tool_choice = tool_choice;
                }

                const response = await axios.post(this.endpoint, payload, {
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${currentApiKey}`,
                        'CATALYST-ORG': this.org || '',
                        'Content-Type': 'application/json'
                    },
                    timeout: timeoutMs
                });

                const choice = response.data?.choices?.[0] || response.data;
                const responseData = choice.message || choice; // Fallback structure for Catalyst QuickML API wrappers
                
                // Extract structured tool calls if the API natively returns them
                const toolCalls = responseData.tool_calls || null;
                const rawContent = responseData.content || (typeof response.data.response === 'string' ? response.data.response : "");

                return {
                    content: stripReasoning(rawContent),
                    tool_calls: toolCalls,
                    finish_reason: choice.finish_reason || 'stop'
                };

            } catch (error) {
                attempt++;
                lastError = error;

                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    throw new Error('[GLMClient] Authentication token expired or invalid (HTTP 401/403).');
                }
                
                if (error.response && (error.response.status === 400 || error.response.status === 404)) {
                    throw new Error(`[GLMClient] Permanent error ${error.response.status}.`);
                }

                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    throw new Error('[GLMClient] Request timed out.');
                }

                if (attempt >= retries) {
                    throw error;
                }
            }
        }

        throw new Error(`[GLMClient] API call failed: ${lastError?.message}`);
    }
}


const client = new GLMClient();
module.exports = client;
