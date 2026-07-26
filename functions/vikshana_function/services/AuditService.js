const datastoreClient = require('../queries/datastoreClient');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCAL_AUDIT_DB_PATH = path.join(os.tmpdir(), 'vikshana_audit_fallback.json');
let localAuditDb = [];

try {
    if (fs.existsSync(LOCAL_AUDIT_DB_PATH)) {
        localAuditDb = JSON.parse(fs.readFileSync(LOCAL_AUDIT_DB_PATH, 'utf8'));
    } else {
        // Create a dummy report entry initially if file doesn't exist
        localAuditDb = [
            {
                log_id: 'AUDIT-1001',
                timestamp: new Date().toISOString(),
                user_name: 'Inspector Vikram',
                role: 'Senior Investigating Officer',
                action: 'Downloaded PDF',
                resource: 'Forensic Ballistics Report',
                case_id: 'CASE-2026-991A',
                status: 'SUCCESS',
                ip_address: '192.168.1.104',
                browser: 'Chrome 122 / Windows 11',
                aiReasoning: '',
                confidence: '',
                evidenceSources: '[]'
            },
            {
                log_id: 'AUDIT-1002',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                user_name: 'Unknown User',
                role: 'Guest',
                action: 'Unauthorized Access Attempt',
                resource: 'Witness Details',
                case_id: 'CASE-2026-991A',
                status: 'FAILED',
                ip_address: '203.0.113.45',
                browser: 'Firefox 120 / Ubuntu',
                aiReasoning: '',
                confidence: '',
                evidenceSources: '[]'
            }
        ];
        fs.writeFileSync(LOCAL_AUDIT_DB_PATH, JSON.stringify(localAuditDb, null, 2));
    }
} catch (e) {
    console.error('Failed to load local audit fallback db:', e.message);
}

function saveLocalAuditDb() {
    try {
        fs.writeFileSync(LOCAL_AUDIT_DB_PATH, JSON.stringify(localAuditDb, null, 2));
    } catch (e) {}
}

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
        
        try {
            await datastoreClient.insertRow(req, 'AuditLog', logEntry);
            console.log(`[FORENSIC AUDIT] ${timestamp} | User: ${user_name} | Action: ${action}`);
        } catch (error) {
            console.error('[FORENSIC AUDIT ERROR] Failed to save to datastore, falling back to local file');
            localAuditDb.unshift(logEntry);
            saveLocalAuditDb();
        }
        
        return logEntry;
    }

    /**
     * Retrieves audit logs (Admin Only)
     */
    static async getLogs(req, filters = {}) {
        try {
            const logs = await datastoreClient.getRows(req, 'AuditLog', { maxRows: 100 });
            return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('[AuditService] getLogs error (falling back to local cache)');
            return localAuditDb.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }
}

module.exports = AuditService;
