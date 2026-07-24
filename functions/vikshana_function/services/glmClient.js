const axios = require('axios');
const path = require('path');
const os = require('os');

function getCliPath() {
    if (process.env.APPDATA) {
        return path.join(process.env.APPDATA, 'npm/node_modules/zcatalyst-cli/lib');
    }
    return path.join(os.homedir(), 'AppData/Roaming/npm/node_modules/zcatalyst-cli/lib');
}

const CLI_TOKEN = 'w_1000.95e87a48b29a5a0ee986da15e6e40675.87e9bd73d2bd93edf26f37229be0985c';

let _cachedToken = null;
let _tokenExpiry = 0;

async function getFreshAccessToken() {
    if (_cachedToken && Date.now() < _tokenExpiry - 60000) {
        return _cachedToken;
    }
    try {
        const cliPath = getCliPath();
        const Credential = require(path.join(cliPath, 'authentication/credential.js')).default;
        Credential.init(CLI_TOKEN);
        const token = await Credential.getAccessToken(true);
        _cachedToken = token;
        _tokenExpiry = Date.now() + 55 * 60 * 1000; // cache for 55 minutes
        return token;
    } catch (e) {
        console.warn('[GLMClient] Could not refresh token from CLI, falling back to env:', e.message);
        return process.env.CATALYST_TOKEN || '';
    }
}

/**
 * Strips internal reasoning / chain-of-thought from the model's raw output.
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

    const lines = cleaned.split('\n');
    const boilerplatePattern = /^(\s*\d+\.\s*(analyze|understand|check|determine|plan|consider|note|evaluate)|^\s+(role|context|current state of evidence|evidence on file|evidence count)[\s:])/i;
    let startIdx = 0;
    for (let i = 0; i < lines.length; i++) {
        if (boilerplatePattern.test(lines[i]) || (i > 0 && /^\s{2,}/.test(lines[i]) && startIdx === 0)) {
            startIdx = i + 1;
        } else if (lines[i].trim() !== '') {
            break;
        }
    }
    cleaned = lines.slice(startIdx).join('\n');

    return cleaned.trim();
}

class GLMClient {
    constructor() {
        this.endpoint = process.env.GLM_ENDPOINT;
        this.model = process.env.GLM_MODEL;
        this.org = process.env.CATALYST_ORG;
    }

    async generate(messages, options = {}) {
        const {
            temperature = 0.7,
            maxTokens = 2048,
            tools = undefined,
            retries = 2,
            timeoutMs = 30000
        } = options;

        if (!this.endpoint || !this.model) {
            console.warn('[GLMClient] GLM_ENDPOINT or GLM_MODEL not configured. Returning graceful offline message.');
            return {
                content: "The AI Copilot is currently operating in offline mode (GLM service unconfigured). Catalyst datastore query features remain active, but advanced AI reasoning is unavailable."
            };
        }

        let attempt = 0;
        let lastError = null;
        
        while (attempt < retries) {
            try {
                const token = await getFreshAccessToken();
                const response = await axios.post(this.endpoint, {
                    model: this.model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    tools: tools
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'CATALYST-ORG': this.org,
                        'Content-Type': 'application/json'
                    },
                    timeout: timeoutMs
                });

                const data = response.data;
                if (!data || !data.response) {
                    throw new Error("Invalid response structure from GLM: " + JSON.stringify(data));
                }

                return { content: stripReasoning(data.response) };

            } catch (error) {
                attempt++;
                lastError = error;
                if (error.response && error.response.status === 401) {
                    _cachedToken = null;
                }
                console.warn(`[GLMClient] Attempt ${attempt} failed:`, error.message);
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, 500 * attempt));
                }
            }
        }

        console.error('[GLMClient] All GLM API attempts failed. Returning graceful error message.');
        return {
            content: "The AI Copilot is currently offline (GLM service returned an error). Catalyst datastore query features remain active, but advanced AI reasoning is unavailable."
        };
    }
}

const client = new GLMClient();
client.getFreshAccessToken = getFreshAccessToken;

module.exports = client;
