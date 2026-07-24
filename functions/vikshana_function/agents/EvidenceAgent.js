const glmClient = require('../services/glmClient');
const { evidenceSystemPrompt } = require('../prompts/evidencePrompt');

class EvidenceAgent {
    static async correlateEvidence(rawData) {
        const messages = [
            { role: "system", content: evidenceSystemPrompt },
            { role: "user", content: `Raw datastore export:\n${JSON.stringify(rawData)}` }
        ];

        try {
            console.log(`[EvidenceAgent] Correlating evidence via GLM...`);
            const responseMessage = await glmClient.generate(messages, { maxTokens: 1024 });
            let content = responseMessage.content.trim();
            
            if (content.startsWith("```json")) {
                content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
            }

            // Handle GLM Reasoning Models that output <think> or raw text before JSON
            // Extract array first (as the prompt asks for an array) then object
            const arrayMatch = content.match(/\[[\s\S]*\]/);
            const objectMatch = content.match(/\{[\s\S]*\}/);
            
            if (arrayMatch) {
                content = arrayMatch[0];
            } else if (objectMatch) {
                content = objectMatch[0];
            }

            let claims = JSON.parse(content);
            
            // Normalize response to always return a list of claims
            if (!Array.isArray(claims)) {
                if (claims && Array.isArray(claims.claims)) {
                    claims = claims.claims;
                } else if (claims && Array.isArray(claims.evidences)) {
                    claims = claims.evidences;
                } else if (claims && typeof claims === 'object') {
                    claims = [claims];
                } else {
                    claims = [];
                }
            }
            
            // Make sure each claim has supporting and counter arrays
            claims.forEach(c => {
                if (!Array.isArray(c.supporting)) c.supporting = c.supporting ? [c.supporting] : [];
                if (!Array.isArray(c.counter)) c.counter = c.counter ? [c.counter] : [];
            });

            return claims;
        } catch (error) {
            console.error("[EvidenceAgent] Error correlating evidence:", error);
            // Fallback deterministic claim if GLM fails
            return [{
                id: 1,
                claim: "AI Correlation Failed",
                supporting: ["Raw data exists but could not be processed by AI"],
                counter: [error.message],
                confidence: "0%",
                reasoning: "System encountered an error during LLM parsing."
            }];
        }
    }
}

module.exports = EvidenceAgent;
