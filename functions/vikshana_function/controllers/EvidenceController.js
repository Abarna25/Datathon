const EvidenceService = require('../services/EvidenceService');
const AuditService = require('../services/AuditService');

class EvidenceController {
    static async getEvidence(req, res) {
        try {
            const data = await EvidenceService.getEvidence(req);
            AuditService.logEvent(req, req.user, 'Viewed Evidence', 'Evidence Dashboard', '', 'SUCCESS');
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error in EvidenceController:", error);
            res.status(500).json({ success: false, error: error.message || 'Failed to retrieve evidence', data: [] });
        }
    }
}

module.exports = EvidenceController;
