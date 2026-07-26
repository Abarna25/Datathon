const LLMService = require('./LLMService');

const SUGGESTION_SYSTEM_PROMPT = `You generate short follow-up questions an investigator might ask next, based on the assistant's last answer in a criminal investigation chat. Reply with ONLY a raw JSON array of 3 to 4 short strings (max ~8 words each). No markdown, no explanation, no code fences. Example: ["Who is the primary suspect?", "Show strongest evidence", "Generate officer briefing", "Show missing evidence", "Predict next investigation step"]`;

class SuggestionService {
    static async generateFollowUps(assistantText, contextSummary) {
        try {
            const messages = [
                { role: 'system', content: SUGGESTION_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Case context: ${contextSummary}\n\nAssistant's last answer:\n${assistantText}\n\nSuggest 3-4 short follow-up questions.`
                }
            ];
            const response = await LLMService.generate(messages, { maxTokens: 200, temperature: 0.5 });
            let content = (response.content || '').trim();

            // Strip markdown code fences if present
            if (content.startsWith('```')) {
                content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }

            // Extract the first JSON array found in the response, even if surrounded by prose
            const match = content.match(/\[[\s\S]*?\]/);
            if (!match) return [];
            content = match[0];

            let suggestions;
            try {
                suggestions = JSON.parse(content);
            } catch {
                // Last resort: extract quoted strings manually
                const strings = [...content.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map((m) => m[1]);
                suggestions = strings.length ? strings : [];
            }

            return Array.isArray(suggestions) ? suggestions.slice(0, 4).map(String) : [];
        } catch (error) {
            console.error('[SuggestionService] Failed to generate follow-ups:', error.message);
            return [];
        }
    }
}

module.exports = SuggestionService;

