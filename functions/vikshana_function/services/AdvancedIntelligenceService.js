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
Your task is to analyze the following case context and return a highly structured JSON response encompassing 10 distinct intelligence facets.
NEVER HALLUCINATE. If data is insufficient, use mathematical derivation based on context clues or explicitly state "Insufficient evidence".

CASE CONTEXT:
${JSON.stringify(context, null, 2)}

REQUIRED JSON OUTPUT FORMAT (Strictly adhere to this):
{
  "hypotheses": [
    { "confidence": 85, "summary": "...", "supportingEvidence": ["..."], "weaknesses": ["..."], "recommendedAction": "..." },
    { "confidence": 72, "summary": "...", "supportingEvidence": ["..."], "weaknesses": ["..."], "recommendedAction": "..." }
  ],
  "contradictions": [
    { "severity": "High", "description": "...", "recommendation": "..." }
  ],
  "missingEvidence": {
    "score": 74,
    "missingItems": ["DNA", "CCTV", "Call Records"],
    "priority": "HIGH"
  },
  "courtReadiness": {
    "overall": 84,
    "evidence": 91,
    "witness": 74,
    "legal": 88,
    "documentation": 93
  },
  "crimeSignature": {
    "violence": 4,
    "planning": 5,
    "repeatPattern": 3,
    "financialMotive": 2,
    "organizedNetwork": 4
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
  "readinessRadar": [
    { "subject": "Evidence", "A": 85, "fullMark": 100 },
    { "subject": "Witnesses", "A": 65, "fullMark": 100 },
    { "subject": "Timeline", "A": 90, "fullMark": 100 },
    { "subject": "Documentation", "A": 75, "fullMark": 100 },
    { "subject": "Legal", "A": 88, "fullMark": 100 },
    { "subject": "Forensics", "A": 60, "fullMark": 100 }
  ],
  "recommendations": [
    { "priority": 1, "action": "Collect CCTV", "confidence": 95, "why": "CCTV expires in 48 hours." },
    { "priority": 2, "action": "Arrest Suspect", "confidence": 91, "why": "Flight risk indicated." }
  ],
  "explainAI": {
    "hypotheses": { "confidence": 88, "evidenceUsed": ["Timeline", "Victim Statement"], "reasoning": "..." },
    "courtReadiness": { "confidence": 92, "evidenceUsed": ["Charge Sheet", "Forensics"], "reasoning": "..." }
  }
}

CRITICAL RULES:
1. Output valid JSON ONLY. No markdown wrapping.
2. Do not use dummy names like 'John Doe'. Use actual names from context.
3. Derive 1-5 scale mathematically for crimeSignature.
4. If no contradictions exist, return an empty array for contradictions.
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
              "missingEvidence": { "score": 0, "missingItems": [], "priority": "UNKNOWN" },
              "courtReadiness": { "overall": 0, "evidence": 0, "witness": 0, "legal": 0, "documentation": 0 },
              "crimeSignature": { "violence": 0, "planning": 0, "repeatPattern": 0, "financialMotive": 0, "organizedNetwork": 0 },
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
              "readinessRadar": [],
              "recommendations": [],
              "explainAI": {
                "hypotheses": { "confidence": 0, "evidenceUsed": [], "reasoning": "AI scan unavailable." },
                "courtReadiness": { "confidence": 0, "evidenceUsed": [], "reasoning": "AI scan unavailable." }
              }
            };
        }
    }
}

module.exports = AdvancedIntelligenceService;
