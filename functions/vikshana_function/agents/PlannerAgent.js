const LLMService = require('../services/LLMService');
const { plannerSystemPrompt } = require('../prompts/plannerPrompt');

class PlannerAgent {
    /**
     * Converts a natural language query and conversation history into a JSON investigation plan.
     * @param {string} officerQuery - The latest query from the officer.
     * @param {Array} history - The chat history for context.
     * @returns {Promise<Object>} The JSON investigation plan.
     */
    async planInvestigation(officerQuery, history = []) {
        const messages = [
            { role: 'system', content: plannerSystemPrompt }
        ];

        // Add history (limit to last 6 messages for context)
        const recentHistory = history.slice(-6);
        for (const msg of recentHistory) {
            messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
        }

        // Add current query
        messages.push({ role: 'user', content: officerQuery });

        try {
            console.log(`[PlannerAgent] Generating plan for query: "${officerQuery}"`);
            const response = await LLMService.generate(messages, {
                temperature: 0.1, // Very low for strict JSON compliance
                maxTokens: 500
            });

            const content = response.content.trim();
            // In case the model still outputs markdown ticks despite instructions
            const cleanedContent = content.replace(/^```json\n?/, '').replace(/```$/, '').trim();
            
            return JSON.parse(cleanedContent);
        } catch (error) {
            console.error('[PlannerAgent] Failed to generate plan:', error);
            // Return a safe fallback plan
            return {
                intent: "fallback_search",
                entities: { case_ids: [], people: [], vehicles: [], locations: [], keywords: [officerQuery] },
                tools: ["search_cases"],
                confidence: 50
            };
        }
    }
}

module.exports = new PlannerAgent();
