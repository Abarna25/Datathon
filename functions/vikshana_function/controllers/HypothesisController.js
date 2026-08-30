const HypothesisEngineService = require('../services/HypothesisEngineService');

class HypothesisController {
    static async createHypothesis(req, res) {
        try {
            const { caseId } = req.params;
            const { statement } = req.body;
            // E.g. get from decoded token
            const createdBy = req.user ? req.user.id : 'Investigator';
            
            const result = await HypothesisEngineService.createHypothesis(req, caseId, statement, createdBy);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getHypotheses(req, res) {
        try {
            const { caseId } = req.params;
            const results = await HypothesisEngineService.getHypothesesForCase(req, caseId);
            res.json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = HypothesisController;
