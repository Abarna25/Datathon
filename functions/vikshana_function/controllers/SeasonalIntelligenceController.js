const SeasonalEventIntelligenceService = require('../services/SeasonalEventIntelligenceService');

class SeasonalIntelligenceController {
    static async getSeasonalIntelligence(req, res) {
        try {
            const data = await SeasonalEventIntelligenceService.getSeasonalIntelligence(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error in SeasonalIntelligenceController:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = SeasonalIntelligenceController;
