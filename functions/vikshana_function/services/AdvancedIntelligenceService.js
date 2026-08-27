const ContextBuilderService = require('./ContextBuilderService');
const glmClient = require('./glmClient');
const ContradictionDetectionService = require('./ContradictionDetectionService');

class AdvancedIntelligenceService {
    static async getFullScan(req, caseId) {
        try {
            console.log(`[AdvancedIntelligenceService] Building context for Case ${caseId}...`);
            // Fetch massive unified context
            const context = await ContextBuilderService.buildFullCaseContext(req, caseId);
            
            if (!context || !context.caseDetails) {
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
    { "severity": "High", "description": "Witness 1 states 9PM, timeline shows 10:15PM", "recommendation": "..." }
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

            console.log(`[AdvancedIntelligenceService] Triggering GLM Unified Scan...`);
            let rawJson = await glmClient.generateText(prompt, 0.2); // Low temp for structured data
            
            // Clean markdown if GLM wraps it
            if (rawJson.startsWith('\`\`\`')) {
                rawJson = rawJson.replace(/^\`\`\`json/, '').replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
            }

            const intelligenceData = JSON.parse(rawJson);
            
            // Phase 1: Override LLM contradictions with deterministic real data
            const contradictionResult = ContradictionDetectionService.detect(context);
            intelligenceData.contradictions = contradictionResult.contradictions;

            return intelligenceData;
        } catch (error) {
            console.error('[AdvancedIntelligenceService] Error:', error);
            // Even in fallback, try to run deterministic logic if context is available
            let safeContradictions = [];
            try {
                if (context) {
                    safeContradictions = ContradictionDetectionService.detect(context).contradictions;
                }
            } catch (e) {
                // Ignore
            }

            // Throw or return minimal error state indicating unavailability.
            return {
              "hypotheses": [],
              "contradictions": safeContradictions,
              "missingEvidence": { "score": 0, "missingItems": [], "priority": "UNKNOWN" },
              "courtReadiness": { "overall": 0, "evidence": 0, "witness": 0, "legal": 0, "documentation": 0 },
              "crimeSignature": { "violence": 0, "planning": 0, "repeatPattern": 0, "financialMotive": 0, "organizedNetwork": 0 },
              "officerBrief": {
                "title": "Data Unavailable",
                "status": "Unavailable",
                "highRisk": false,
                "victimsCount": 0,
                "suspectsCount": 0,
                "evidenceCount": 0,
                "pendingItems": [],
                "recommendedAction": "Check datastore connectivity.",
                "expectedDuration": "Unknown"
              },
              "interviewQuestions": { "Victim": [], "Suspect": [], "Witness": [] },
              "readinessRadar": [],
              "recommendations": [],
              "explainAI": {
                "hypotheses": { "confidence": 0, "evidenceUsed": [], "reasoning": "AI Generation failed." },
                "courtReadiness": { "confidence": 0, "evidenceUsed": [], "reasoning": "AI Generation failed." }
              }
            };
        }
    }
}

module.exports = AdvancedIntelligenceService;
