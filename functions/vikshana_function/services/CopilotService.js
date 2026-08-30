const glmClient = require('./glmClient');
const evidenceAggregatorService = require('./EvidenceAggregatorService');
const patternDetectionService = require('./PatternDetectionService');
const datastoreClient = require('../queries/datastoreClient');
const HallucinationGuardService = require('./HallucinationGuardService');
const ConversationService = require('./ConversationService');
const { copilotSystemPrompt } = require('../prompts/copilotPrompt');

class CopilotService {
    async chat(req, caseId, prompt) {
        // Fetch unified evidence context
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        let evidenceContext = 'No evidence found.';
        if (unified.evidence && unified.evidence.length > 0) {
            evidenceContext = JSON.stringify(unified.evidence);
        } else if (unified.isAggregated) {
            evidenceContext = 'Data is aggregated. Counts: ' + JSON.stringify(unified.counts);
        }

        // Fetch Intelligence context if asked for
        let intelligenceContext = '';
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('pattern') || lowerPrompt.includes('trend') || lowerPrompt.includes('hotspot') || lowerPrompt.includes('offender') || lowerPrompt.includes('increase')) {
            const [trends, hotspots, emerging, offenders] = await Promise.all([
                patternDetectionService.getTrendAnalysis(req).catch(() => ({})),
                patternDetectionService.getHotspots(req).catch(() => []),
                patternDetectionService.getEmergingPatterns(req).catch(() => []),
                patternDetectionService.getRepeatOffenders(req).catch(() => [])
            ]);
            intelligenceContext += `\n\nGlobal Intelligence Data:\nTrends: ${JSON.stringify(trends)}\nHotspots: ${JSON.stringify(hotspots)}\nEmerging Patterns: ${JSON.stringify(emerging)}\nRepeat Offenders: ${JSON.stringify(offenders)}`;
        }

        if (lowerPrompt.includes('similar') || lowerPrompt.includes('compare') || lowerPrompt.includes('match') || lowerPrompt.includes('historical') || lowerPrompt.includes('recommend') || lowerPrompt.includes('investigate') || lowerPrompt.includes('gap') || lowerPrompt.includes('lead')) {
            try {
                const SimilarCaseService = require('./SimilarCaseService');
                const similarData = await SimilarCaseService.findSimilarCases(req, caseId);
                intelligenceContext += `\n\nCase Intelligence (Similar Historical Cases & Leads):\n${JSON.stringify(similarData)}`;
            } catch (e) {
                console.error("Failed to fetch similar case intelligence for Copilot", e);
            }
        }

        // Conversation History Integration
        const officerId = req.user ? req.user.id : 'SYSTEM';
        let convList = await ConversationService.listConversations(req, { caseId, officerId });
        let conversation;
        if (convList && convList.length > 0) {
            conversation = await ConversationService.getConversation(req, convList[0].id || convList[0].ROWID);
        } else {
            conversation = await ConversationService.createConversation(req, { caseId, officerId, title: `Case ${caseId} Copilot` });
            conversation.messages = [];
        }

        const conversationId = conversation.id || conversation.ROWID;
        await ConversationService.appendMessage(req, conversationId, { role: 'user', content: prompt });

        const historyContext = (conversation.messages || [])
            .slice(-10) // Limit to last 10 messages for context size
            .map(m => `[Previous ${m.role}]: ${m.content}`)
            .join('\n\n');

        const messages = [
            { role: 'system', content: copilotSystemPrompt + '\n\nIMPORTANT: Do not treat Previous conversation statements as verified evidence. Verified Evidence is strictly listed below under Evidence Ledger.' },
            { role: 'user', content: `Evidence Ledger:\n${evidenceContext}${intelligenceContext}\n\nConversation History:\n${historyContext}\n\nUser Query:\n${prompt}` }
        ];

        try {
            const StructuredAIResponseParser = require('./StructuredAIResponseParser');
            let response = await glmClient.generate(messages, { temperature: 0.1, maxTokens: 8192 });
            let parsedResult = StructuredAIResponseParser.parse(response);

            if (parsedResult.status === 'TRUNCATED_OUTPUT' || parsedResult.status === 'MALFORMED_JSON') {
                console.warn("[CopilotService] AI response was truncated or malformed. Retrying once...");
                // Add retry instruction
                messages.push({ role: 'assistant', content: parsedResult.rawContent });
                messages.push({ role: 'user', content: "Generate a concise evidence-grounded report. Do not include unnecessary prose. Return only the required structured fields. Prioritize completing the JSON structure." });
                response = await glmClient.generate(messages, { temperature: 0.1, maxTokens: 8192 });
                parsedResult = StructuredAIResponseParser.parse(response);
            }

            if (parsedResult.status !== 'VALID_JSON') {
                return {
                    status: "GENERATION_FAILED",
                    reason: "The analytical report could not be generated completely.",
                    retry_attempted: true
                };
            }

            let parsedResponse = parsedResult.data;
            
            // Phase 1: Hallucination Guard
            parsedResponse = HallucinationGuardService.validate(parsedResponse, unified.evidence);
            
            // Compile structured schema into Markdown for the UI
            let compiledAnswer = `### Summary\n${parsedResponse.summary || 'No summary provided.'}\n\n`;
            
            if (parsedResponse.key_findings && parsedResponse.key_findings.length > 0) {
                compiledAnswer += `### Key Findings\n` + parsedResponse.key_findings.map(f => `- ${f}`).join('\n') + `\n\n`;
            }
            if (parsedResponse.timeline && parsedResponse.timeline.length > 0) {
                compiledAnswer += `### Timeline\n` + parsedResponse.timeline.map(t => `- ${t}`).join('\n') + `\n\n`;
            }
            if (parsedResponse.evidence_analysis && parsedResponse.evidence_analysis.length > 0) {
                compiledAnswer += `### Evidence Analysis\n` + parsedResponse.evidence_analysis.map(e => `- ${e}`).join('\n') + `\n\n`;
            }
            if (parsedResponse.investigation_gaps && parsedResponse.investigation_gaps.length > 0) {
                compiledAnswer += `### Investigation Gaps\n` + parsedResponse.investigation_gaps.map(g => `- ${g}`).join('\n') + `\n\n`;
            }
            if (parsedResponse.limitation) {
                compiledAnswer += `### Limitations\n> ${parsedResponse.limitation}\n\n`;
            }
            
            parsedResponse.answer = compiledAnswer.trim();

            // Phase 2: Save Assistant Response
            await ConversationService.appendMessage(req, conversationId, { 
                role: 'assistant', 
                content: JSON.stringify(parsedResponse), // Store raw JSON string in DB for copilot history 
                citations: parsedResponse.sources || [] 
            });

            return parsedResponse;
        } catch (error) {
            console.error('[CopilotService] Failed:', error);
            return {
                status: "GENERATION_FAILED",
                reason: "An error occurred during report generation.",
                retry_attempted: false
            };
        }
    }
}

module.exports = new CopilotService();
