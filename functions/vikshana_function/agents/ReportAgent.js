const LLMService = require('../services/LLMService');
const { copilotSystemPrompt } = require('../prompts/copilotPrompt');
const HallucinationGuardService = require('../services/HallucinationGuardService');

class ReportAgent {
    static generateFallbackReport(ledger, history = []) {
        if (!ledger || ledger.length === 0) {
            return `# Executive Summary\n- Data unavailable. No active records found for this case context.`;
        }

        const ledgerArray = Array.isArray(ledger) ? ledger : [ledger];
        const context = ledgerArray.find(l => l._type === 'FullCaseContext') || ledgerArray[0];
        
        let report = `# Investigation Report
## Case Details
- **Case Number:** ${context.case?.caseNumber || 'Data unavailable'}
- **Date Registered:** ${context.case?.date ? new Date(context.case.date).toLocaleDateString() : 'Data unavailable'}
- **Primary Category:** ${context.case?.category || 'Data unavailable'}
- **Jurisdiction:** ${context.case?.jurisdiction || 'Data unavailable'}

## Brief Facts
${context.case?.briefFacts || 'Data unavailable.'}

---

## Suspects & Accused
`;

        if (context.suspects && context.suspects.length > 0) {
            context.suspects.forEach(s => {
                report += `- **Name:** ${s.name || 'Unknown'} (Age: ${s.age || 'N/A'}, Gender: ${s.gender || 'N/A'})\n`;
            });
        } else {
            report += `*Data unavailable.* \n`;
        }

        report += `
---

## Timeline of Events
| Time | Event Description |
|------|-------------------|`;

        if (context.timeline && context.timeline.length > 0) {
            context.timeline.forEach(t => {
                const timeStr = t.event_time ? new Date(t.event_time).toLocaleString() : 'Unknown Time';
                report += `\n| ${timeStr} | ${t.title || 'Event'}: ${t.description || 'Details unavailable'} |`;
            });
        } else {
            report += `\n| Data unavailable | Data unavailable |`;
        }

        report += `\n\n---
## Missing Information
*This report is generated strictly from available database records. If sections are empty, the corresponding data is unavailable in the Catalyst Datastore.*`;

        return report.trim();
    }

    static async generateReport(ledger, history = [], res, streaming) {
        // Fallback checks for simple greetings
        const lastUserMsg = Array.isArray(history) && history.length > 0 ? [...history].reverse().find(m => m.role === 'user') : null;
        const userText = lastUserMsg ? lastUserMsg.content : '';
        const cleanText = userText ? userText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"") : "";
        const greetings = ['hi', 'hello', 'hey', 'hi there', 'greetings', 'yo'];
        
        // Report generation command (fallback if user explicitly wants full report)
        if (cleanText.includes("generate report") || cleanText.includes("full report")) {
            const report = this.generateFallbackReport(ledger, history);
            if (streaming && res && !res.writableEnded) {
                const chunks = report.split(' ');
                for (let i = 0; i < chunks.length; i += 3) {
                    if (res.writableEnded || res.destroyed) break;
                    LLMService.sendEvent(res, 'delta', { text: chunks.slice(i, i + 3).join(' ') + ' ' });
                    await new Promise(r => setTimeout(r, 18));
                }
            }
            return report;
        }

        if (greetings.includes(cleanText)) {
            const reply = "Hi, I'm Vikshana AI. What can I do for you?";
            if (streaming && res && !res.writableEnded) {
                const chunks = reply.split(' ');
                for (let i = 0; i < chunks.length; i += 3) {
                    if (res.writableEnded || res.destroyed) break;
                    LLMService.sendEvent(res, 'delta', { text: chunks.slice(i, i + 3).join(' ') + ' ' });
                    await new Promise(r => setTimeout(r, 18));
                }
            }
            return reply;
        }

        const messages = [
            { role: "system", content: copilotSystemPrompt }
        ];

        // Add history (limit to last 4 messages)
        const recentHistory = history.slice(-4);
        for (const msg of recentHistory) {
            messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
        }

        messages.push({ 
            role: "user", 
            content: `Evidence Ledger:\n${JSON.stringify(ledger)}` 
        });

        try {
            console.log(`[ReportAgent] Generating strictly verified JSON response...`);
            
            // We ALWAYS do non-streaming internally so we can validate the full response!
            const responseMessage = await LLMService.generate(messages, { maxTokens: 1024, temperature: 0.1 });
            
            if (!responseMessage || !responseMessage.content || responseMessage.content.includes("offline due to authentication")) {
                throw new Error("LLM service returned offline response");
            }

            let rawJson = responseMessage.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            rawJson = rawJson.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); 
            
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(rawJson);
            } catch (parseErr) {
                console.error("[ReportAgent] LLM failed to output JSON, falling back.", parseErr.message, rawJson);
                parsedResponse = {
                    answer: "An error occurred while generating the response.",
                    evidenceStatus: "UNAVAILABLE",
                    sources: []
                };
            }

            // Post-Generation Deterministic Validation
            parsedResponse = HallucinationGuardService.validate(parsedResponse, ledger);

            // Format for the UI using native Markdown
            let badgeIcon = "⚪";
            if (parsedResponse.evidenceStatus === "CONFIRMED") badgeIcon = "🟢";
            if (parsedResponse.evidenceStatus === "EVIDENCE_BACKED") badgeIcon = "🔵";
            if (parsedResponse.evidenceStatus === "AI_INFERRED") badgeIcon = "🟠";
            if (parsedResponse.evidenceStatus === "UNAVAILABLE") badgeIcon = "🔴";

            let finalMarkdown = `> **${badgeIcon} EVIDENCE STATUS: ${parsedResponse.evidenceStatus}**\n\n${parsedResponse.answer}`;
            
            if (parsedResponse.sources && parsedResponse.sources.length > 0) {
                finalMarkdown += `\n\n*Sources: ${parsedResponse.sources.join(', ')}*`;
            }

            if (parsedResponse.limitation) {
                finalMarkdown += `\n\n> **Limitation:** ${parsedResponse.limitation}`;
            }

            // Fake stream it to the client to maintain UX
            if (streaming && res && !res.writableEnded) {
                const chunks = finalMarkdown.split(' ');
                for (let i = 0; i < chunks.length; i += 3) {
                    if (res.writableEnded || res.destroyed) break;
                    LLMService.sendEvent(res, 'delta', { text: chunks.slice(i, i + 3).join(' ') + ' ' });
                    await new Promise(r => setTimeout(r, 18));
                }
            }
            
            // Expose the raw metadata if needed by the frontend layer eventually
            return finalMarkdown;
        } catch (error) {
            console.error("[ReportAgent] Error generating response, using fallback:", error.message);
            const fallbackMsg = `> **🔴 EVIDENCE STATUS: UNAVAILABLE**\n\nInsufficient evidence in the available case records. (Provider offline or error).`;
            if (streaming && res && !res.writableEnded) {
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
