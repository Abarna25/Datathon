const SociologicalIntelligenceService = require('../services/SociologicalIntelligenceService');

class SociologicalIntelligenceController {
    static async getOverview(req, res) {
        try {
            const result = await SociologicalIntelligenceService.getOverview(req);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Error in getOverview controller:", error);
            res.status(500).json({ success: false, error: 'Failed to generate sociological overview.' });
        }
    }

    static async getDemographics(req, res) {
        try {
            const result = await SociologicalIntelligenceService.getDemographics(req);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Error in getDemographics controller:", error);
            res.status(500).json({ success: false, error: 'Failed to generate demographic analysis.' });
        }
    }
}

module.exports = SociologicalIntelligenceController;
