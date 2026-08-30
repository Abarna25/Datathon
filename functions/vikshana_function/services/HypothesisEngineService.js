/**
 * HypothesisEngineService.js
 * Evaluates hypotheses based on structured evidence.
 */
const datastoreClient = require('../queries/datastoreClient');
const EvidenceCorroborationService = require('./EvidenceCorroborationService');

class HypothesisEngineService {
    static async evaluateHypothesis(req, caseId, hypothesis) {
        if (!caseId) throw new Error("CaseMasterID is required for isolation.");
        
        // Ensure evidence is retrieved only for this CaseMasterID
        const evidenceRows = await datastoreClient.getRows(req, 'Evidence', { where: { CaseMasterID: caseId } });
        
        let supportingEvidence = [];
        let contradictingEvidence = [];
        let missingEvidence = [];
        let score = 50; // Base score
        
        // Simulated deterministic evaluation
        for (const ev of evidenceRows) {
            // For demo/prototype, we use simple keyword matching to relate evidence to the hypothesis
            // In production, this would use semantic similarity or LLM extraction.
            if (ev.Description && hypothesis.Statement && hypothesis.Statement.toLowerCase().includes(ev.SourceType.toLowerCase())) {
                supportingEvidence.push(ev);
                score += ev.Verified ? 15 : 5;
            } else if (ev.Description && ev.Description.toLowerCase().includes('conflict')) {
                contradictingEvidence.push(ev);
                score -= 20;
            }
        }
        
        // Corroboration Engine integration
        const corroborationStatus = await EvidenceCorroborationService.analyzeCorroboration(supportingEvidence);
        if (corroborationStatus === 'MULTI_SOURCE_CORROBORATED') {
            score += 20; // Corroboration bonus
        }

        // Add dummy missing evidence for completeness if score is low
        if (score < 60) {
            missingEvidence.push({ gap: 'Missing physical verification', reason: 'Could independently resolve uncertainty' });
        }

        // Cap score 0-100
        score = Math.max(0, Math.min(100, score));

        let status = 'INCONCLUSIVE';
        if (score >= 75) status = 'SUPPORTED';
        else if (score >= 60) status = 'PARTIALLY_SUPPORTED';
        else if (score < 40) status = 'CONTRADICTED';

        const updatedHypothesis = {
            ...hypothesis,
            EvidenceSupportScore: score,
            Status: status,
            UpdatedAt: new Date().toISOString()
        };

        return {
            hypothesis: updatedHypothesis,
            supportingEvidence,
            contradictingEvidence,
            missingEvidence,
            corroborationStatus
        };
    }

    static async createHypothesis(req, caseId, statement, createdBy) {
        const hypId = 'HYP-' + Math.random().toString(36).substr(2, 9);
        const newHypothesis = {
            ROWID: hypId,
            HypothesisID: hypId,
            CaseMasterID: caseId,
            Statement: statement,
            CreatedBy: createdBy,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            Status: 'INCONCLUSIVE',
            EvidenceSupportScore: 0,
            Version: 1,
            Active: true
        };

        const result = await this.evaluateHypothesis(req, caseId, newHypothesis);
        
        await datastoreClient.insertRow(req, 'InvestigationHypothesis', result.hypothesis);
        
        return result;
    }

    static async getHypothesesForCase(req, caseId) {
        const rows = await datastoreClient.getRows(req, 'InvestigationHypothesis', { where: { CaseMasterID: caseId } });
        const results = [];
        for (const row of rows) {
            const evalResult = await this.evaluateHypothesis(req, caseId, row);
            results.push(evalResult);
        }
        return results;
    }
}

module.exports = HypothesisEngineService;
