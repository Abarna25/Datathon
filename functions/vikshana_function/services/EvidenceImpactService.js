/**
 * EvidenceImpactService.js
 * Tracks "What Changed?" when new evidence is evaluated against a hypothesis.
 */
const datastoreClient = require('../queries/datastoreClient');
const HypothesisEngineService = require('./HypothesisEngineService');

class EvidenceImpactService {
    static async recordImpact(req, caseId, hypothesisId, evidenceId, previousScore, previousStatus, newScore, newStatus) {
        let impactType = 'NO_MATERIAL_CHANGE';
        if (newScore > previousScore + 5) impactType = 'STRENGTHENED';
        else if (newScore < previousScore - 5) impactType = 'WEAKENED';
        
        if (newStatus === 'CONTRADICTED' && previousStatus !== 'CONTRADICTED') {
            impactType = 'CONTRADICTED';
        } else if (newStatus === 'SUPPORTED' && previousStatus !== 'SUPPORTED') {
            impactType = 'STRENGTHENED';
        }

        let explanation = '';
        if (impactType === 'STRENGTHENED') {
            explanation = `New evidence independently corroborates the hypothesis, raising support score from ${previousScore} to ${newScore}.`;
        } else if (impactType === 'WEAKENED') {
            explanation = `New evidence introduces conflict, lowering support score from ${previousScore} to ${newScore}.`;
        } else if (impactType === 'CONTRADICTED') {
            explanation = `New evidence materially conflicts with the hypothesis, resulting in a CONTRADICTED status.`;
        } else {
            explanation = `New evidence does not materially change the status of the hypothesis.`;
        }

        const impactRecord = {
            ROWID: 'IMP-' + Math.random().toString(36).substr(2, 9),
            ImpactID: 'IMP-' + Math.random().toString(36).substr(2, 9),
            CaseMasterID: caseId,
            EvidenceID: evidenceId,
            HypothesisID: hypothesisId,
            PreviousScore: previousScore,
            NewScore: newScore,
            PreviousStatus: previousStatus,
            NewStatus: newStatus,
            ImpactType: impactType,
            Explanation: explanation,
            Timestamp: new Date().toISOString()
        };

        await datastoreClient.insertRow(req, 'EvidenceImpact', impactRecord);
        return impactRecord;
    }

    static async getImpactHistory(req, caseId) {
        return await datastoreClient.getRows(req, 'EvidenceImpact', { where: { CaseMasterID: caseId } });
    }
}

module.exports = EvidenceImpactService;
