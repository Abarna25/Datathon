const ContextBuilderService = require('./ContextBuilderService');
const LLMService = require('./LLMService');
const ContradictionDetectionService = require('./ContradictionDetectionService');

class AdvancedIntelligenceService {
    static async getFullScan(req, caseId) {
        let context = null;
        try {
            console.log(`[AdvancedIntelligenceService] Building context for Case ${caseId}...`);
            // Fetch unified case context
            context = await ContextBuilderService.buildCaseContext(req, caseId);
            
            if (!context || !context.case) {
                throw new Error("Insufficient case data found.");
            }

            const prompt = `
You are the Principal AI Detective for the VIKSHANA Enterprise Investigation Platform.
Your task is to analyze the following case context and return a highly structured JSON response encompassing distinct intelligence facets.
NEVER HALLUCINATE. Use ONLY available evidence. Do not invent scores or math.

CASE CONTEXT:
${JSON.stringify(context, null, 2)}

REQUIRED JSON OUTPUT FORMAT (Strictly adhere to this):
{
  "hypotheses": [
    { "summary": "...", "supportingEvidence": ["..."], "weaknesses": ["..."], "recommendedAction": "..." }
  ],
  "contradictions": [
    { "severity": "High", "description": "...", "recommendation": "..." }
  ],
  "missingEvidence": {
    "missingItems": ["DNA", "CCTV", "Call Records"],
    "priority": "HIGH"
  },
  "officerBrief": {
    "title": "Morning Briefing",
    "status": "Active",
    "highRisk": true,
    "victimsCount": 2,
    "suspectsCount": 4,
    "evidenceCount": 13,
    "pendingItems": ["DNA Report"],
    "recommendedAction": "Interview Witness #3",
    "expectedDuration": "2 Days"
  },
  "interviewQuestions": {
    "Victim": ["Where were you...", "..."],
    "Suspect": ["Why was your phone...", "..."],
    "Witness": ["Can anyone verify...", "..."]
  },
  "recommendations": [
    { "priority": 1, "action": "Collect CCTV", "why": "CCTV expires in 48 hours." }
  ],
  "explainAI": {
    "hypotheses": { "evidenceUsed": ["Timeline", "Victim Statement"], "reasoning": "..." }
  }
}

CRITICAL RULES:
1. Output valid JSON ONLY. No markdown wrapping.
2. Do not hallucinate generic names. Use actual names from context.
3. If no contradictions exist, return an empty array for contradictions.
`;

            console.log(`[AdvancedIntelligenceService] Triggering Dual-LLM Unified Scan...`);
            const llmRes = await LLMService.generate([
                { role: 'system', content: prompt },
                { role: 'user', content: `Generate structured intelligence scan for Case #${caseId}` }
            ], { temperature: 0.2 });

            let rawJson = String(llmRes?.content || '').trim();
            
            // Clean markdown wrapper if present
            if (rawJson.startsWith('```')) {
                rawJson = rawJson.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
            }

            const intelligenceData = JSON.parse(rawJson);
            
            // Integrate deterministic contradiction analysis with AI findings
            try {
                const contradictionResult = ContradictionDetectionService.detect(context);
                if (contradictionResult && contradictionResult.contradictions && contradictionResult.contradictions.length > 0) {
                    intelligenceData.contradictions = contradictionResult.contradictions;
                }
            } catch (cdErr) {
                console.warn('[AdvancedIntelligenceService] Contradiction detection notice:', cdErr.message);
            }

            return intelligenceData;
        } catch (error) {
            console.error('[AdvancedIntelligenceService] Error:', error.message);
            let safeContradictions = [];
            try {
                if (context) {
                    safeContradictions = ContradictionDetectionService.detect(context).contradictions || [];
                }
            } catch (e) {}

            return {
              "hypotheses": [],
              "contradictions": safeContradictions,
              "missingEvidence": { "missingItems": [], "priority": "UNKNOWN" },
              "officerBrief": {
                "title": "Data Processing Notice",
                "status": "Unavailable",
                "highRisk": false,
                "victimsCount": (context?.victims || []).length,
                "suspectsCount": (context?.suspects || []).length,
                "evidenceCount": 0,
                "pendingItems": [],
                "recommendedAction": "AI service offline or context processing error.",
                "expectedDuration": "N/A"
              },
              "interviewQuestions": { "Victim": [], "Suspect": [], "Witness": [] },
              "recommendations": [],
              "explainAI": {
                "hypotheses": { "evidenceUsed": [], "reasoning": "AI scan unavailable." }
              }
            };
        }
    }
}

module.exports = AdvancedIntelligenceService;
