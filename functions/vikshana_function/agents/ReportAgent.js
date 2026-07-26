const LLMService = require('../services/LLMService');
const { reportSystemPrompt } = require('../prompts/reportPrompt');

class ReportAgent {
    /**
     * Generates a clean, intelligent fallback response when LLM synthesis fails or operates offline.
     */
    static generateFallbackReport(ledger, history = []) {
        if (!ledger || ledger.length === 0) {
            return `### Investigation Summary\nThe AI Copilot is currently operating in offline mode. No local records found for this case.\n\n### Key Findings\n- Network connectivity is restricted.\n- Unable to reach active case master.\n\n### Evidence Analysis\nNo evidence loaded into offline cache.\n\n### Risk Assessment\nMedium - Data unavailability.\n\n### Recommended Next Step\nVerify API keys or network connection.\n\n### Confidence\n0%`;
        }

        const context = ledger.find(l => l._type === 'FullCaseContext') || ledger[0];
        
        let summary = `### Investigation Summary\n*Note: The AI Copilot is currently in Offline Analysis Mode.*\nCase **${context.case?.caseNumber || 'Unknown'}** is currently **${context.case?.status || 'Active'}**. ${context.case?.briefFacts || 'No brief facts available.'}\n\n`;
        
        summary += `### Key Findings\n`;
        if (context.suspects && context.suspects.length > 0) {
            summary += `- Identified ${context.suspects.length} primary suspect(s).\n`;
        }
        if (context.victims && context.victims.length > 0) {
            summary += `- Identified ${context.victims.length} victim(s).\n`;
        }
        summary += `- Timeline contains ${context.timeline?.length || 0} event(s).\n\n`;

        summary += `### Evidence Analysis\n`;
        if (context.suspects && context.suspects.length > 0) {
            summary += `**Suspects:**\n`;
            context.suspects.forEach(s => summary += `- ${s.name} (Age: ${s.age || 'Unknown'}) - Status: ${s.status}\n`);
        }
        if (context.victims && context.victims.length > 0) {
            summary += `**Victims:**\n`;
            context.victims.forEach(v => summary += `- ${v.name} (Age: ${v.age || 'Unknown'})\n`);
        }
        if (context.timeline && context.timeline.length > 0) {
            summary += `**Timeline Events:**\n`;
            context.timeline.slice(0, 3).forEach(t => summary += `- ${t.event_time}: ${t.title}\n`);
        }
        summary += `\n`;

        summary += `### Risk Assessment\n`;
        if (context.arrests && context.arrests.length === 0 && context.suspects && context.suspects.length > 0) {
            summary += `**High Flight Risk**: Suspects have been identified but no arrests are logged in the offline datastore.\n\n`;
        } else {
            summary += `**Moderate**: Standard investigation protocols apply.\n\n`;
        }

        summary += `### Recommended Next Step\n`;
        summary += `Please review the datastore manually or wait for AI Copilot connectivity to resume for deeper analysis.\n\n`;

        summary += `### Confidence\n100% (Direct Datastore Pull)`;

        return summary.trim();
    }

    /**
     * Generates a conversational response based ONLY on the evidence ledger.
     * @param {Array} ledger - The strict Evidence Ledger JSON array.
     * @param {Array} history - Previous conversation messages.
     * @param {Object} res - Express response object for streaming.
     * @param {boolean} streaming - Whether to stream the response.
     */
    static async generateReport(ledger, history, res, streaming) {
        const messages = [
            { role: "system", content: reportSystemPrompt }
        ];

        // Add history (limit to last 4 messages for minimal context bloat)
        const recentHistory = history.slice(-4);
        for (const msg of recentHistory) {
            messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
        }

        messages.push({ 
            role: "user", 
            content: `New Evidence Ledger to synthesize:\n${JSON.stringify(ledger)}` 
        });

        try {
            console.log(`[ReportAgent] Generating final response...`);
            if (streaming) {
                const resText = await LLMService.streamCompletion(res, messages, { maxTokens: 1024, temperature: 0.3 });
                if (resText && !resText.includes("offline due to authentication")) {
                    return resText;
                }
            } else {
                const responseMessage = await LLMService.generate(messages, { maxTokens: 1024, temperature: 0.3 });
                if (responseMessage && responseMessage.content && !responseMessage.content.includes("offline due to authentication")) {
                    return responseMessage.content;
                }
            }
            throw new Error("LLM service returned offline response");
        } catch (error) {
            console.error("[ReportAgent] Error generating report via LLMService, using fallback synthesis:", error.message);
            const fallbackMsg = ReportAgent.generateFallbackReport(ledger, history);
            if (streaming && res && !res.writableEnded) {
                // For fallback, we don't need a real LLM stream, we can just send the events directly
                const chunks = fallbackMsg.split(' ');
                for (let i=0; i<chunks.length; i+=3) {
                    if (res.writableEnded || res.destroyed) break;
                    LLMService.sendEvent(res, 'delta', { text: chunks.slice(i, i+3).join(' ') + ' ' });
                    await new Promise(r => setTimeout(r, 18));
                }
            }
            return fallbackMsg;
        }
    }
}

module.exports = ReportAgent;
