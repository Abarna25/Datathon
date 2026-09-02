const SocialRiskCorrelationService = require('../services/SocialRiskCorrelationService');

class SocialRiskController {
    static async getSocialRiskCorrelation(req, res) {
        try {
            const data = await SocialRiskCorrelationService.getSocialRiskCorrelation(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error in SocialRiskController:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = SocialRiskController;
