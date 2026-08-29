/**
 * test_sentinel_e2e.js
 * End-to-end verification script for VIKSHANA SENTINEL (Autonomous Case Triage & Action Agent).
 */

const SentinelScoringService = require('./services/SentinelScoringService');
const SentinelActionService = require('./services/SentinelActionService');
const SentinelOrchestratorService = require('./services/SentinelOrchestratorService');
const SchedulerService = require('./services/SchedulerService');

async function runTests() {
    console.log('================================================================');
    console.log('🚀 STARTING VIKSHANA SENTINEL END-TO-END VERIFICATION');
    console.log('================================================================\n');

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passedTests++;
        } else {
            console.error(`❌ [FAIL] ${testName} - ${details}`);
            failedTests++;
        }
    }

    const mockReq = {
        user: { id: 'test_officer_01', name: 'Inspector Vijay Gowda', role: 'Investigator' }
    };

    // TEST 1: Deterministic Transparent Priority Scoring
    console.log('--- TEST SUITE 1: Transparent Priority Scoring ---');
    try {
        const mockContext = {
            case: {
                caseId: '101',
                caseNumber: 'CR-101/2025',
                title: 'Commercial Jewel Theft with Broken Shutter',
                GravityOffenceID: 3,
                CaseCategoryID: 2,
                jurisdiction: 'Station 101',
                date: '2025-01-01T00:00:00.000Z'
            },
            suspects: [
                { name: 'Ramesh Kumar', repeat_offender: true, ROWID: 'ACC-01' },
                { name: 'Suresh Rao', ROWID: 'ACC-02' }
            ],
            victims: [{ name: 'Anand Varma', age: 72, ROWID: 'VIC-01' }],
            timeline: [{ source_type: 'occurrence_record', event_time: '2025-01-01' }],
            chargesheet: [],
            evidence: []
        };

        const mockEngines = {
            leads: {
                leads: [{ type: 'CrossCaseSuspect', title: 'Accused Ramesh Kumar matches Case #102', relatedEntities: ['Ramesh Kumar'], relatedCases: ['102', '187'], confidence: 0.94 }]
            },
            moAnalysis: {
                matchedHistoricalCases: [{ caseId: '102', moSimilarity: 0.85, matchedAttributes: ['Commercial Entry', 'Lock Tampering'] }]
            },
            gaps: {
                completenessScore: 45,
                gaps: [
                    { gapId: 'GAP-01', category: 'Forensics', title: 'No Physical Evidence Recorded', severity: 'HIGH' },
                    { gapId: 'GAP-02', category: 'Witnesses', title: 'Zero Independent Witness Statements', severity: 'CRITICAL' },
                    { gapId: 'GAP-03', category: 'Statutory Compliance', title: 'Statutory Remand Limit Approaching', severity: 'HIGH' }
                ]
            },
            patterns: {
                patterns: [{ patternId: 'PAT-01', title: 'Commercial Theft Surge', jurisdiction: 'Station 101', percentageChange: '+65%' }]
            },
            similarCases: [{ caseId: '102', similarityScore: 82 }]
        };

        const score = SentinelScoringService.calculatePriorityScore(mockContext, mockEngines);

        assert(score.totalScore >= 75, 'Priority score properly elevated for high-risk grave case', `Score: ${score.totalScore}`);
        assert(score.severity === 'CRITICAL' || score.severity === 'HIGH', 'Severity correctly classified', `Severity: ${score.severity}`);
        assert(score.breakdown.risk.score > 0, 'Risk dimension scored', `Risk: ${score.breakdown.risk.score}/40`);
        assert(score.breakdown.staleness.score > 0, 'Staleness dimension scored', `Staleness: ${score.breakdown.staleness.score}/20`);
        assert(score.breakdown.investigationGap.score > 0, 'Gap dimension scored', `Gap: ${score.breakdown.investigationGap.score}/15`);
        assert(score.breakdown.moIntelligence.score > 0, 'MO dimension scored', `MO: ${score.breakdown.moIntelligence.score}/10`);
        assert(score.breakdown.evidenceDeficit.score > 0, 'Evidence deficit scored', `Deficit: ${score.breakdown.evidenceDeficit.score}/10`);
        assert(score.breakdown.patternSurge.score > 0, 'Pattern surge scored', `Pattern: ${score.breakdown.patternSurge.score}/5`);
        assert(score.evidenceSources.length >= 4, 'Traceable evidence sources attached', `Count: ${score.evidenceSources.length}`);
    } catch (err) {
        assert(false, 'Scoring calculation failed', err.message);
    }

    // TEST 2: Action Item Generation & 1-Click Deep Links
    console.log('\n--- TEST SUITE 2: Action Queue Generation & Grounding ---');
    try {
        const mockContext = {
            case: { caseId: '101', caseNumber: 'CR-101/2025', title: 'Commercial Jewel Theft' },
            evidence: []
        };
        const mockScore = {
            caseId: '101',
            caseNumber: 'CR-101/2025',
            totalScore: 88,
            severity: 'CRITICAL',
            daysSinceActivity: 45,
            breakdown: {
                risk: { score: 30 },
                staleness: { score: 20 },
                investigationGap: { score: 15 },
                moIntelligence: { score: 10 },
                evidenceDeficit: { score: 8 },
                patternSurge: { score: 5 }
            }
        };
        const mockEngines = {
            leads: {
                leads: [{ type: 'CrossCaseSuspect', title: 'Ramesh Kumar', relatedEntities: ['Ramesh Kumar'], relatedCases: ['102'] }]
            },
            moAnalysis: {
                matchedHistoricalCases: [{ caseId: '102', moSimilarity: 0.82, matchedAttributes: ['Shutter Breach'] }]
            },
            gaps: {
                gaps: [{ gapId: 'GAP-03', category: 'Statutory Compliance', title: 'Chargesheet Pending', statutoryImpact: 'Remand Limit' }]
            }
        };

        const actions = SentinelActionService.generateActionItems(mockScore, mockContext, mockEngines);
        assert(actions.length >= 2, 'Generated multiple concrete action items', `Count: ${actions.length}`);
        
        const firstAction = actions[0];
        assert(firstAction.actionId.startsWith('ACT-SENTINEL-101-'), 'Action ID conforms to standard schema', firstAction.actionId);
        assert(firstAction.drillDown?.deepLink?.includes('/investigate/101'), '1-Click drill down deep link generated', firstAction.drillDown?.deepLink);
        assert(firstAction.status === 'AWAITING_REVIEW', 'Action item starts in AWAITING_REVIEW status', firstAction.status);
    } catch (err) {
        assert(false, 'Action generation failed', err.message);
    }

    // TEST 3: Human-in-the-Loop Approval & Immutable Audit Trail
    console.log('\n--- TEST SUITE 3: Human-in-the-Loop Decision & Audit Trail ---');
    try {
        const queue = SentinelActionService.getActionQueue();
        const testAction = queue[0];
        assert(Boolean(testAction), 'Action queue has active test item');

        // Approve Action
        const approvalRes = await SentinelActionService.approveAction(mockReq, testAction.actionId, {
            officerId: 'off_01',
            officerName: 'Inspector Vijay Gowda',
            role: 'Investigator',
            reason: 'Matches suspect modus operandi verified at site.'
        });

        assert(approvalRes.success === true, 'Action successfully approved');
        assert(approvalRes.action.status === 'APPROVED', 'Action state updated to APPROVED');
        assert(approvalRes.decisionRecord.evidenceHash.startsWith('SHA256:'), 'Cryptographic hash generated for audit decision', approvalRes.decisionRecord.evidenceHash);

        // Verify Audit Trail
        const auditLogs = SentinelActionService.getDecisionLogs({ caseId: testAction.caseId });
        assert(auditLogs.length >= 1, 'Decision record persisted in decision audit logs', `Count: ${auditLogs.length}`);
        assert(auditLogs[0].decision === 'APPROVED', 'Audit log reflects APPROVED decision');
    } catch (err) {
        assert(false, 'Approval & audit test failed', err.message);
    }

    // TEST 4: Full Sentinel Autonomous Scan Across Active Dockets
    console.log('\n--- TEST SUITE 4: Full Multi-Case Sentinel Autonomous Scan ---');
    try {
        const scanResult = await SentinelOrchestratorService.scanActiveCases(mockReq, { limit: 20 });
        
        assert(scanResult.success === true, 'Full Sentinel autonomous scan completed');
        assert(scanResult.summary.casesAnalyzed > 0, 'Cases successfully evaluated from datastore', `Analyzed: ${scanResult.summary.casesAnalyzed}`);
        assert(Array.isArray(scanResult.topPriorityCases), 'Top priority cases list returned');
        assert(scanResult.topPriorityCases.length <= 5, 'Top priority cases capped at Top 5', `Count: ${scanResult.topPriorityCases.length}`);
        assert(scanResult.summary.engineHealth?.investigationReasoning === 'HEALTHY', 'Engine health tracking operational');
        assert(Array.isArray(scanResult.deltas), 'Change detection / deltas computed', `Deltas: ${scanResult.deltas.length}`);
    } catch (err) {
        assert(false, 'Full scan failed', err.message);
    }

    // TEST 5: Scheduler Integration
    console.log('\n--- TEST SUITE 5: Scheduler Integration ---');
    try {
        const scheduledJobRes = await SchedulerService.runSentinelDailyScan(mockReq);
        assert(scheduledJobRes.status === 'COMPLETED', 'Scheduler cron executes Sentinel autonomous scan successfully');
    } catch (err) {
        assert(false, 'Scheduler test failed', err.message);
    }

    console.log('\n================================================================');
    console.log(`🏁 VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTests();
