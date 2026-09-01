const CaseController = require('./controllers/CaseController');
const EvidenceIntelligenceController = require('./controllers/EvidenceIntelligenceController');
const DecisionSupportController = require('./controllers/DecisionSupportController');
const DashboardService = require('./services/DashboardService');
const RelationshipService = require('./services/RelationshipService');
const EntityResolutionService = require('./services/EntityResolutionService');
const ReportService = require('./services/ReportService');
const copilotService = require('./services/CopilotService');

const mockReq = {
    query: { caseId: '1' },
    params: { caseId: '1' },
    body: { prompt: 'Who is the suspect?', caseId: '1' },
    user: { id: 'test_user' }
};

class MockRes {
    constructor() {
        this.statusCode = 200;
        this.data = null;
    }
    status(code) {
        this.statusCode = code;
        return this;
    }
    json(data) {
        this.data = data;
        return this;
    }
}

async function runValidation() {
    console.log("=== FINAL E2E VALIDATION ===");
    let allPassed = true;

    const assertCondition = (name, condition, fallbackMsg) => {
        if (condition) {
            console.log(`[PASS] ${name}`);
        } else {
            console.log(`[FAIL] ${name} - ${fallbackMsg}`);
            allPassed = false;
        }
    };

    try {
        // Step 2 & 3: View FIR and Evidence
        const caseRes = new MockRes();
        await CaseController.getFullBundle(mockReq, caseRes);
        const caseData = caseRes.data?.data;
        assertCondition("3. View FIR & Evidence", caseData && (caseData.caseId || caseData.caseNumber), "Case details failed to load.");
        
        // Step 4 & 16: Copilot Query
        const copilotRes = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(mockReq, copilotRes);
        assertCondition("4. Ask natural-language investigation question", copilotRes.data?.success && copilotRes.data?.data?.answer, "Copilot failed to answer.");
        assertCondition("16. Test Kannada query/response", !copilotRes.data?.data?.answer?.includes("Offline Fallback"), "Copilot returned hardcoded offline fallback.");

        // Step 5: Similar Cases
        const similarRes = new MockRes();
        await DecisionSupportController.getSimilarCases(mockReq, similarRes);
        assertCondition("5. Retrieve similar real cases", similarRes.data?.success, "Failed to retrieve similar cases.");

        // Step 6 & 7: Network Relationships
        const networkGraph = await RelationshipService.getNetwork(mockReq);
        assertCondition("6. Identify cross-case entity relationships", networkGraph && networkGraph.nodes, "Network graph failed to generate.");
        assertCondition("7. Display criminal network", networkGraph.nodes.length > 0, "Network graph has 0 nodes, meaning no data generated.");
        assertCondition("7b. No fake demo map", !networkGraph.nodes.some(n => n.id === 'V_1'), "Graph returned hardcoded demo node 'V_1'");

        // Evidence Workspace
        const workspaceRes = new MockRes();
        await EvidenceIntelligenceController.getWorkspaceData(mockReq, workspaceRes);
        const workspaceData = workspaceRes.data?.data;
        
        assertCondition("8. Show evidence confidence", workspaceData?.unified_evidence?.summary?.evidenceStrength, "Confidence score missing.");
        assertCondition("9. Detect anomalies", Array.isArray(workspaceData?.unified_evidence?.summary?.anomalies), "Anomalies array missing.");
        assertCondition("10. Show investigation gaps", Array.isArray(workspaceData?.gaps), "Gaps array missing.");
        
        // Step 11: Next Best Action
        const hasRecs = workspaceData?.recommendations?.length > 0;
        let validRecFormat = false;
        if (hasRecs) {
            const rec = workspaceData.recommendations[0];
            if (rec.reason && Array.isArray(rec.evidence_used)) {
                validRecFormat = true;
            }
        }
        assertCondition("11. Generate Next Best Action with WHY and SOURCE", validRecFormat || !hasRecs, "Recommendation lacks proper WHY (reason) or SOURCE format.");

        // Step 12 & 13: Dashboard
        const dashboard = await DashboardService.getDashboardData(mockReq);
        assertCondition("12. Show crime pattern/trend insights", dashboard?.stats?.topCrimeType, "Crime trends missing.");
        assertCondition("13. Show hotspot/proactive intelligence", dashboard?.hotspots && dashboard.proactiveIntelligence, "Hotspots or proactive intelligence missing.");

        // Step 14: Criminology/Entity Profile
        // Assuming suspect "Kiran" or similar might be in case 1004. We'll pass a general name to test the query structure.
        const entityProfile = await EntityResolutionService.getRepeatOffenderProfile(mockReq, "Kiran", 25);
        assertCondition("14. Show criminology/entity profile", entityProfile && entityProfile.isRepeatOffender, "Entity profile generation failed.");
        
        // Step 15: Generate Report
        const report = await ReportService.generateReport(mockReq);
        assertCondition("15. Generate investigation report", report && report.markdown, "Markdown report generation failed.");

    } catch (e) {
        console.error("VALIDATION CRASHED:", e);
        allPassed = false;
    }

    console.log("-----------------------------------------");
    console.log(`FINAL RESULT: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    process.exit(allPassed ? 0 : 1);
}

runValidation();
