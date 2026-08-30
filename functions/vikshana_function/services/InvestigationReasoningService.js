/**
 * InvestigationReasoningService.js
 * VIKSHANA 2.0 Core Intelligence Engine — Novel Engine #1
 * 
 * Synthesizes comprehensive case data (FIR, Accused, Victims, Complainants, Arrests,
 * Chargesheets, Forensic Evidence, Timeline, Anomalies, Similar Cases) into prioritized,
 * evidence-backed investigative leads with verifiable provenance and verification actions.
 */

const ContextBuilderService = require('./ContextBuilderService');
const SimilarCaseService = require('./SimilarCaseService');
const AnomalyDetectionService = require('./AnomalyDetectionService');
const datastoreClient = require('../queries/datastoreClient');
const LLMService = require('./LLMService');

class InvestigationReasoningService {
    /**
     * Generates prioritized investigative leads for an active case.
     */
    static async generateLeads(req, caseId) {
        const startTime = Date.now();
        const context = await ContextBuilderService.buildCaseContext(req, caseId);
        
        if (!context || !context.case) {
            return {
                caseId,
                leadCount: 0,
                leads: [],
                executionTimeMs: Date.now() - startTime
            };
        }

        const anomalies = AnomalyDetectionService.detectAnomalies(context);
        const similarCasesRes = await SimilarCaseService.findSimilarCases(req, caseId).catch(() => ({ similarCases: [] }));
        const similarCases = similarCasesRes.similarCases || [];

        const leads = [];
        let leadCounter = 1;

        // 1. Lead: Cross-Case Suspect Correlation (Evidence-Backed)
        if (context.suspects && context.suspects.length > 0) {
            for (const suspect of context.suspects) {
                const suspectName = String(suspect.name || '').trim();
                if (suspectName && suspectName !== 'Unknown') {
                    const matchRows = await datastoreClient.getRowsWhere(req, 'Accused', { AccusedName: suspectName }, { maxRows: 10 }).catch(() => []);
                    const otherCaseIds = [...new Set(matchRows.map(r => r.CaseMasterID).filter(cid => cid && String(cid) !== String(caseId)))];

                    if (otherCaseIds.length > 0) {
                        leads.push({
                            leadId: `LEAD-${caseId}-${String(leadCounter++).padStart(2, '0')}`,
                            title: `Repeat Offender Correlation: ${suspectName}`,
                            priority: 'HIGH',
                            type: 'CrossCaseSuspect',
                            finding: `Accused "${suspectName}" is linked to ${otherCaseIds.length} other registered criminal case(s) in Karnataka Datastore (Case #${otherCaseIds.join(', Case #')}).`,
                            supportingEvidence: [`Accused: ${suspectName}`, ...otherCaseIds.map(cid => `Case #${cid}`)],
                            relatedCases: otherCaseIds,
                            relatedEntities: [suspectName],
                            reasoning: 'Individuals repeatedly involved in crime events warrant priority verification.',
                            recommendedVerification: 'Check current custody status and verify alibi against CCTV/CDR timelines.',
                            status: 'OPEN',
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 2. Lead: Modus Operandi & Similar Case Cluster (AI-Inferred / Evidence-Backed)
        if (similarCases.length > 0 && similarCases[0].similarityScore >= 0.70) {
            const topMatch = similarCases[0];
            leads.push({
                leadId: `LEAD-${caseId}-${String(leadCounter++).padStart(2, '0')}`,
                title: `High MO Similarity with Case #${topMatch.caseId}`,
                priority: topMatch.similarityScore >= 0.85 ? 'HIGH' : 'MEDIUM',
                type: 'ModusOperandiCluster',
                finding: `Current case shares ${(topMatch.similarityScore * 100).toFixed(0)}% operational similarity with Case #${topMatch.caseId} (${topMatch.category || 'Similar Category'}).`,
                supportingEvidence: [`Case #${topMatch.caseId}`, `Crime Category: ${topMatch.category || 'Matched'}`, `Keyword Overlap: ${(topMatch.reasons || []).join(', ')}`],
                relatedCases: [String(topMatch.caseId)],
                relatedEntities: topMatch.suspects || [],
                reasoning: `Shared crime category, geographic proximity, and overlapping narrative keywords suggest possible shared perpetrators or copycat pattern.`,
                recommendedVerification: `Compare CCTV footage, vehicle descriptions, and weapon seizure records between Case #${caseId} and Case #${topMatch.caseId}.`,
                status: 'OPEN',
                createdAt: new Date().toISOString()
            });
        }

        // 3. Lead: Procedural & Evidentiary Anomaly Remediation (Confirmed Procedural Gap)
        if (anomalies.length > 0) {
            const highAnomalies = anomalies.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
            if (highAnomalies.length > 0) {
                const primeAnomaly = highAnomalies[0];
                leads.push({
                    leadId: `LEAD-${caseId}-${String(leadCounter++).padStart(2, '0')}`,
                    title: `Evidentiary Discrepancy: ${primeAnomaly.title || primeAnomaly.anomalyType}`,
                    priority: 'HIGH',
                    type: 'ProceduralAnomaly',
                    finding: primeAnomaly.description || primeAnomaly.message,
                    supportingEvidence: [primeAnomaly.title || 'Timeline/Arrest Anomaly'],
                    relatedCases: [String(caseId)],
                    relatedEntities: [],
                    reasoning: 'Identified contextual anomalies conflict with standard investigation baseline models.',
                    recommendedVerification: primeAnomaly.recommendation || `Inspect occurrence timestamps and verify arrest memo documentation with precinct officer.`,
                    status: 'ACTION_REQUIRED',
                    createdAt: new Date().toISOString()
                });
            }
        }

        // 4. Lead: Missing Witness / Complainant Corroboration
        if (!context.witnesses || context.witnesses.length === 0) {
            leads.push({
                leadId: `LEAD-${caseId}-${String(leadCounter++).padStart(2, '0')}`,
                title: 'Witness Statement Documentation Required',
                priority: 'MEDIUM',
                type: 'MissingCorroboration',
                finding: 'No independent complainant/witness statements are currently recorded in the case docket.',
                supportingEvidence: ['ComplainantDetails: 0 records'],
                relatedCases: [String(caseId)],
                relatedEntities: [],
                reasoning: 'Independent corroboration is essential for court presentation.',
                recommendedVerification: 'Canvas neighborhood near incident coordinates and record statements from immediate first responders.',
                status: 'OPEN',
                createdAt: new Date().toISOString()
            });
        }

        // 5. Lead: Unlinked Arrest Identification
        const unlinkedArrests = (context.timeline || []).filter(t => t.source_type === 'arrest_record' && !t.chargesheet_linked);
        if (unlinkedArrests.length > 0) {
            leads.push({
                leadId: `LEAD-${caseId}-${String(leadCounter++).padStart(2, '0')}`,
                title: 'Arrestee Pending Chargesheet Finalization',
                priority: 'HIGH',
                type: 'StatutoryDeadline',
                finding: `${unlinkedArrests.length} logged arrest(s) lack statutory chargesheet filing records.`,
                supportingEvidence: ['ArrestSurrender Table', 'ChargesheetDetails Table'],
                relatedCases: [String(caseId)],
                relatedEntities: [],
                reasoning: 'A physical arrest requires a linked prosecution or release document.',
                recommendedVerification: 'Prepare final draft chargesheet and compile physical evidence chain of custody for public prosecutor review.',
                status: 'URGENT',
                createdAt: new Date().toISOString()
            });
        }

        return {
            caseId,
            leadCount: leads.length,
            leads,
            executionTimeMs: Date.now() - startTime
        };
    }
}

module.exports = InvestigationReasoningService;
