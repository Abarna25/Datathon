const glmClient = require('./glmClient');
const evidenceAggregatorService = require('./EvidenceAggregatorService');
const patternDetectionService = require('./PatternDetectionService');
const datastoreClient = require('../queries/datastoreClient');
const HallucinationGuardService = require('./HallucinationGuardService');
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

        const messages = [
            { role: 'system', content: copilotSystemPrompt },
            { role: 'user', content: `Evidence Ledger:\n${evidenceContext}${intelligenceContext}\n\nUser Query:\n${prompt}` }
        ];

        try {
            const response = await glmClient.generate(messages, { temperature: 0.1, maxTokens: 4000 });
            
            if (!response || !response.content) {
                throw new Error("Empty response from GLM");
            }

            let rawJson = response.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            // Sanitize control characters that might break JSON parsing
            rawJson = rawJson.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); 
            
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(rawJson);
            } catch (e) {
                parsedResponse = {
                    answer: "An error occurred while parsing the AI response.",
                    evidenceStatus: "UNAVAILABLE",
                    sources: []
                };
            }
            
            // Phase 1: Hallucination Guard
            parsedResponse = HallucinationGuardService.validate(parsedResponse, unified.evidence);
            
            return parsedResponse;
        } catch (error) {
            console.error('[CopilotService] Failed:', error);
            return HallucinationGuardService.getFallback("Copilot Service is offline or data is currently unavailable.");
        }
    }
}

module.exports = new CopilotService();
