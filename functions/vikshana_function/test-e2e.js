const EvidenceIntelligenceController = require('./controllers/EvidenceIntelligenceController');
const InvestigationService = require('./services/InvestigationService');
const RelationshipAgent = require('./agents/RelationshipAgent');
const ReportService = require('./services/ReportService');
const DashboardService = require('./services/DashboardService');

// Mock req
const mockReq = {
    query: { caseId: '100020248202100001' },
    body: { query: 'Find cases related to suspect Vikram', caseId: '100020248202100001' },
    ip: '127.0.0.1'
};

const mockRes = {
    status: function(s) {
        this.statusCode = s;
        return this;
    },
    json: function(d) {
        this.data = d;
        return this;
    }
};

async function runTest() {
    try {
        console.log("=== STARTING E2E TEST ===\n");

        console.log("1. Testing EvidenceIntelligenceController (Context, Anomaly, Confidence)...");
        await EvidenceIntelligenceController.getWorkspaceData(mockReq, mockRes);
        console.log("SUCCESS: Workspace Data Retrieved.");
        console.log("Anomalies:", mockRes.data?.data?.unified_evidence?.summary?.anomalies?.length);
        console.log("Evidence Strength:", mockRes.data?.data?.unified_evidence?.summary?.evidenceStrength?.score);

        console.log("\n2. Testing Investigation Planner...");
        const plan = await InvestigationService.performInvestigation(mockReq);
        console.log("SUCCESS: Plan Generated.");
        console.log("Plan Steps:", plan.steps?.length);

        console.log("\n3. Testing Report Service...");
        const report = await ReportService.generateReport(mockReq);
        console.log("SUCCESS: Report Generated.");
        console.log("Report length:", report.markdown?.length);

        console.log("\n4. Testing Dashboard Service...");
        const dashboard = await DashboardService.getDashboardData(mockReq);
        console.log("SUCCESS: Dashboard Data Retrieved.");
        console.log("Total Cases:", dashboard.stats?.totalCases);

        console.log("\n=== ALL TESTS PASSED ===");
    } catch (e) {
        console.error("\n=== TEST FAILED ===");
        console.error(e);
    }
}

runTest();
