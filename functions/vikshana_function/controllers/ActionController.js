const NextBestActionService = require('../services/NextBestActionService');
const datastoreClient = require('../queries/datastoreClient');

class ActionController {
    static async getActions(req, res) {
        try {
            const { caseId } = req.params;
            const actions = await NextBestActionService.getActions(req, caseId);
            res.json({ success: true, data: actions });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateActionStatus(req, res) {
        try {
            const { caseId, actionId } = req.params;
            const { status } = req.body;
            const updated = await datastoreClient.updateRow(req, 'InvestigationAction', actionId, { Status: status, CompletedAt: status === 'COMPLETED' ? new Date().toISOString() : null });
            res.json({ success: true, data: updated });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = ActionController;
