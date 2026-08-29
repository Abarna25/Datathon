/**
 * SentinelController.js
 * REST API controller exposing VIKSHANA Sentinel Autonomous Case Triage endpoints.
 */

const SentinelOrchestratorService = require('../services/SentinelOrchestratorService');
const SentinelActionService = require('../services/SentinelActionService');

class SentinelController {
    /**
     * GET /sentinel/dashboard
     * Returns latest Sentinel scan metrics, top 5 priority cases, active actions, and deltas.
     */
    static async getDashboard(req, res) {
        try {
            const state = await SentinelOrchestratorService.getDashboardState(req);
            res.status(200).json(state);
        } catch (error) {
            console.error('[SentinelController] getDashboard error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /sentinel/scan
     * Triggers an immediate on-demand autonomous scan across all active dockets.
     */
    static async triggerScan(req, res) {
        try {
            const { limit } = req.body || {};
            const result = await SentinelOrchestratorService.scanActiveCases(req, { limit });
            res.status(200).json(result);
        } catch (error) {
            console.error('[SentinelController] triggerScan error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /sentinel/actions
     * Returns the prioritized Sentinel Action Queue.
     */
    static async getActions(req, res) {
        try {
            const { caseId, status, severity } = req.query;
            const actions = SentinelActionService.getActionQueue({ caseId, status, severity });
            res.status(200).json({ success: true, count: actions.length, data: actions });
        } catch (error) {
            console.error('[SentinelController] getActions error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /sentinel/cases/:caseId/triage
     * Returns the granular priority scorecard and evidence provenance for a single case.
     */
    static async getCaseTriage(req, res) {
        try {
            const { caseId } = req.params;
            const result = await SentinelOrchestratorService.getCaseTriage(req, caseId);
            res.status(200).json(result);
        } catch (error) {
            console.error('[SentinelController] getCaseTriage error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /sentinel/actions/:actionId/decision
     * Records an officer's Human-in-the-Loop decision (APPROVE or DISMISS).
     */
    static async handleDecision(req, res) {
        try {
            const { actionId } = req.params;
            const { decision, reason } = req.body || {};

            if (!decision || !['APPROVED', 'DISMISSED'].includes(decision.toUpperCase())) {
                return res.status(400).json({ success: false, error: 'Valid decision ("APPROVED" or "DISMISSED") is required.' });
            }

            const user = req.user || { id: 'officer_01', name: 'Investigating Officer', role: 'Investigator' };

            let result;
            if (decision.toUpperCase() === 'APPROVED') {
                result = await SentinelActionService.approveAction(req, actionId, {
                    officerId: user.id,
                    officerName: user.name,
                    role: user.role,
                    reason
                });
            } else {
                result = await SentinelActionService.dismissAction(req, actionId, {
                    officerId: user.id,
                    officerName: user.name,
                    role: user.role,
                    reason
                });
            }

            res.status(200).json({
                success: true,
                message: `Action recommendation ${decision.toLowerCase()} successfully and recorded in tamper-proof audit trail.`,
                data: result
            });
        } catch (error) {
            console.error('[SentinelController] handleDecision error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /sentinel/audit-trail
     * Returns immutable decision logs for Sentinel actions.
     */
    static async getDecisionAuditTrail(req, res) {
        try {
            const { caseId } = req.query;
            const logs = SentinelActionService.getDecisionLogs({ caseId });
            res.status(200).json({ success: true, count: logs.length, data: logs });
        } catch (error) {
            console.error('[SentinelController] getDecisionAuditTrail error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = SentinelController;
