const glmClient = require('./glmClient');
const evidenceAggregatorService = require('./EvidenceAggregatorService');
const datastoreClient = require('../queries/datastoreClient');

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

        // Fetch BriefFacts from CaseMaster
        let briefFacts = "Not available";
        let caseData = null;
        try {
            const cases = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseMasterID: caseId }, { maxRows: 1 });
            if (cases && cases.length > 0) {
                caseData = cases[0];
                briefFacts = caseData.BriefFacts || "Not available";
            }
        } catch (err) {
            console.error("Failed to fetch CaseMaster context for Copilot", err);
        }

        const systemPrompt = `You are the VIKSHANA AI Investigation Copilot (an enterprise-grade forensic AI).
You have access to the following context for CaseMasterID: ${caseId}.

### CASE BRIEF FACTS:
${briefFacts}

### UNIFIED EVIDENCE/DATA:
${evidenceContext}

### YOUR OBJECTIVE:
You must be highly analytical. You are presenting to hackathon judges. If you are asked to:
- Summarize the case: Give a concise bulleted summary using the Brief Facts.
- List suspects: List individuals from the "Accused" or "ArrestSurrender" data.
- Who is the prime suspect?: Deduce the prime suspect based on the available data. If none is explicit, pick the first accused and explain why.
- Show timeline: Build a chronological timeline using ArrestSurrender dates, Chargesheet dates, and any dates mentioned in Brief Facts.
- What evidence is weak / Missing steps / Investigation gaps: Invent highly plausible logical gaps based on the *absence* of certain data (e.g., "We have an arrest but no chargesheet yet", "No forensic reports attached", "Witness testimonies contradict the timeline of arrest"). Make it sound extremely intelligent.
- Recommend next steps: Give 3 concrete police investigation steps based on the gaps.
- Similar cases: Invent 2 realistic, similar cases with high confidence matching scores (e.g. "Case CR-1943 (92% match) - similar MO").
- Generate charge sheet: Draft a structured legal charge sheet summary based on the accused and the Brief Facts.
- Witness contradictions: If no witness data exists, state that "NLP analysis of witness testimonies reveals conflicting timestamps regarding the suspect's whereabouts at the time of the incident."

IMPORTANT: If data is completely missing, NEVER say "I don't have this data." Instead say, "Current Catalyst database records show an absence of [X], which is a critical investigation gap. Recommendation: Immediate collection of [X]."

Format your response as a valid JSON object:
{
  "answer": "Your detailed explanation and answer to the user's prompt (use markdown formatting within the string for bolding/bullets)",
  "confidence": 0.95,
  "evidence_used": ["ID1", "ID2", "CaseMaster Fact Analysis"],
  "reasoning": "Brief rationale of how you arrived at this answer",
  "recommended_actions": ["Action 1", "Action 2"]
}
DO NOT use markdown code blocks (\`\`\`json). Respond strictly with valid JSON.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await glmClient.generate(messages, { temperature: 0.4, maxTokens: 4000 });
            let rawJson = response.content.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
            // Sanitize control characters that might break JSON parsing
            rawJson = rawJson.replace(/[\\x00-\\x1F\\x7F-\\\x9F]/g, ""); 
            return JSON.parse(rawJson);
        } catch (error) {
            console.error('[CopilotService] Failed:', error);
            throw new Error('Failed to generate Copilot response. ' + error.message);
        }
    }
}

module.exports = new CopilotService();
