require('dotenv').config();
const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('../services/ContextBuilderService');
const ConfidenceEngineService = require('../services/ConfidenceEngineService');
const AnomalyDetectionService = require('../services/AnomalyDetectionService');

// Stub out entity resolution to avoid neo4j/external dependency during fast test
const EntityResolutionService = require('../services/EntityResolutionService');
EntityResolutionService.getRepeatOffenderProfile = async () => ({ isRepeatOffender: false, linkedCases: [] });

// Mock request
const req = {
    user: { userId: 'test-user', role: 'admin' },
    catalyst: {
        initialize: () => ({
            datastore: () => ({
                table: () => ({
                    getPagedRows: async () => ({ data: [], next_page: null }),
                    getRow: async () => null,
                    insertRow: async () => ({ ROWID: 123 })
                }),
                search: {
                    executeSearchQuery: async () => []
                }
            }),
            zcql: () => ({
                executeZCQLQuery: async () => []
            })
        })
    }
};

async function runTests() {
    console.log("=== Testing Deterministic Confidence and Anomaly Detection ===\n");

    // Case 1 usually has basic occurrences, etc. in mock data
    const caseId = '1'; 
    console.log(`Building context for Case #${caseId}...`);
    const context = await ContextBuilderService.buildCaseContext(req, caseId);

    console.log("\n--- Phase 1B: Evidence Confidence Engine ---");
    const confidenceScore = ConfidenceEngineService.calculateScore(context);
    console.log(`Score: ${confidenceScore.score}`);
    console.log(`Level: ${confidenceScore.level}`);
    console.log(`Factors:`);
    confidenceScore.factors.forEach(f => console.log(`  - ${f}`));

    console.log("\n--- Phase 1C: Anomaly Detection Engine ---");
    const anomalies = AnomalyDetectionService.detectAnomalies(context);
    if (anomalies.length === 0) {
        console.log("No anomalies detected.");
    } else {
        anomalies.forEach((a, idx) => {
            console.log(`[Anomaly ${idx + 1}]`);
            console.log(`  Type: ${a.type}`);
            console.log(`  Severity: ${a.severity}`);
            console.log(`  Description: ${a.description}`);
            console.log(`  Records: ${a.affectedRecords.join(', ')}`);
        });
    }

    // Force an anomaly for testing purposes
    console.log("\n--- Injecting Timeline Anomaly for Verification ---");
    // We add an arrest that happens before the occurrence
    const fakeContext = {
        ...context,
        timeline: [
            { source_type: 'occurrence_record', event_time: '2023-05-18T12:00:00Z', ROWID: 'O-100' },
            { source_type: 'arrest_record', event_time: '2023-05-10T12:00:00Z', ROWID: 'A-200' }
        ],
        suspects: [],
        chargesheet: [{ ROWID: 'CS-300' }]
    };

    const forcedAnomalies = AnomalyDetectionService.detectAnomalies(fakeContext);
    forcedAnomalies.forEach((a, idx) => {
        console.log(`[Forced Anomaly ${idx + 1}]`);
        console.log(`  Type: ${a.type}`);
        console.log(`  Severity: ${a.severity}`);
        console.log(`  Description: ${a.description}`);
        console.log(`  Rule: ${a.detectionRule}`);
    });
}

runTests().catch(console.error);
