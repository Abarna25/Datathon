const RelationshipService = require('../services/RelationshipService');

class RelationshipController {
    static async getNetwork(req, res) {
        try {
            const data = await RelationshipService.getNetwork(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error in RelationshipController:", error);
            res.status(500).json({ success: false, error: error.message || 'Failed to retrieve relationship network', data: { nodes: [], edges: [] } });
        }
    }
}

module.exports = RelationshipController;
