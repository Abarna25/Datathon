const evidenceAggregatorService = require('./EvidenceAggregatorService');

const glmClient = require('./glmClient');

class InvestigationRecommendationService {
    async generateRecommendationsAndGaps(req, caseId, context = null, anomalies = []) {
        const unified = await evidenceAggregatorService.getAggregatedEvidence(req, caseId);
        
        let intelligence = {
            gapAnalysis: {
                critical: [],
                important: [],
                optional: []
            }
        };
        
        let hasVictim = false, accused = [], arrests = [], hasChargesheet = false, hasCaseInfo = false, hasEvidence = false;
        let evidenceContextStr = '';
        
        if (context) {
            hasCaseInfo = !!context.caseDetails;
            hasVictim = context.victims && context.victims.length > 0;
            accused = context.suspects || [];
            arrests = (context.timeline || []).filter(t => t.source_type === 'arrest_record');
            hasChargesheet = context.chargesheet && context.chargesheet.length > 0;
            hasEvidence = context.evidence && context.evidence.length > 0;
            evidenceContextStr = JSON.stringify({ 
                case: context.case, 
                victims: context.victims, 
                suspects: context.suspects, 
                evidence: context.evidence 
            });
        } else if (unified && unified.evidence) {
            hasCaseInfo = true;
            hasVictim = unified.evidence.some(e => e.type === 'Victim');
            accused = unified.evidence.filter(e => e.source === 'Accused');
            arrests = unified.evidence.filter(e => e.source === 'ArrestSurrender');
            hasChargesheet = unified.evidence.some(e => e.source === 'ChargesheetDetails');
            hasEvidence = unified.evidence.some(e => e.source === 'Evidence');
            evidenceContextStr = JSON.stringify(unified.evidence);
        }



        // --- GLM Evidence Gap Analysis Engine ---
const prompt = `You are a forensic AI engine. Analyze the following Evidence Ledger for Case ${caseId}.
Identify exactly what evidence is logically MISSING to secure a conviction, and categorize them STRICTLY into:
- CRITICAL: Absolutely necessary to prove corpus delicti or tie the main suspect to the crime (e.g. CCTV, Phone locations, Arrests if suspect known).
- IMPORTANT: Corroborating evidence (e.g. Transactions, Witness statements).
- OPTIONAL: Nice to have (e.g. Social media).

Return ONLY valid JSON in this exact structure:
{
  "critical": ["Missing evidence 1", "Missing evidence 2"],
  "important": ["Missing evidence 3"],
  "optional": ["Missing evidence 4"]
}

Evidence Ledger:
${evidenceContextStr}
`;

        try {
            const glmRes = await glmClient.generate([
                { role: 'system', content: 'You output strictly valid JSON and nothing else.' },
                { role: 'user', content: prompt }
            ], { timeoutMs: 8000, temperature: 0.1 });
            
            if (glmRes && glmRes.content) {
                const parsed = JSON.parse(glmRes.content);
                intelligence.gapAnalysis = {
                    critical: parsed.critical || [],
                    important: parsed.important || [],
                    optional: parsed.optional || []
                };
            }
        } catch (e) {
            console.error("GLM Gap Analysis failed, falling back to rule-based:", e.message);
            // Fallback logic
            if (!hasVictim) intelligence.gapAnalysis.critical.push("Identify and register formal victim details.");
            if (accused.length === 0) intelligence.gapAnalysis.critical.push("Identify and register primary suspects.");
            else if (arrests.length === 0) intelligence.gapAnalysis.critical.push("Execute and record arrest for identified suspects.");
            if (!hasEvidence) intelligence.gapAnalysis.important.push("Collect physical or digital evidence (CCTV, Phone records).");
            if (accused.length > 0 && !hasChargesheet) intelligence.gapAnalysis.important.push("Draft and file formal chargesheet.");
            intelligence.gapAnalysis.optional.push("Collect supplementary social media evidence.");
        }

        return intelligence;
    }
}

module.exports = new InvestigationRecommendationService();
