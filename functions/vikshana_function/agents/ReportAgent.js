const glmClient = require('../services/glmClient');
const glmStreamClient = require('../services/glmStreamClient');
const { reportSystemPrompt } = require('../prompts/reportPrompt');

class ReportAgent {
    /**
     * Generates a clean, intelligent fallback response when LLM synthesis fails or operates offline.
     */
    static generateFallbackReport(ledger, history = []) {
        const lastMsg = history.length > 0 ? String(history[history.length - 1].content || '').toLowerCase().trim() : '';
        
        // 1. Check for standard greetings or introductory prompts
        const greetings = ['hi', 'hello', 'hey', 'greetings', 'help', 'who are you', 'start', 'test', 'hi there', 'good morning', 'good afternoon', 'good evening'];
        const isGreeting = greetings.includes(lastMsg) || lastMsg.length <= 3;
        
        if (isGreeting) {
            return `Hello! I am **Vikshana AI**, your intelligent crime analytics and investigation copilot. 

I can assist you with:
- 🔍 **Case & FIR Intelligence**: Querying active investigations, suspect profiles, and evidentiary documents.
- 🧬 **Offender Profiling**: Analyzing behavioral vectors, Modus Operandi (MO) matching, and recidivism risk.
- 🕸️ **Relationship & Network Explorer**: Mapping associate networks, safehouses, and crime density heatmaps.
- 📋 **Court Briefing Reports**: Synthesizing evidence ledgers into court-ready reports.

How can I assist your investigation today?`;
        }

        // 2. Filter valid evidence claims from the ledger
        const validClaims = Array.isArray(ledger) 
            ? ledger.filter(item => item && item.claim && item.claim !== "AI Correlation Failed" && item.claim !== "AI Correlation Event")
            : [];

        if (validClaims.length > 0) {
            let summary = `### 📊 Evidence Synthesis Summary\n\n`;
            summary += `The following evidence items were retrieved for your investigation:\n\n`;
            
            validClaims.forEach((item, index) => {
                summary += `**${index + 1}. ${item.claim}**\n`;
                if (item.evidence) summary += `- **Evidence Details:** ${item.evidence}\n`;
                if (item.sourceTable) summary += `- **Source Table:** \`${item.sourceTable}\` (Record ID: \`${item.recordId || 'N/A'}\`)\n`;
                if (typeof item.confidence === 'number' && item.confidence > 0) summary += `- **Confidence Score:** ${item.confidence}%\n`;
                if (item.suggestedNextAction) summary += `- **Suggested Action:** ${item.suggestedNextAction}\n`;
                summary += `\n`;
            });

            summary += `> 💡 *Note: Structured fallback synthesis active. Select any cited evidence item below to inspect raw database records.*`;
            return summary;
        }

        // 3. General fallback response when no specific evidence claims match
        return `I processed your request, but no specific matching evidence records were found in the active case ledger.

To investigate further, you can:
- Provide a specific **Case ID** (e.g. \`100080405202100001\`)
- Search by **Suspect Name**, **Vehicle**, or **Location**
- Filter by **FIR Number** or **Crime Category**`;
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
                const resText = await glmStreamClient.streamCompletion(res, messages, { maxTokens: 1024, temperature: 0.3 });
                if (resText && !resText.includes("The AI Copilot is currently offline")) {
                    return resText;
                }
            } else {
                const responseMessage = await glmClient.generate(messages, { maxTokens: 1024, temperature: 0.3 });
                if (responseMessage && responseMessage.content && !responseMessage.content.includes("The AI Copilot is currently offline")) {
                    return responseMessage.content;
                }
            }
            throw new Error("GLM LLM service returned offline response");
        } catch (error) {
            console.error("[ReportAgent] Error generating report via LLM, using fallback synthesis:", error.message);
            const fallbackMsg = ReportAgent.generateFallbackReport(ledger, history);
            if (streaming && res && !res.writableEnded) {
                await glmStreamClient.streamText(res, fallbackMsg);
            }
            return fallbackMsg;
        }
    }
}

module.exports = ReportAgent;
