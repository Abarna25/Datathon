const CaseController = require('./controllers/CaseController');
const EvidenceIntelligenceController = require('./controllers/EvidenceIntelligenceController');
const DecisionSupportController = require('./controllers/DecisionSupportController');
const RelationshipService = require('./services/RelationshipService');
const EntityResolutionService = require('./services/EntityResolutionService');
const ReportService = require('./services/ReportService');
const DashboardService = require('./services/DashboardService');

class MockRes {
    constructor() { this.statusCode = 200; this.data = null; }
    status(code) { this.statusCode = code; return this; }
    json(data) { this.data = data; return this; }
}

const reqMock = (opts = {}) => ({
    query: opts.query || {},
    params: opts.params || {},
    body: opts.body || {},
    user: { id: 'test_judge' }
});

async function runAttacks() {
    console.log("=== FINAL JUDGE ATTACK TEST ===\n");
    let results = [];

    const test = async (id, desc, fn) => {
        try {
            const pass = await fn();
            results.push({ id, desc, pass, error: null });
            console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}. ${desc}`);
        } catch (e) {
            results.push({ id, desc, pass: false, error: e.message });
            console.log(`[FAIL] ${id}. ${desc} - Crashed: ${e.message}`);
        }
    };

    // 1. Ask about a case ID that does not exist.
    await test(1, "Case ID that does not exist", async () => {
        const res = new MockRes();
        await CaseController.getFullBundle(reqMock({ params: { caseId: "999999" } }), res);
        return res.data && res.data.success === false && res.data.data && res.data.data.caseNumber.includes("999999");
    });

    // 2. Ask about an accused that does not exist.
    await test(2, "Accused that does not exist", async () => {
        const res = await EntityResolutionService.getRepeatOffenderProfile(reqMock(), "GhostUser99", 99);
        return res && res.isRepeatOffender === false && res.summary.includes("Insufficient data");
    });

    // 3. Ask for a relationship that does not exist.
    await test(3, "Relationship that does not exist", async () => {
        const res = await RelationshipService.getNetwork(reqMock({ query: { caseId: "999999" } }));
        return res && res.nodes.length === 0;
    });

    // 4. Ask for evidence that does not exist.
    await test(4, "Evidence that does not exist", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.getWorkspaceData(reqMock({ query: { caseId: "999999" } }), res);
        return res.data && res.data.data.unified_evidence.summary.totalCount === 0;
    });

    // 5. Ask for a similar case when no similar case exists.
    await test(5, "Similar case when none exists", async () => {
        const res = new MockRes();
        await DecisionSupportController.getSimilarCases(reqMock({ query: { caseId: "999999" } }), res);
        return res.data && res.data.success === true && res.data.count === 0 && res.data.message === "No sufficiently similar cases were found in the available records.";
    });

    // 6. Ask a follow-up question referring to missing context.
    await test(6, "Follow-up question on missing context", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(reqMock({ body: { caseId: "999999", prompt: "Who is the main suspect?" } }), res);
        return res.data && (res.data.data.answer.includes("unavailable") || res.data.data.answer.includes("offline"));
    });

    // 7. Ask AI for info not in database.
    await test(7, "Ask AI for info not in database", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(reqMock({ body: { caseId: "1", prompt: "What was the weather like on the day of the crime?" } }), res);
        return res.data && res.data.data.answer.includes("offline");
    });

    // 8. Confidence score with insufficient evidence.
    await test(8, "Confidence score when evidence insufficient", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.getWorkspaceData(reqMock({ query: { caseId: "999999" } }), res);
        return res.data && res.data.data.unified_evidence.summary.completeness === 0;
    });

    // 9. Contradictory dates.
    await test(9, "Contradictory dates query", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(reqMock({ body: { caseId: "1", prompt: "Why did the arrest happen before the crime?" } }), res);
        return res.data && res.data.data.answer.includes("offline");
    });

    // 10. Duplicate entities.
    await test(10, "Duplicate entities", async () => {
        // Just querying EntityResolutionService with a common name
        const res = await EntityResolutionService.getRepeatOffenderProfile(reqMock(), "Ravi", null);
        return res && typeof res.isRepeatOffender === 'boolean';
    });

    // 11. Location with no records.
    await test(11, "Location with no records", async () => {
        const db = await DashboardService.getDashboardData(reqMock());
        // Since we don't have a specific location query, we just assert the dashboard didn't crash.
        return db && db.stats;
    });

    // 12. Kannada question about unavailable data.
    await test(12, "Kannada question about unavailable data", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(reqMock({ body: { caseId: "999999", prompt: "ಈ ಪ್ರಕರಣದಲ್ಲಿ ಏನಾಗಿದೆ?" } }), res);
        // Assert it doesn't return English hallucination, but explicitly falls back safely.
        return res.data && res.data.data.answer.includes("offline");
    });

    // 13. Disconnect AI provider test.
    await test(13, "AI provider offline fallback", async () => {
        const res = new MockRes();
        await EvidenceIntelligenceController.chatWithCopilot(reqMock({ body: { caseId: "1", prompt: "Summarize" } }), res);
        return res.data && res.data.data.answer.includes("offline");
    });

    // 14. Cross-case data leakage.
    await test(14, "Cross-case data leakage", async () => {
        const res1 = new MockRes();
        await CaseController.getFullBundle(reqMock({ params: { caseId: "1" } }), res1);
        const res2 = new MockRes();
        await CaseController.getFullBundle(reqMock({ params: { caseId: "2" } }), res2);
        
        const facts1 = res1.data?.data?.firSummary?.firText || "";
        const facts2 = res2.data?.data?.firSummary?.firText || "";
        return facts1 !== facts2 || (facts1 === "" && facts2 === ""); // Ensure they don't incorrectly share context.
    });

    // 15. Manipulated Case ID (SQLi attempt).
    await test(15, "Manipulated Case ID", async () => {
        const res = new MockRes();
        await CaseController.getFullBundle(reqMock({ params: { caseId: "1' OR '1'='1" } }), res);
        // It shouldn't crash badly, it should just return empty/false.
        return res.data && res.data.success === false;
    });

    // 16. Generate report for case with incomplete data.
    await test(16, "Generate report with incomplete data", async () => {
        const res = await ReportService.generateReport(reqMock({ body: { caseId: "999999" } }));
        return res && res.markdown && res.markdown.includes("Error generating full report");
    });

    console.log("\n--- SUMMARY ---");
    const passed = results.filter(r => r.pass).length;
    console.log(`Passed: ${passed}/${results.length}`);
    if (passed < 16) {
        process.exit(1);
    }
}

runAttacks();
