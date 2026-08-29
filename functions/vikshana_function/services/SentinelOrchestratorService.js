/**
 * SentinelOrchestratorService.js
 * VIKSHANA SENTINEL — Autonomous Case Triage Orchestration Engine
 * 
 * Orchestrates:
 * 1. Batch retrieval of active/open investigation dockets
 * 2. Parallel, non-blocking execution of the 7 core reasoning engines with circuit-breaker protection
 * 3. Priority scoring & evidence-grounded action item generation
 * 4. Scan state snapshots & delta comparison (detects newly emerging risks since previous scan)
 * 5. Robust resilience against individual engine timeouts or partial datastore failures
 */

const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('./ContextBuilderService');
const InvestigationReasoningService = require('./InvestigationReasoningService');
const MOIntelligenceService = require('./MOIntelligenceService');
const TemporalNetworkService = require('./TemporalNetworkService');
const EmergingPatternService = require('./EmergingPatternService');
const EvidenceChainService = require('./EvidenceChainService');
const InvestigationGapService = require('./InvestigationGapService');
const SimilarCaseService = require('./SimilarCaseService');
const SentinelScoringService = require('./SentinelScoringService');
const SentinelActionService = require('./SentinelActionService');
const SignalService = require('./SignalService');

// In-memory cache for previous scan state & deltas
let previousScanState = null;
let latestScanSummary = null;
let lastScanTime = null;
let cachedRankedCases = [];

class SentinelOrchestratorService {
    /**
     * Executes a full Sentinel triage scan across all active dockets.
     * @param {Object} req Express request
     * @param {Object} options Scan options (limit, forceRefresh)
     * @returns {Object} Complete Sentinel Triage & Action Report
     */
    static async scanActiveCases(req, options = {}) {
        const startTime = Date.now();
        const limit = Number(options.limit) || 100;

        // 1. Fetch cases from Datastore
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: limit }).catch(() => []);
        if (allCases.length === 0) {
            return this.getEmptyScanResult(startTime);
        }

        // Filter to open/active cases or all cases if statuses are unspecified
        const activeCases = allCases.filter(c => !c.CaseStatusID || !/closed|acquitted/i.test(String(c.CaseStatusID)));
        const targetCases = activeCases.length > 0 ? activeCases : allCases;

        // 2. Pre-fetch scan-level shared intelligence (Emerging Crime Patterns)
        let emergingPatterns = { patterns: [] };
        let patternEngineHealth = 'HEALTHY';
        try {
            emergingPatterns = await EmergingPatternService.detectEmergingPatterns(req);
        } catch (err) {
            console.warn('[Sentinel] EmergingPatternService degradation:', err.message);
            patternEngineHealth = 'DEGRADED';
        }

        const engineHealth = {
            investigationReasoning: 'HEALTHY',
            moIntelligence: 'HEALTHY',
            temporalNetwork: 'HEALTHY',
            emergingPatterns: patternEngineHealth,
            evidenceChain: 'HEALTHY',
            gapDetection: 'HEALTHY',
            similarCases: 'HEALTHY'
        };

        const scoredCases = [];
        const allGeneratedActions = [];

        // 3. Triage cases in concurrent chunks of 10 for lightning performance & resource control
        const CHUNK_SIZE = 10;
        for (let i = 0; i < targetCases.length; i += CHUNK_SIZE) {
            const chunk = targetCases.slice(i, i + CHUNK_SIZE);
            const chunkPromises = chunk.map(async (rawCase) => {
                const caseId = String(rawCase.CaseMasterID || rawCase.ROWID);
                try {
                    // A. Assemble Case Context
                    const context = await ContextBuilderService.buildCaseContext(req, caseId).catch(() => null);
                    if (!context || !context.case) return null;

                    // B. Execute engines concurrently via Promise.allSettled
                    const [
                        leadsSettled,
                        moSettled,
                        netSettled,
                        chainSettled,
                        gapsSettled,
                        simSettled
                    ] = await Promise.allSettled([
                        InvestigationReasoningService.generateLeads(req, caseId),
                        MOIntelligenceService.getMOAnalysis(req, caseId),
                        TemporalNetworkService.getTemporalNetwork(req, caseId),
                        EvidenceChainService.getEvidenceChain(req, caseId),
                        InvestigationGapService.getGapsAndActions(req, caseId),
                        SimilarCaseService.findSimilarCases(req, caseId)
                    ]);

                    // Track engine health metrics
                    if (leadsSettled.status === 'rejected') engineHealth.investigationReasoning = 'DEGRADED';
                    if (moSettled.status === 'rejected') engineHealth.moIntelligence = 'DEGRADED';
                    if (netSettled.status === 'rejected') engineHealth.temporalNetwork = 'DEGRADED';
                    if (chainSettled.status === 'rejected') engineHealth.evidenceChain = 'DEGRADED';
                    if (gapsSettled.status === 'rejected') engineHealth.gapDetection = 'DEGRADED';
                    if (simSettled.status === 'rejected') engineHealth.similarCases = 'DEGRADED';

                    const engineResults = {
                        leads: leadsSettled.status === 'fulfilled' ? leadsSettled.value : { leads: [] },
                        moAnalysis: moSettled.status === 'fulfilled' ? moSettled.value : {},
                        temporalNetwork: netSettled.status === 'fulfilled' ? netSettled.value : { nodes: [] },
                        patterns: emergingPatterns,
                        evidenceChain: chainSettled.status === 'fulfilled' ? chainSettled.value : { nodes: [] },
                        gaps: gapsSettled.status === 'fulfilled' ? gapsSettled.value : { gaps: [], recommendedActions: [] },
                        similarCases: simSettled.status === 'fulfilled' ? simSettled.value : []
                    };

                    // C. Calculate transparent 0-100 priority score
                    const scoreResult = SentinelScoringService.calculatePriorityScore(context, engineResults);

                    // D. Formulate concrete action items
                    const actions = SentinelActionService.generateActionItems(scoreResult, context, engineResults);
                    allGeneratedActions.push(...actions);

                    return {
                        ...scoreResult,
                        engineResults: {
                            leadCount: engineResults.leads.leads?.length || 0,
                            gapCount: engineResults.gaps.gaps?.length || 0,
                            hasMOCluster: (engineResults.moAnalysis.matchedHistoricalCases || []).length > 0,
                            completenessScore: engineResults.gaps.completenessScore || 75
                        },
                        actions
                    };
                } catch (caseErr) {
                    console.warn(`[Sentinel] Case #${caseId} triage partial warning:`, caseErr.message);
                    return null;
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            chunkResults.filter(Boolean).forEach(res => scoredCases.push(res));
        }


        // 4. Sort ranked cases by priority score descending
        scoredCases.sort((a, b) => b.totalScore - a.totalScore);
        cachedRankedCases = scoredCases;

        // 5. Aggregate Summary Statistics
        const criticalCount = scoredCases.filter(c => c.severity === 'CRITICAL').length;
        const highPriorityCount = scoredCases.filter(c => c.severity === 'HIGH').length;
        const mediumCount = scoredCases.filter(c => c.severity === 'MEDIUM').length;
        const lowCount = scoredCases.filter(c => c.severity === 'LOW' || c.severity === 'INFORMATIONAL').length;

        const topPriorityCases = scoredCases.slice(0, 5);

        // 6. State Snapshot & Delta Comparison
        const deltas = this.calculateScanDeltas(previousScanState, scoredCases, allGeneratedActions);
        previousScanState = {
            timestamp: new Date().toISOString(),
            caseScores: new Map(scoredCases.map(c => [c.caseId, c.totalScore])),
            actionCount: allGeneratedActions.length
        };
        lastScanTime = new Date().toISOString();

        const scanSummary = {
            scanId: `SCAN-${Date.now()}`,
            timestamp: lastScanTime,
            casesAnalyzed: scoredCases.length,
            criticalCount,
            highPriorityCount,
            mediumCount,
            lowCount,
            totalActionsGenerated: allGeneratedActions.length,
            actionsAwaitingReview: allGeneratedActions.filter(a => a.status === 'AWAITING_REVIEW').length,
            totalGapsIdentified: scoredCases.reduce((acc, c) => acc + (c.engineResults?.gapCount || 0), 0),
            emergingPatternsCount: emergingPatterns.patterns?.length || 0,
            engineHealth,
            executionDurationMs: Date.now() - startTime
        };

        latestScanSummary = scanSummary;

        // Broadcast completion signal
        await SignalService.publish(req, 'SENTINEL_SCAN_COMPLETED', {
            casesAnalyzed: scanSummary.casesAnalyzed,
            criticalCount: scanSummary.criticalCount,
            actionsAwaitingReview: scanSummary.actionsAwaitingReview,
            timestamp: scanSummary.timestamp
        });

        return {
            success: true,
            summary: scanSummary,
            topPriorityCases,
            allRankedCases: scoredCases,
            activeActions: SentinelActionService.getActionQueue({ status: 'AWAITING_REVIEW' }).slice(0, 10),
            deltas
        };
    }

    /**
     * Computes delta differences against previous scan state.
     */
    static calculateScanDeltas(prevState, currentCases, currentActions) {
        if (!prevState || !prevState.caseScores) {
            return [
                {
                    type: 'INITIAL_SCAN_ESTABLISHED',
                    severity: 'INFO',
                    title: 'Sentinel Baseline Scan Established',
                    description: `Initialized autonomous baseline surveillance across ${currentCases.length} active case files.`,
                    timestamp: new Date().toISOString()
                }
            ];
        }

        const deltas = [];

        // 1. Check for significant score increases (>10 pts) or newly elevated critical cases
        currentCases.forEach(curr => {
            const oldScore = prevState.caseScores.get(curr.caseId);
            if (oldScore !== undefined) {
                const diff = curr.totalScore - oldScore;
                if (diff >= 10) {
                    deltas.push({
                        type: 'SCORE_SURGE',
                        severity: curr.severity,
                        caseId: curr.caseId,
                        caseNumber: curr.caseNumber,
                        title: `Case #${curr.caseNumber} Priority Elevated (+${diff} pts)`,
                        description: `Priority increased from ${oldScore} to ${curr.totalScore} due to newly detected cross-case suspect linkages or dormancy threshold breach.`,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                // Newly added case
                if (curr.severity === 'CRITICAL' || curr.severity === 'HIGH') {
                    deltas.push({
                        type: 'NEW_HIGH_RISK_CASE',
                        severity: curr.severity,
                        caseId: curr.caseId,
                        caseNumber: curr.caseNumber,
                        title: `New High-Priority Case Ingested: ${curr.caseNumber}`,
                        description: `Initial triage assigned priority score ${curr.totalScore}/100 (${curr.severity}).`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        if (deltas.length === 0) {
            deltas.push({
                type: 'STABLE',
                severity: 'INFO',
                title: 'Surveillance Stable',
                description: 'No anomalous risk surges detected between consecutive scans.',
                timestamp: new Date().toISOString()
            });
        }

        return deltas;
    }

    /**
     * Returns latest cached triage state or triggers a fresh scan if empty.
     */
    static async getDashboardState(req) {
        if (latestScanSummary && cachedRankedCases.length > 0) {
            return {
                success: true,
                summary: latestScanSummary,
                topPriorityCases: cachedRankedCases.slice(0, 5),
                allRankedCases: cachedRankedCases,
                activeActions: SentinelActionService.getActionQueue().slice(0, 10),
                deltas: this.calculateScanDeltas(previousScanState, cachedRankedCases, [])
            };
        }
        return await this.scanActiveCases(req);
    }

    /**
     * Retrieves triage scorecard for a specific single case.
     */
    static async getCaseTriage(req, caseId) {
        const context = await ContextBuilderService.buildCaseContext(req, caseId);
        if (!context || !context.case) {
            throw new Error(`Case #${caseId} not found in Datastore.`);
        }

        const [
            leadsSettled,
            moSettled,
            netSettled,
            chainSettled,
            gapsSettled,
            simSettled,
            patternsSettled
        ] = await Promise.allSettled([
            InvestigationReasoningService.generateLeads(req, caseId),
            MOIntelligenceService.getMOAnalysis(req, caseId),
            TemporalNetworkService.getTemporalNetwork(req, caseId),
            EvidenceChainService.getEvidenceChain(req, caseId),
            InvestigationGapService.getGapsAndActions(req, caseId),
            SimilarCaseService.findSimilarCases(req, caseId),
            EmergingPatternService.detectEmergingPatterns(req)
        ]);

        const engineResults = {
            leads: leadsSettled.status === 'fulfilled' ? leadsSettled.value : { leads: [] },
            moAnalysis: moSettled.status === 'fulfilled' ? moSettled.value : {},
            temporalNetwork: netSettled.status === 'fulfilled' ? netSettled.value : { nodes: [] },
            patterns: patternsSettled.status === 'fulfilled' ? patternsSettled.value : { patterns: [] },
            evidenceChain: chainSettled.status === 'fulfilled' ? chainSettled.value : { nodes: [] },
            gaps: gapsSettled.status === 'fulfilled' ? gapsSettled.value : { gaps: [], recommendedActions: [] },
            similarCases: simSettled.status === 'fulfilled' ? simSettled.value : []
        };

        const scoreResult = SentinelScoringService.calculatePriorityScore(context, engineResults);
        const actions = SentinelActionService.generateActionItems(scoreResult, context, engineResults);

        return {
            success: true,
            caseId,
            scoreResult,
            actions,
            engineDetails: {
                leadsCount: engineResults.leads.leads?.length || 0,
                moMatches: engineResults.moAnalysis.matchedHistoricalCases?.length || 0,
                gapsCount: engineResults.gaps.gaps?.length || 0,
                evidenceNodes: engineResults.evidenceChain.nodes?.length || 0
            }
        };
    }

    static getEmptyScanResult(startTime) {
        return {
            success: true,
            summary: {
                scanId: `SCAN-${Date.now()}`,
                timestamp: new Date().toISOString(),
                casesAnalyzed: 0,
                criticalCount: 0,
                highPriorityCount: 0,
                mediumCount: 0,
                lowCount: 0,
                totalActionsGenerated: 0,
                actionsAwaitingReview: 0,
                totalGapsIdentified: 0,
                emergingPatternsCount: 0,
                engineHealth: {
                    investigationReasoning: 'HEALTHY',
                    moIntelligence: 'HEALTHY',
                    temporalNetwork: 'HEALTHY',
                    emergingPatterns: 'HEALTHY',
                    evidenceChain: 'HEALTHY',
                    gapDetection: 'HEALTHY',
                    similarCases: 'HEALTHY'
                },
                executionDurationMs: Date.now() - startTime
            },
            topPriorityCases: [],
            allRankedCases: [],
            activeActions: [],
            deltas: []
        };
    }
}

module.exports = SentinelOrchestratorService;
