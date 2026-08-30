/**
 * NextBestActionService.js
 * Generates deterministic action recommendations based on critical gaps and conflicts.
 */
const datastoreClient = require('../queries/datastoreClient');
const HypothesisEngineService = require('./HypothesisEngineService');

class NextBestActionService {
    static async generateActions(req, caseId) {
        const hypotheses = await HypothesisEngineService.getHypothesesForCase(req, caseId);
        let actionPriority = 1;
        const actions = [];

        for (const hr of hypotheses) {
            // If hypothesis is PARTIALLY_SUPPORTED and has missing evidence
            if (hr.hypothesis.Status === 'PARTIALLY_SUPPORTED' && hr.missingEvidence.length > 0) {
                for (const gap of hr.missingEvidence) {
                    const action = {
                        ROWID: 'ACT-' + Math.random().toString(36).substr(2, 9),
                        ActionID: 'ACT-' + Math.random().toString(36).substr(2, 9),
                        CaseMasterID: caseId,
                        HypothesisID: hr.hypothesis.HypothesisID,
                        ActionType: 'VERIFY_GAP',
                        Description: `Verify or obtain evidence to address: ${gap.gap}`,
                        Priority: 'HIGH',
                        Reason: gap.reason || 'Could independently resolve uncertainty in the hypothesis.',
                        Status: 'RECOMMENDED',
                        CreatedAt: new Date().toISOString()
                    };
                    actions.push(action);
                    await datastoreClient.insertRow(req, 'InvestigationAction', action);
                }
            }

            // If contradicted, recommend verifying contradicting evidence
            if (hr.hypothesis.Status === 'CONTRADICTED' || hr.contradictingEvidence.length > 0) {
                for (const conflict of hr.contradictingEvidence) {
                    const action = {
                        ROWID: 'ACT-' + Math.random().toString(36).substr(2, 9),
                        ActionID: 'ACT-' + Math.random().toString(36).substr(2, 9),
                        CaseMasterID: caseId,
                        HypothesisID: hr.hypothesis.HypothesisID,
                        ActionType: 'RESOLVE_CONFLICT',
                        Description: `Investigate conflicting evidence: ${conflict.Description}`,
                        Priority: 'CRITICAL',
                        Reason: `Current record conflicts with hypothesis ${hr.hypothesis.Statement}.`,
                        Status: 'RECOMMENDED',
                        CreatedAt: new Date().toISOString()
                    };
                    actions.push(action);
                    await datastoreClient.insertRow(req, 'InvestigationAction', action);
                }
            }
        }
        return actions;
    }

    static async getActions(req, caseId) {
        return await datastoreClient.getRows(req, 'InvestigationAction', { where: { CaseMasterID: caseId } });
    }
}

module.exports = NextBestActionService;
