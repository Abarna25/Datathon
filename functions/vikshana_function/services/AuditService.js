/**
 * AuditService
 * Gracefully logs events to console when database logging is disabled or unavailable.
 */
class AuditService {
    /**
     * Gracefully log user action events to console (stdout/stderr) since AuditLog is a non-existent database table.
     */
    static async logEvent(req, user, action, resource = '', caseId = '', status = 'SUCCESS') {
        const timestamp = new Date().toISOString();
        const user_name = user?.name || user?.email || 'System';
        const role = user?.role || 'Officer';
        
        console.warn(`[AUDIT WARNING] ${timestamp} | User: ${user_name} (${role}) | Action: ${action} | Resource: ${resource} | CaseMasterID: ${caseId} | Status: ${status}`);
        return null;
    }

    /**
     * Returns an empty list since database audit log persistence is disabled.
     */
    static async getLogs(req, filters = {}) {
        console.warn('[AuditService] getLogs called but database audit logging is disabled.');
        return [];
    }
}

module.exports = AuditService;
