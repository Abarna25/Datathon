const glmClient = require('./glmClient');
const ContextBuilderService = require('./ContextBuilderService');

class HypothesisService {
    static async evaluateHypothesis(req, caseId, hypothesisStatement) {
        try {
            if (!caseId || caseId === 'UNASSIGNED') {
                throw new Error("Invalid Case ID. Hypothesis testing must be scoped to an active case.");
            }

            if (!hypothesisStatement || hypothesisStatement.trim() === '') {
                throw new Error("Hypothesis statement cannot be empty.");
            }

            // 1. Gather all verified evidence for this case
            const caseContext = await ContextBuilderService.buildContext(req, caseId);
            
            // Extract meaningful evidence items
            const evidenceItems = [];
            
            // From FIR Facts
            if (caseContext.caseInfo && caseContext.caseInfo.briefFacts) {
                evidenceItems.push({
                    id: `FIR-${caseId}`,
                    source: "CaseMaster (Brief Facts)",
                    type: "FIR_NARRATIVE",
                    content: caseContext.caseInfo.briefFacts
                });
            }

            // From Suspects
            (caseContext.suspects || []).forEach(s => {
                evidenceItems.push({
                    id: `ACCUSED-${s.ROWID}`,
                    source: "Accused Table",
                    type: "PERSON_OF_INTEREST",
                    content: `Accused: ${s.name}, Age: ${s.age}, Gender: ${s.gender}`
                });
            });

            // From Victims
            (caseContext.victims || []).forEach(v => {
                evidenceItems.push({
                    id: `VICTIM-${v.ROWID}`,
                    source: "Victim Table",
                    type: "VICTIM_INFO",
                    content: `Victim: ${v.name}, Age: ${v.age}, Gender: ${v.gender}`
                });
            });

            // From Timeline
            (caseContext.timeline || []).forEach(t => {
                evidenceItems.push({
                    id: `TIME-${t.id}`,
                    source: "Inv_OccuranceTime",
                    type: "TEMPORAL_EVENT",
                    content: `Event occurred between ${t.fromDate} and ${t.toDate}`
                });
            });

            // From Arrests
            (caseContext.arrests || []).forEach(a => {
                evidenceItems.push({
                    id: `ARREST-${a.id}`,
                    source: "ArrestSurrender",
                    type: "ARREST_RECORD",
                    content: `Accused ID ${a.accusedId} arrested/surrendered on ${a.date}`
                });
            });

            if (evidenceItems.length === 0) {
                return {
                    hypothesis: hypothesisStatement,
                    status: "INCONCLUSIVE",
                    score: 0,
                    explanation: "No case evidence found to evaluate this hypothesis.",
                    supporting: [],
                    contradicting: [],
                    missing: ["All case evidence is currently empty."]
                };
            }

            // 2. Ask LLM to categorize each evidence item against the hypothesis
            const prompt = `
You are a deterministic Law Enforcement Intelligence Engine.
You must evaluate a specific HYPOTHESIS against the provided EVIDENCE LIST.
DO NOT hallucinate. Use ONLY the provided evidence.

HYPOTHESIS: "${hypothesisStatement}"

EVIDENCE LIST:
${JSON.stringify(evidenceItems, null, 2)}

INSTRUCTIONS:
1. Iterate through each evidence item in the list.
2. Determine if the evidence item SUPPORTS the hypothesis, CONTRADICTS the hypothesis, or is NEUTRAL/IRRELEVANT.
3. Determine what critical evidence is MISSING that would conclusively prove or disprove the hypothesis.

Respond ONLY with a raw, valid JSON object in this exact format, with no markdown formatting or \`\`\`:
{
  "supporting": [
    { "id": "EVID-ID", "content": "Brief summary", "reasoning": "Why it supports" }
  ],
  "contradicting": [
    { "id": "EVID-ID", "content": "Brief summary", "reasoning": "Why it contradicts" }
  ],
  "missing": [
    "Description of missing evidence 1",
    "Description of missing evidence 2"
  ]
}
`;

            const aiResponseText = await glmClient.generateText(prompt, { temperature: 0.1 });
            
            let evaluation;
            try {
                // Strip markdown backticks if the LLM hallucinated them despite instructions
                const cleanJson = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                evaluation = JSON.parse(cleanJson);
            } catch (err) {
                console.error("Failed to parse hypothesis JSON:", aiResponseText);
                throw new Error("Failed to process evidence evaluation. AI returned invalid format.");
            }

            // 3. Deterministically evaluate the Evidence Support
            const supportCount = (evaluation.supporting || []).length;
            const contradictCount = (evaluation.contradicting || []).length;

            let status = "INCONCLUSIVE";
            if (supportCount > 0 && contradictCount === 0) {
                status = "VALIDATED";
            } else if (contradictCount > 0) {
                status = "CONTRADICTED";
            } else {
                status = "INCONCLUSIVE";
            }

            let explanation = `The hypothesis is ${status.toLowerCase()}.`;
            if (supportCount > 0) explanation += ` There are ${supportCount} pieces of evidence supporting this.`;
            if (contradictCount > 0) explanation += ` However, there are ${contradictCount} pieces of contradicting evidence.`;
            if (supportCount === 0 && contradictCount === 0) explanation += ` Current evidence is entirely neutral or irrelevant.`;

            if (evaluation.missing && evaluation.missing.length > 0) {
                explanation += ` Acquiring ${evaluation.missing[0]} would help clarify the remaining gaps.`;
            }

            return {
                hypothesisId: `HYP-${Date.now()}`,
                caseId,
                statement: hypothesisStatement,
                status,
                score,
                explanation,
                supporting: evaluation.supporting || [],
                contradicting: evaluation.contradicting || [],
                missing: evaluation.missing || [],
                evaluatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('HypothesisService Error:', error);
            throw error;
        }
    }
}

module.exports = HypothesisService;
