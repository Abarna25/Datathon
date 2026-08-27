const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const datastoreClient = require('../queries/datastoreClient');
const SimilarCaseService = require('../services/SimilarCaseService');

async function runTest() {
    console.log("=== Testing Deterministic Similar Case Discovery ===\n");
    
    // Use a mock request object
    const req = {};

    try {
        // Fetch all cases to find one we can test with
        const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 10 });
        if (allCases.length === 0) {
            console.log("No cases found in datastore.");
            return;
        }

        const activeCase = allCases[0];
        const activeCaseId = activeCase.CaseMasterID || activeCase.ROWID;
        
        console.log(`Case #${activeCaseId}`);
        console.log(`Similar Cases:\n`);
        
        const similarCases = await SimilarCaseService.findSimilarCases(req, activeCaseId);
        
        if (similarCases.length === 0) {
            console.log("No similar cases met the threshold.");
        }

        for (const sc of similarCases) {
            console.log(`#${sc.caseId} — ${sc.similarityScore}`);
            
            if (sc.matchDetails) {
                if (sc.matchDetails.crimeType) console.log(`- ${sc.matchDetails.crimeType.toLowerCase()}`);
                if (sc.matchDetails.mo) console.log(`- ${sc.matchDetails.mo.toLowerCase()}`);
                if (sc.matchDetails.location) console.log(`- ${sc.matchDetails.location.toLowerCase()}`);
                if (sc.matchDetails.temporal) console.log(`- ${sc.matchDetails.temporal.toLowerCase()}`);
                if (sc.matchDetails.sharedEntities) console.log(`- ${sc.matchDetails.sharedEntities.toLowerCase()}`);
                if (sc.matchDetails.sharedEvidence) console.log(`- ${sc.matchDetails.sharedEvidence.toLowerCase()}`);
            }
            console.log("");
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTest();
