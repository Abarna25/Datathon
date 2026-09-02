const CommunityDetectionService = require('../services/CommunityDetectionService');

class CommunityDetectionController {
    static async detectCommunities(req, res) {
        try {
            const data = await CommunityDetectionService.detectCommunities(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error in CommunityDetectionController:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = CommunityDetectionController;
