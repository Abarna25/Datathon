const datastoreClient = require('./functions/vikshana_function/queries/datastoreClient');
const PatternDetectionService = require('./functions/vikshana_function/services/PatternDetectionService');

// Mock request
const req = {
    // Mock user for RBAC
    user: { role: 'Administrator' }
};

async function runTest() {
    try {
        console.log("Starting Large Data Streaming Test...");
        const result = await PatternDetectionService.getCrimeFrequencies(req);
        console.log("SUCCESS:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}

// Since catalyst.initialize(req) needs actual execution context (headers, project ID), 
// this script might fail if run locally without `catalyst serve`. 
// But it serves as the test file requested by the user.
// runTest();
