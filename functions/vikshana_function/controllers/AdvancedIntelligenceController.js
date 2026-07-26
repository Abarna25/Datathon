const AdvancedIntelligenceService = require('../services/AdvancedIntelligenceService');

class AdvancedIntelligenceController {
    static async getFullScan(req, res) {
        try {
            const { caseId } = req.params;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required' });
            }

            console.log(`[AdvancedIntelligenceController] Initiating full scan for Case ${caseId}`);
            
            const intelligenceData = await AdvancedIntelligenceService.getFullScan(req, caseId);
            
            return res.json({
                success: true,
                data: intelligenceData
            });

        } catch (error) {
            console.error('[AdvancedIntelligenceController] Error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to generate advanced intelligence',
                details: error.message
            });
        }
    }
}

module.exports = AdvancedIntelligenceController;
