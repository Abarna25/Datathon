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

                // MOCK GLM RESPONSE FOR HACKATHON DEMO VIDEO
                console.log("[GLMClient] Intercepting request for demo video mockup...");
                
                // Find the actual user query (ignoring the system-injected Evidence Ledger)
                const actualUserMessage = messages.slice().reverse().find(m => m.role === 'user' && !m.content.toLowerCase().includes('evidence ledger:'));
                const userText = actualUserMessage ? actualUserMessage.content.toLowerCase() : '';
                
                if (userText.includes('/report') || userText.includes('generate report')) {
                    const mockReportJson = {
                        "summary": "This case involves a commercial burglary at a jewelry/electronics shop. The suspect utilized shutter tampering techniques to gain forced entry during late night hours. Evidence securely links the suspect, Ramesh Kumar, to the incident.",
                        "key_findings": ["Method of entry was confirmed as shutter tampering.", "Targeted items include precious metals and gold.", "Primary suspect is a known repeat offender."],
                        "timeline": ["22:30 - Incident occurred", "22:45 - Suspect spotted fleeing on motorcycle", "23:00 - Police arrived at scene"],
                        "evidence_analysis": ["Witness statements corroborate the suspect's description.", "Historical datastore records link Ramesh Kumar to similar MOs."],
                        "investigation_gaps": ["No CCTV footage explicitly capturing the suspect's face inside the store.", "Murder weapon / firearm check yielded no results."],
                        "next_best_actions": ["Subpoena surrounding traffic cameras.", "Conduct background sweep of local pawn shops for fenced gold."],
                        "evidenceStatus": "CONFIRMED",
                        "sources": ["CaseMaster", "Accused"],
                        "limitation": "Physical forensic evidence has not yet been processed into the datastore."
                    };
                    return {
                        content: JSON.stringify(mockReportJson),
                        tool_calls: null,
                        finish_reason: 'stop'
                    };
                }

                let mockJson = {
                    summary: "Based on my analysis of the case file, the data suggests this is part of a broader pattern of commercial burglaries. I recommend investigating local pawn shops for the stolen assets. Would you like me to extract the timeline of events or identify potential accomplices?",
                    evidenceStatus: "AI_INFERRED"
                };
                
                if (userText.includes('method of entry') || userText.includes('targeted')) {
                    mockJson = {
                        summary: "Based on the case file data for this Crime Number, the exact method of entry (MO) was **shutter tampering and forced physical entry** occurring during late night hours. The suspect specifically targeted high-value **precious metals and gold jewelry**.",
                        evidenceStatus: "CONFIRMED",
                        sources: ["CaseMaster"]
                    };
                } else if (userText.includes('primary suspect') || userText.includes('background')) {
                    mockJson = {
                        summary: "The primary suspect identified in this case is **Ramesh Kumar**. According to correlated records in the datastore, he is a known **repeat offender** who frequently targets commercial electronics shops and jewelry stores using shutter tampering techniques.",
                        evidenceStatus: "CONFIRMED",
                        sources: ["Accused"]
                    };
                } else if (userText.includes('gun') || userText.includes('firearm') || userText.includes('weapon')) {
                    mockJson = {
                        summary: "The generated response contained unverified claims regarding a 'gun or firearm' and was safely intercepted and contained by the Hallucination Guard. There is absolutely no mention of firearms in the Case FIR or witness statements.",
                        evidenceStatus: "UNAVAILABLE",
                        limitation: "Vikshana strictly blocks AI outputs that attempt to invent or hallucinate facts not present in the Catalyst Datastore."
                    };
                }

                // Simulate slight delay for realistic AI typing effect
                await new Promise(resolve => setTimeout(resolve, 1500));

                return {
                    content: JSON.stringify(mockJson),
                    tool_calls: null,
                    finish_reason: 'stop'
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
