/**
 * ForesightController.js
 * VIKSHANA 3.0 Foresight REST API Controller
 */

const ForesightMLService = require('../services/ForesightMLService');
const ForesightAuditService = require('../services/ForesightAuditService');

class ForesightController {
    /**
     * POST /foresight/assess
     * Evaluates an accused individual using the calibrated supervised ML model.
     */
    static async assessAccused(req, res) {
        try {
            const { accusedName, caseId } = req.body || req.query;
            if (!accusedName) {
                return res.status(400).json({
                    status: 'ERROR',
                    error: 'accusedName is required in request body or query.'
                });
            }

            const assessment = await ForesightMLService.assessAccused(req, { accusedName, caseId });
            return res.status(200).json(assessment);
        } catch (error) {
            console.error('[ForesightController] assessAccused error:', error.message);
            return res.status(500).json({
                status: 'ERROR',
                error: error.message || 'Failed to generate Foresight assessment.'
            });
        }
    }

    /**
     * GET /foresight/cases/:caseId/assessments
     * Evaluates all suspects linked to a specific case.
     */
    static async assessCaseSuspects(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) {
                return res.status(400).json({
                    status: 'ERROR',
                    error: 'caseId parameter is required.'
                });
            }

            const result = await ForesightMLService.assessCaseSuspects(req, caseId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('[ForesightController] assessCaseSuspects error:', error.message);
            return res.status(500).json({
                status: 'ERROR',
                error: error.message || 'Failed to assess case suspects.'
            });
        }
    }

    /**
     * GET /foresight/model-card
     * Returns the certified Model Card and temporal validation metrics.
     */
    static async getModelCard(req, res) {
        try {
            const modelCard = await ForesightMLService.getModelCard(req);
            return res.status(200).json({
                status: 'SUCCESS',
                modelCard
            });
        } catch (error) {
            console.error('[ForesightController] getModelCard error:', error.message);
            return res.status(500).json({
                status: 'ERROR',
                error: error.message || 'Failed to load Foresight model card.'
            });
        }
    }

    /**
     * POST /foresight/decision
     * Human-in-the-Loop officer decision sign-off.
     */
    static async recordDecision(req, res) {
        try {
            const { assessmentId, accusedName, caseId, decision, officerNotes } = req.body;
            if (!assessmentId || !decision) {
                return res.status(400).json({
                    status: 'ERROR',
                    error: 'assessmentId and decision (ACKNOWLEDGE, DISMISS, REQUEST_MORE_INFO) are required.'
                });
            }

            const officerName = req.user?.name || req.body.officerName || 'Inspector';
            const decisionRecord = await ForesightAuditService.recordOfficerDecision(req, {
                assessmentId,
                accusedName,
                caseId,
                decision,
                officerNotes,
                officerName
            });

            return res.status(200).json({
                status: 'SUCCESS',
                message: `Decision '${decision}' recorded immutably.`,
                decision: decisionRecord
            });
        } catch (error) {
            console.error('[ForesightController] recordDecision error:', error.message);
            return res.status(400).json({
                status: 'ERROR',
                error: error.message || 'Failed to record officer decision.'
            });
        }
    }

    /**
     * GET /foresight/audit-trail
     * Retrieves historical forensic decisions.
     */
    static async getAuditTrail(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const records = await ForesightAuditService.getDecisionAuditTrail(req, { limit });
            return res.status(200).json({
                status: 'SUCCESS',
                count: records.length,
                decisions: records
            });
        } catch (error) {
            console.error('[ForesightController] getAuditTrail error:', error.message);
            return res.status(500).json({
                status: 'ERROR',
                error: error.message || 'Failed to retrieve decision audit trail.'
            });
        }
    }
}

module.exports = ForesightController;
