const InvestigationService = require('../services/InvestigationService');
const HypothesisService = require('../services/HypothesisService');

class InvestigationController {
    static async investigate(req, res) {
        try {
            const data = await InvestigationService.performInvestigation(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error in InvestigationController:", error);
            res.status(500).json({ success: false, error: error.message || 'Investigation analysis failed', data: null });
        }
    }

    static async evaluateHypothesis(req, res) {
        try {
            const { caseId, statement } = req.body;
            if (!caseId || !statement) {
                return res.status(400).json({ success: false, error: 'Missing caseId or statement' });
            }
            const data = await HypothesisService.evaluateHypothesis(req, caseId, statement);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error evaluating hypothesis:", error);
            res.status(500).json({ success: false, error: error.message || 'Failed to evaluate hypothesis' });
        }
    }
}

module.exports = InvestigationController;
