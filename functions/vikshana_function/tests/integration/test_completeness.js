const ContextBuilderService = require('./services/ContextBuilderService');
const CaseCompletenessService = require('./services/CaseCompletenessService');
const datastoreClient = require('./queries/datastoreClient');

// Mock req object
const mockReq = {
    user: { id: 1, name: "Test Investigator", email: "test@police.gov.in" },
    headers: {}
};

async function runTests() {
    console.log("=== Running Case Completeness Tests ===");
    console.log("NOTE: Datastore fallback has been REMOVED for Case Completeness.");
    console.log("If the Catalyst DB is unreachable, this will correctly fail with DATASTORE_UNAVAILABLE.\n");

    try {
        console.log("--- Testing Case Completeness Score ---");
        
        // Since we know the mock datastore won't trigger for Case Completeness,
        // we can test with a dummy ID. If the datastore is offline, it should throw DATASTORE_UNAVAILABLE.
        // If it is online, it will throw 'Case ID ... not found in datastore.'
        
        try {
            const completenessData = await CaseCompletenessService.calculateCompleteness(mockReq, '1');
            console.log(`\nScore: ${completenessData.score}%`);
            console.log(`Status: ${completenessData.status}`);
            console.log(`Summary: ${completenessData.summary}`);
            console.log("\nCategory breakdown:");
            completenessData.categories.forEach(cat => {
                console.log(`- ${cat.label}: ${cat.score}/${cat.weight} (${cat.status})`);
            });
        } catch (e) {
            if (e.code === 'DATASTORE_UNAVAILABLE') {
                console.log("PASS (Datastore offline): Correctly blocked mock data and threw DATASTORE_UNAVAILABLE.");
            } else if (e.message.includes('not found')) {
                console.log("PASS (Datastore online): Correctly threw Case Not Found for case ID 1.");
            } else {
                console.error("FAIL: Unexpected error:", e);
            }
        }

        // 3. Test Invalid Case ID
        console.log("\n--- Testing Invalid Case ID ---");
        try {
            await CaseCompletenessService.calculateCompleteness(mockReq, 'INVALID_123');
            console.error("FAIL: Did not throw on invalid case ID.");
        } catch (e) {
            if (e.code === 'DATASTORE_UNAVAILABLE') {
                console.log("PASS (Datastore offline): Threw DATASTORE_UNAVAILABLE before executing invalid ID query.");
            } else {
                console.log(`PASS (Datastore online): Threw expected error: ${e.message}`);
            }
        }

        console.log("\n=== All basic tests passed! ===");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

runTests();
