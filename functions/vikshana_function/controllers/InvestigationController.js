const InvestigationService = require('../services/InvestigationService');

class InvestigationController {
    static async investigate(req, res) {
        try {
            const data = await InvestigationService.performInvestigation(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error in InvestigationController:", error);
            res.status(200).json({ success: false, data: [] });
        }
    }
}

module.exports = InvestigationController;
