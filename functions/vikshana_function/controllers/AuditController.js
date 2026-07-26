const AuditService = require('../services/AuditService');

class AuditController {
    /**
     * Retrieves audit logs with optional filters (Admin Only).
     */
    static async getLogs(req, res) {
        try {
            const filters = {
                action: req.query.action,
                user_id: req.query.user_id,
                case_id: req.query.case_id,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };
            const logs = await AuditService.getLogs(req, filters);
            return res.json({ success: true, data: logs });
        } catch (error) {
            console.error('[AuditController] Error fetching logs:', error);
            return res.status(200).json({ success: false, data: [] });
        }
    }

    /**
     * Creates an audit log from the client-side (e.g. Exported PDF).
     */
    static async createLog(req, res) {
        try {
            const { action, resource, case_id, status } = req.body;
            
            if (!action) {
                return res.status(400).json({ success: false, error: 'Action is required' });
            }

            const logData = await AuditService.logEvent(
                req,
                req.user,
                action,
                resource,
                case_id,
                status || 'SUCCESS'
            );

            return res.status(201).json({ success: true, data: logData });
        } catch (error) {
            console.error('[AuditController] Error creating log:', error);
            return res.status(200).json({ success: false, data: [] });
        }
    }
}

module.exports = AuditController;
