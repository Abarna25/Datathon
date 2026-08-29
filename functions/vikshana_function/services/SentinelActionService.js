/**
 * SentinelActionService.js
 * VIKSHANA SENTINEL — Action Queue, Evidence-Grounded Recommendations & Human-in-the-Loop Audit
 * 
 * Manages:
 * 1. Action Item generation from triage findings with strict evidence grounding
 * 2. In-memory & Datastore review queue states (AWAITING_REVIEW, APPROVED, DISMISSED)
 * 3. 1-Click drill-down deep linking to investigation workspace tabs
 * 4. Immutable human approval audit logging via AuditService
 */

const datastoreClient = require('../queries/datastoreClient');
const AuditService = require('./AuditService');
const SignalService = require('./SignalService');
const digestUtil = require('../utils/digestUtil');

// In-memory cache for fast state retrieval and local serverless runtime
const actionStore = new Map();
const decisionLogs = [];

class SentinelActionService {
    /**
     * Synthesizes actionable recommendations for a case based on triage scoring and engine findings.
     * @param {Object} scoreResult Result from SentinelScoringService
     * @param {Object} context Case context
     * @param {Object} engineResults Results from 7 reasoning engines
     * @returns {Array<Object>} List of formulated SentinelActionItems
     */
    static generateActionItems(scoreResult, context, engineResults = {}) {
        const { caseId, caseNumber, totalScore, severity, breakdown, summaryReasons, evidenceSources } = scoreResult;
        const leads = engineResults.leads?.leads || [];
        const gapsData = engineResults.gaps || {};
        const moAnalysis = engineResults.moAnalysis || {};
        const detectedGaps = gapsData.gaps || [];

        const actions = [];
        let seq = 1;

        // 1. High-Priority Action: Repeat Offender / Cross-Case Suspect Verification
        const repeatLead = leads.find(l => l.type === 'CrossCaseSuspect' || /repeat/i.test(l.title || ''));
        if (repeatLead) {
            const suspectName = repeatLead.relatedEntities?.[0] || 'Suspect';
            const relatedCases = repeatLead.relatedCases || [];
            actions.push({
                actionId: `ACT-SENTINEL-${caseId}-${String(seq++).padStart(2, '0')}`,
                caseId: String(caseId),
                caseNumber,
                priorityScore: totalScore,
                severity: 'CRITICAL',
                title: `Cross-Jurisdiction Suspect Verification: ${suspectName}`,
                finding: `Accused "${suspectName}" matches active records in Case #${relatedCases.join(', #')} with high operational overlap.`,
                recommendedAction: `Inspect interrogation dockets in Case #${relatedCases[0] || 'historical'} and execute inter-station coordination notice.`,
                evidenceSources: [
                    { type: 'Accused', id: suspectName, label: `Accused: ${suspectName}` },
                    ...relatedCases.map(cid => ({ type: 'CaseMaster', id: cid, label: `Linked Case #${cid}` }))
                ],
                drillDown: {
                    tab: 'leads',
                    targetEntityId: suspectName,
                    deepLink: `/investigate/${caseId}?tab=leads&highlight=repeat_offender`
                },
                confidence: repeatLead.confidence || 0.92,
                status: 'AWAITING_REVIEW',
                generatedAt: new Date().toISOString()
            });
        }

        // 2. Action: Investigation Inactivity & Procedural Gap Remediation
        if (breakdown.staleness.score >= 15 || detectedGaps.some(g => g.category === 'Statutory Compliance' || g.severity === 'CRITICAL')) {
            const primeGap = detectedGaps.find(g => g.category === 'Statutory Compliance') || detectedGaps[0] || { title: 'Dormancy Gap Detected', statutoryImpact: 'Statutory Remand Audit' };
            actions.push({
                actionId: `ACT-SENTINEL-${caseId}-${String(seq++).padStart(2, '0')}`,
                caseId: String(caseId),
                caseNumber,
                priorityScore: Math.max(75, totalScore - 5),
                severity: breakdown.staleness.score >= 20 ? 'CRITICAL' : 'HIGH',
                title: `Dormancy Remediation: ${primeGap.title}`,
                finding: `${scoreResult.daysSinceActivity} days elapsed without active case diary progress; statutory compliance clock running.`,
                recommendedAction: `Review Section 167(2) CrPC/BNSS remand timeline and schedule formal case diary update with Circle Inspector.`,
                evidenceSources: [
                    { type: 'TimelineStaleness', id: `STALE-${scoreResult.daysSinceActivity}D`, label: `${scoreResult.daysSinceActivity} days inactive` },
                    { type: 'StatutoryImpact', id: 'CRPC-167', label: primeGap.statutoryImpact || 'Statutory Compliance' }
                ],
                drillDown: {
                    tab: 'timeline-intel',
                    targetEntityId: 'TIMELINE-GAP',
                    deepLink: `/investigate/${caseId}?tab=timeline-intel&highlight=gap`
                },
                confidence: 0.95,
                status: 'AWAITING_REVIEW',
                generatedAt: new Date().toISOString()
            });
        }

        // 3. Action: Physical / Digital Evidence Seizure & Lab Verification
        if (breakdown.investigationGap.score >= 10 || (context.evidence || []).length === 0) {
            actions.push({
                actionId: `ACT-SENTINEL-${caseId}-${String(seq++).padStart(2, '0')}`,
                caseId: String(caseId),
                caseNumber,
                priorityScore: Math.max(65, totalScore - 10),
                severity: 'HIGH',
                title: 'Collect Physical Exhibits & Issue 65B Digital Notice',
                finding: 'Case docket lacks cataloged physical evidence exhibits and transit CCTV surveillance preservation.',
                recommendedAction: 'Serve statutory Section 65B Evidence Act preservation orders on commercial establishments along suspect transit corridors.',
                evidenceSources: [
                    { type: 'ForensicDeficit', id: 'NO-EVIDENCE', label: 'Zero Evidence Records in Vault' },
                    { type: 'Statute', id: 'SEC-65B-IEA', label: 'Digital Preservation Notice (Sec 65B)' }
                ],
                drillDown: {
                    tab: 'evidence',
                    targetEntityId: 'EVIDENCE-CHAIN',
                    deepLink: `/investigate/${caseId}?tab=evidence&highlight=seizure`
                },
                confidence: 0.89,
                status: 'AWAITING_REVIEW',
                generatedAt: new Date().toISOString()
            });
        }

        // 4. Action: Modus Operandi Matching & Syndicate Pattern Check
        const topMO = (moAnalysis.matchedHistoricalCases || [])[0];
        if (topMO && topMO.moSimilarity >= 0.75) {
            actions.push({
                actionId: `ACT-SENTINEL-${caseId}-${String(seq++).padStart(2, '0')}`,
                caseId: String(caseId),
                caseNumber,
                priorityScore: Math.max(60, totalScore - 15),
                severity: 'MEDIUM',
                title: `MO Signature Match with Case #${topMO.caseId}`,
                finding: `Operational crime vectors match Case #${topMO.caseId} (${topMO.matchedAttributes.join(', ')}).`,
                recommendedAction: `Compare recovery panchanama and vehicle seizure logs with historical Case #${topMO.caseId}.`,
                evidenceSources: [
                    { type: 'CaseMaster', id: topMO.caseId, label: `Historical Case #${topMO.caseId}` },
                    { type: 'MOSignature', id: 'MO-MATCH', label: topMO.matchedAttributes.join(', ') }
                ],
                drillDown: {
                    tab: 'mo',
                    targetEntityId: `MO-${topMO.caseId}`,
                    deepLink: `/investigate/${caseId}?tab=mo&highlight=pattern_match`
                },
                confidence: topMO.moSimilarity,
                status: 'AWAITING_REVIEW',
                generatedAt: new Date().toISOString()
            });
        }

        // Save generated actions to local action store
        actions.forEach(a => {
            const existing = actionStore.get(a.actionId);
            if (existing && (existing.status === 'APPROVED' || existing.status === 'DISMISSED')) {
                // Preserve officer decision state
                a.status = existing.status;
                a.reviewedBy = existing.reviewedBy;
                a.reviewedAt = existing.reviewedAt;
                a.decisionReason = existing.decisionReason;
            }
            actionStore.set(a.actionId, a);
        });

        return actions;
    }

    /**
     * Retrieves all active action items with optional filters.
     */
    static getActionQueue(filters = {}) {
        let list = Array.from(actionStore.values());

        if (filters.caseId) {
            list = list.filter(a => String(a.caseId) === String(filters.caseId));
        }
        if (filters.status) {
            list = list.filter(a => a.status === filters.status);
        }
        if (filters.severity) {
            list = list.filter(a => a.severity === filters.severity);
        }

        // Sort by priorityScore descending, then generatedAt descending
        return list.sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.generatedAt) - new Date(a.generatedAt));
    }

    /**
     * Approves a Sentinel action recommendation (Human-in-the-Loop decision).
     */
    static async approveAction(req, actionId, { officerId, officerName, role, reason }) {
        let action = actionStore.get(actionId);
        if (!action) {
            // Check if exists in Datastore
            const stored = await datastoreClient.getRowWhere(req, 'SentinelActionItem', { actionId }).catch(() => null);
            if (stored) action = stored;
        }

        if (!action) {
            throw new Error(`Sentinel Action item ${actionId} not found.`);
        }

        const timestamp = new Date().toISOString();
        const userObj = req?.user || { id: officerId || 'officer', name: officerName || 'Investigating Officer', role: role || 'Investigator' };
        
        action.status = 'APPROVED';
        action.reviewedBy = userObj.name;
        action.reviewedAt = timestamp;
        action.decisionReason = reason || 'Approved by investigating officer for execution.';

        actionStore.set(actionId, action);

        // Update Datastore
        await datastoreClient.updateRow(req, 'SentinelActionItem', action.ROWID || actionId, {
            status: 'APPROVED',
            decisionReason: action.decisionReason
        }).catch(() => null);

        // Calculate cryptographic evidence digest
        const evidenceDigest = `SHA256:${digestUtil.calculateSHA256Digest(`${action.actionId}-${action.caseId}-APPROVED-${timestamp}`)}`;

        const decisionRecord = {
            decisionId: `DEC-${Date.now()}`,
            actionId,
            caseId: action.caseId,
            officerId: userObj.id || 'officer',
            officerName: userObj.name || 'Officer',
            role: userObj.role || 'Investigator',
            decision: 'APPROVED',
            decisionReason: action.decisionReason,
            actionExecuted: 'PROCEDURAL_INTERVENTION_TRIGGERED',
            timestamp,
            evidenceHash: evidenceDigest
        };

        decisionLogs.push(decisionRecord);
        await datastoreClient.insertRow(req, 'SentinelDecisionLog', decisionRecord).catch(() => null);

        // Immutable Audit Log
        await AuditService.logAction(req, {
            action: 'SENTINEL_ACTION_APPROVED',
            resource: `SentinelAction:${actionId}`,
            caseId: action.caseId,
            status: 'SUCCESS',
            aiReasoning: action.finding,
            confidence: String(action.confidence),
            evidenceSources: action.evidenceSources
        });

        // Broadcast real-time signal
        await SignalService.publish(req, 'SENTINEL_ACTION_APPROVED', {
            actionId,
            caseId: action.caseId,
            officer: userObj.name,
            timestamp
        });

        return { success: true, action, decisionRecord };
    }

    /**
     * Dismisses a Sentinel action recommendation (Human-in-the-Loop decision).
     */
    static async dismissAction(req, actionId, { officerId, officerName, role, reason }) {
        let action = actionStore.get(actionId);
        if (!action) {
            const stored = await datastoreClient.getRowWhere(req, 'SentinelActionItem', { actionId }).catch(() => null);
            if (stored) action = stored;
        }

        if (!action) {
            throw new Error(`Sentinel Action item ${actionId} not found.`);
        }

        const timestamp = new Date().toISOString();
        const userObj = req?.user || { id: officerId || 'officer', name: officerName || 'Investigating Officer', role: role || 'Investigator' };

        action.status = 'DISMISSED';
        action.reviewedBy = userObj.name;
        action.reviewedAt = timestamp;
        action.decisionReason = reason || 'Dismissed upon officer procedural review.';

        actionStore.set(actionId, action);

        await datastoreClient.updateRow(req, 'SentinelActionItem', action.ROWID || actionId, {
            status: 'DISMISSED',
            decisionReason: action.decisionReason
        }).catch(() => null);

        const evidenceDigest = `SHA256:${digestUtil.calculateSHA256Digest(`${action.actionId}-${action.caseId}-DISMISSED-${timestamp}`)}`;


        const decisionRecord = {
            decisionId: `DEC-${Date.now()}`,
            actionId,
            caseId: action.caseId,
            officerId: userObj.id || 'officer',
            officerName: userObj.name || 'Officer',
            role: userObj.role || 'Investigator',
            decision: 'DISMISSED',
            decisionReason: action.decisionReason,
            actionExecuted: 'RECOMMENDATION_DISMISSED',
            timestamp,
            evidenceHash: evidenceDigest
        };

        decisionLogs.push(decisionRecord);
        await datastoreClient.insertRow(req, 'SentinelDecisionLog', decisionRecord).catch(() => null);

        await AuditService.logAction(req, {
            action: 'SENTINEL_ACTION_DISMISSED',
            resource: `SentinelAction:${actionId}`,
            caseId: action.caseId,
            status: 'SUCCESS',
            aiReasoning: action.finding,
            confidence: String(action.confidence),
            evidenceSources: action.evidenceSources
        });

        await SignalService.publish(req, 'SENTINEL_ACTION_DISMISSED', {
            actionId,
            caseId: action.caseId,
            officer: userObj.name,
            timestamp
        });

        return { success: true, action, decisionRecord };
    }

    /**
     * Retrieves decision audit logs.
     */
    static getDecisionLogs(filters = {}) {
        let logs = [...decisionLogs];
        if (filters.caseId) {
            logs = logs.filter(l => String(l.caseId) === String(filters.caseId));
        }
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

module.exports = SentinelActionService;
