const datastoreClient = require('../queries/datastoreClient');
const fs = require('fs');
const path = require('path');
const os = require('os');


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
            log_id: `AUDIT-${Date.now()}`,
            timestamp,
            user_name,
            role,
            action,
            resource,
            case_id: caseId,
            status,
            ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',
            browser: req.headers && req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) : 'Unknown',
            aiReasoning,
            confidence,
            evidenceSources: JSON.stringify(evidenceSources)
        };
        
        if (process.env.NODE_ENV === 'test' || !req || !req.headers) {
            return logEntry;
        }

        try {
            await datastoreClient.insertRow(req, 'AuditLog', logEntry);
            console.log(`[FORENSIC AUDIT] ${timestamp} | User: ${user_name} | Action: ${action}`);
        } catch (error) {
            if (error.code === 'SCHEMA_MISMATCH') {
                console.warn('[FORENSIC AUDIT] Warning: AuditLog table does not exist in Catalyst. Auditing is temporarily disabled.');
            } else {
                console.error(`[FORENSIC AUDIT ERROR] Failed to save to datastore:`, error.message || error);
            }
        }

        
        return logEntry;
    }

    /**
     * Helper alias for logging actions with object parameters
     */
    static async logAction(req, { action, resource = '', caseId = '', status = 'SUCCESS', aiReasoning = '', confidence = '', evidenceSources = [] }) {
        return this.logEvent(req, req?.user, action, resource, caseId, status, aiReasoning, confidence, evidenceSources);
    }

    /**
     * Retrieves audit logs (Admin Only)
     */
    static async getLogs(req, filters = {}) {
        try {
            const logs = await datastoreClient.getRows(req, 'AuditLog', { maxRows: 100 });
            return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            if (error.code === 'SCHEMA_MISMATCH') {
                console.warn('[AuditService] Warning: AuditLog table does not exist. Returning empty audit history.');
            } else {
                console.error(`[AuditService] getLogs error:`, error.message || error);
            }
            return [];
        }
    }
}

module.exports = AuditService;
