const datastoreClient = require('../queries/datastoreClient');

/**
 * AuditService
 * Logs all forensic investigation details including AI reasoning.
 */
class AuditService {
    /**
     * Logs forensic event with AI rationale and evidence sources.
     */
    static async logEvent(req, user, action, resource = '', caseId = '', status = 'SUCCESS', aiReasoning = '', confidence = '', evidenceSources = []) {
        const timestamp = new Date().toISOString();
        const user_name = user?.name || user?.email || 'System';
        const role = user?.role || 'Officer';
        
        const logEntry = {
            timestamp,
            user_name,
            role,
            action,
            resource,
            caseId,
            status,
            aiReasoning,
            confidence,
            evidenceSources: JSON.stringify(evidenceSources)
        };
        
        try {
            await datastoreClient.insertRow(req, 'AuditLog', logEntry);
            console.log(`[FORENSIC AUDIT] ${timestamp} | User: ${user_name} | Action: ${action}`);
        } catch (error) {
            console.error('[FORENSIC AUDIT ERROR] Failed to save to datastore, falling back to console:', error);
            console.warn(`[AUDIT FALLBACK]`, logEntry);
        }
        
        return logEntry;
    }

    /**
     * Retrieves audit logs (Admin Only)
     */
    static async getLogs(req, filters = {}) {
        try {
            return await datastoreClient.getRows(req, 'AuditLog', { maxRows: 100 });
        } catch (error) {
            console.error('[AuditService] getLogs error:', error);
            return [];
        }
    }
}

module.exports = AuditService;
