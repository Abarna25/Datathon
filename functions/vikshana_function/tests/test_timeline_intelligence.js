require('dotenv').config();
const TimelineIntelligenceService = require('../services/TimelineIntelligenceService');
const datastoreClient = require('../queries/datastoreClient');

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
    console.log("=== Testing Timeline Intelligence Service ===\n");

    const testCaseIds = ['1', '999999']; // Assuming 1 exists and 999999 does not

    for (const caseId of testCaseIds) {
        console.log(`Testing Case #${caseId}...`);
        try {
            const intelligence = await TimelineIntelligenceService.getTimelineIntelligence(req, caseId);
            console.log(`Status: ${intelligence.status}`);
            console.log(`Events Found: ${intelligence.events?.length || 0}`);
            if (intelligence.events?.length > 0) {
                console.log(`First Event: ${intelligence.events[0].eventType} @ ${intelligence.events[0].eventDate}`);
            }
            console.log(`Gaps: ${intelligence.gaps?.length || 0}`);
            if (intelligence.gaps?.length > 0) {
                console.log(`Example Gap: ${intelligence.gaps[0].what}`);
            }
            console.log(`Contradictions: ${intelligence.contradictions?.length || 0}`);
            if (intelligence.contradictions?.length > 0) {
                console.log(`Example Contradiction: ${intelligence.contradictions[0].why}`);
            }
            console.log(`Missing Records: ${intelligence.missingRecords?.length || 0}`);
            if (intelligence.missingRecords?.length > 0) {
                console.log(`Example Missing Record: ${intelligence.missingRecords[0].why}`);
            }
        } catch (e) {
            console.error(`Error processing case ${caseId}:`, e.message);
        }
        console.log("------------------------------------------\n");
    }
    
    // Inject mock data to test logic
    console.log("Testing Logic with Injected Data...");
    const originalBuildContext = require('../services/ContextBuilderService').buildCaseContext;
    require('../services/ContextBuilderService').buildCaseContext = async () => ({
        caseId: 'TEST-MOCK',
        case: {
            date: '2023-01-01T10:00:00Z',
            caseNumber: 'TEST-01',
            ROWID: 'C-1'
        },
        timeline: [
            { source_type: 'occurrence_record', event_time: '2023-01-05T12:00:00Z', description: 'Crime occurred', title: 'Crime', ROWID: 'O-1' },
            { source_type: 'arrest_record', event_time: '2023-01-02T12:00:00Z', description: 'Arrested', title: 'Arrest', ROWID: 'A-1' }, // contradiction: before crime
            { source_type: 'arrest_record', event_time: '2023-03-01T12:00:00Z', description: 'Another Arrest', title: 'Arrest 2', ROWID: 'A-2' } // gap from Jan 5 to Mar 1
        ],
        chargesheet: [
            { csdate: '2022-12-01T10:00:00Z', cstype: 'Final', ROWID: 'CS-1' } // contradiction: before FIR
        ]
    });

    const intel = await TimelineIntelligenceService.getTimelineIntelligence(req, 'TEST-MOCK');
    console.log(`Status: ${intel.status}`);
    console.log(`Gaps found: ${intel.gaps.length}`);
    intel.gaps.forEach(g => console.log(` - ${g.what}`));
    console.log(`Contradictions found: ${intel.contradictions.length}`);
    intel.contradictions.forEach(c => console.log(` - ${c.why}`));
    
    // Restore
    require('../services/ContextBuilderService').buildCaseContext = originalBuildContext;
    console.log("=== Tests Completed ===");
}

runTests().catch(console.error);
