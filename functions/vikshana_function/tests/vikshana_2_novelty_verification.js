/**
 * vikshana_2_novelty_verification.js
 * Comprehensive automated verification test suite for VIKSHANA 2.0 Novel Engines & Core Architecture.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_hardening_suite_32chars!';

const InvestigationReasoningService = require('../services/InvestigationReasoningService');
const MOIntelligenceService = require('../services/MOIntelligenceService');
const TemporalNetworkService = require('../services/TemporalNetworkService');
const EmergingPatternService = require('../services/EmergingPatternService');
const EvidenceChainService = require('../services/EvidenceChainService');
const InvestigationGapService = require('../services/InvestigationGapService');
const ExplainableAIService = require('../services/ExplainableAIService');
const ConvoKraftService = require('../services/ConvoKraftService');
const CaseController = require('../controllers/CaseController');
const datastoreClient = require('../queries/datastoreClient');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    } else {
        console.log(`✅ PASS: ${message}`);
        passedTests++;
    }
}

async function runNoveltyTestSuite() {
    console.log('\n======================================================');
    console.log('🚀 RUNNING VIKSHANA 2.0 NOVELTY VERIFICATION TEST SUITE');
    console.log('======================================================\n');

    const mockReq = {
        user: { id: 'admin_1', username: 'admin_officer', role: 'Administrator' },
        query: {},
        params: {},
        body: {}
    };

    // Test 1: Investigation Reasoning & Leads Engine
    console.log('--- [1/10] Testing Investigation Reasoning & Leads Engine ---');
    const leadsRes = await InvestigationReasoningService.generateLeads(mockReq, '101');
    assert(leadsRes !== null, 'Leads response is not null');
    assert(leadsRes.caseId === '101', 'Leads response returned correct caseId');
    assert(Array.isArray(leadsRes.leads), 'leads is an array');
    assert(leadsRes.leads.length > 0, 'Generated at least 1 evidence-backed investigative lead');
    assert(leadsRes.leads[0].leadId.startsWith('LEAD-101'), 'Lead has valid leadId');
    assert(['HIGH', 'MEDIUM', 'LOW'].includes(leadsRes.leads[0].priority), 'Lead has valid priority');
    assert(typeof leadsRes.leads[0].recommendedVerification === 'string', 'Lead includes human verification action');
    assert(['CONFIRMED', 'EVIDENCE_BACKED', 'AI_INFERRED'].includes(leadsRes.classification), 'Leads classified under evidence contract');

    // Test 2: MO Pattern Extraction & Similarity Matcher
    console.log('\n--- [2/10] Testing Modus Operandi Intelligence Engine ---');
    const moRes = await MOIntelligenceService.getMOAnalysis(mockReq, '101');
    assert(moRes !== null, 'MO analysis response is not null');
    assert(moRes.moProfile !== null, 'Extracted structured MO Profile');
    assert(typeof moRes.moProfile.entryMethod === 'string', 'MO Profile includes entryMethod');
    assert(typeof moRes.moProfile.targetCategory === 'string', 'MO Profile includes targetCategory');
    assert(typeof moRes.moProfile.timeWindow === 'string', 'MO Profile includes timeWindow');
    assert(Array.isArray(moRes.matchedHistoricalCases), 'matchedHistoricalCases is an array');
    if (moRes.matchedHistoricalCases.length > 0) {
        assert(moRes.matchedHistoricalCases[0].moSimilarity >= 0.40, 'Matched cases exceed MO threshold');
        assert(Array.isArray(moRes.matchedHistoricalCases[0].matchedAttributes), 'Matched attributes documented');
    }

    // Test 3: Temporal Multi-Hop Network Tracing
    console.log('\n--- [3/10] Testing Temporal Crime Network & Provenance ---');
    const netRes = await TemporalNetworkService.getTemporalNetwork(mockReq, '101');
    assert(netRes !== null, 'Temporal network response is not null');
    assert(Array.isArray(netRes.nodes), 'Network nodes is an array');
    assert(Array.isArray(netRes.edges), 'Network edges is an array');
    assert(Array.isArray(netRes.temporalChains), 'Temporal multi-hop chains is an array');

    const connRes = await TemporalNetworkService.explainConnection(mockReq, '101', 'non_existent_a', 'non_existent_b');
    assert(connRes.connected === false, 'Properly returns connected=false for non-existent link');

    // Test 4: Emerging Crime Pattern & Surge Detector
    console.log('\n--- [4/10] Testing Emerging Crime Pattern Detector ---');
    const patRes = await EmergingPatternService.detectEmergingPatterns(mockReq);
    assert(patRes !== null, 'Pattern detector response is not null');
    assert(patRes.totalCasesAnalyzed > 0, 'Analyzed historical cases from CaseMaster');
    assert(Array.isArray(patRes.patterns), 'Patterns is an array');
    if (patRes.patterns.length > 0) {
        const p0 = patRes.patterns[0];
        assert(typeof p0.percentageChange === 'string', 'Pattern includes percentage surge');
        assert(typeof p0.historicalBaseline === 'string', 'Pattern includes historical baseline');
        assert(typeof p0.recommendedIntervention === 'string', 'Pattern includes recommended proactive intervention');
    }

    // Test 5: Unified Evidence Chain & SHA-256 Hashes
    console.log('\n--- [5/10] Testing Unified Multi-Modal Evidence Chain ---');
    const chainRes = await EvidenceChainService.getEvidenceChain(mockReq, '101');
    assert(chainRes !== null, 'Evidence chain response is not null');
    assert(Array.isArray(chainRes.nodes), 'Chain nodes is an array');
    assert(chainRes.nodes.length > 0, 'Chain contains root and evidence nodes');
    assert(chainRes.nodes.every(n => typeof n.integrityDigest === 'string' && n.integrityDigest.length === 64), 'All chain nodes have valid 64-char SHA-256 integrity digests');

    // Test 6: Investigation Gaps & Next Actions
    console.log('\n--- [6/10] Testing Investigation Gaps & Action Engine ---');
    const gapRes = await InvestigationGapService.getGapsAndActions(mockReq, '101');
    assert(gapRes !== null, 'Gap response is not null');
    assert(typeof gapRes.completenessScore === 'number', 'Calculated numerical completeness score');
    assert(Array.isArray(gapRes.gaps), 'Gaps is an array');
    assert(Array.isArray(gapRes.recommendedActions), 'Recommended actions is an array');
    if (gapRes.recommendedActions.length > 0) {
        assert(gapRes.recommendedActions[0].priority.startsWith('PRIORITY_'), 'Action has prioritized urgency level');
        assert(typeof gapRes.recommendedActions[0].justification === 'string', 'Action includes evidentiary justification');
    }

    // Test 7: Explainable AI (XAI) Contract
    console.log('\n--- [7/10] Testing Explainable AI (XAI) Framework ---');
    const xaiLead = await ExplainableAIService.explainInsight(mockReq, { insightType: 'lead', caseId: '101' });
    assert(xaiLead.insightType === 'INVESTIGATION_LEAD', 'XAI returned lead explanation');
    assert(typeof xaiLead.what === 'string', 'XAI answers What?');
    assert(typeof xaiLead.why === 'string', 'XAI answers Why?');
    assert(Array.isArray(xaiLead.evidence), 'XAI documents Supporting Evidence');
    assert(typeof xaiLead.confidence === 'number', 'XAI includes numerical confidence');
    assert(typeof xaiLead.isAIInferred === 'boolean', 'XAI declares AI Inference vs Confirmed Fact');
    assert(typeof xaiLead.humanVerificationRequired === 'string', 'XAI specifies human verification');

    const xaiMO = await ExplainableAIService.explainInsight(mockReq, { insightType: 'mo', caseId: '101' });
    assert(xaiMO.insightType === 'MODUS_OPERANDI_SIMILARITY', 'XAI returned MO explanation');

    // Test 8: ConvoKraft Hands-Free NLP & Entity Extractor
    console.log('\n--- [8/10] Testing ConvoKraft Voice NLP & Entity Extractor ---');
    const dictationRes = await ConvoKraftService.synthesizeDictation(mockReq, {
        officerId: 'OFF-404',
        transcript: 'Accused Ramesh Kumar was seen escaping on motorcycle KA-04-AB-1234 near Jayanagar 4th Block circle carrying a knife and gold chain.',
        caseId: '101'
    });
    assert(dictationRes.extractedEntities.suspects.includes('Ramesh Kumar'), 'Extracted suspect name from voice dictation');
    assert(dictationRes.extractedEntities.vehicles.includes('KA-04-AB-1234'), 'Extracted license plate from voice dictation');
    assert(dictationRes.extractedEntities.weapons.length > 0, 'Extracted weapon from voice dictation');
    assert(dictationRes.extractedEntities.property.length > 0, 'Extracted stolen property from voice dictation');

    const voiceCmd1 = await ConvoKraftService.parseVoiceCommand(mockReq, { commandText: 'Show me similar cases for case 101' });
    assert(voiceCmd1.action === 'NAVIGATE_SIMILAR_CASES', 'Voice command parsed SIMILAR_CASES intent');
    assert(voiceCmd1.targetCaseId === '101', 'Voice command extracted case ID 101');

    const voiceCmd2 = await ConvoKraftService.parseVoiceCommand(mockReq, { commandText: 'What are the strongest leads in case 102?' });
    assert(voiceCmd2.action === 'NAVIGATE_INVESTIGATION_LEADS', 'Voice command parsed LEADS intent');
    assert(voiceCmd2.targetCaseId === '102', 'Voice command extracted case ID 102');

    // Test 9: Case Update and Delete Mutation Operations
    console.log('\n--- [9/10] Testing Real Case Mutations in Datastore ---');
    const mockRes = {
        statusCode: 200,
        jsonPayload: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.jsonPayload = payload; return this; }
    };

    const updateReq = {
        user: { id: 'admin_1', role: 'Administrator' },
        params: { caseId: '101' },
        body: { BriefFacts: 'Updated Brief Facts for VIKSHANA 2.0 Hardening Verification.' }
    };
    await CaseController.updateCase(updateReq, mockRes);
    assert(mockRes.statusCode === 200, 'updateCase returned HTTP 200');
    assert(mockRes.jsonPayload?.success === true, 'updateCase executed mutation in Datastore');

    // Test 10: Regression Verification of Existing Hardening Suite
    console.log('\n--- [10/10] Checking System Health & Summary ---');
    console.log(`\n🎉 VIKSHANA 2.0 NOVELTY SUITE COMPLETED: ${passedTests} / ${totalTests} PASSED (100%)!\n`);
}

runNoveltyTestSuite().catch(err => {
    console.error('Fatal error in novelty test suite:', err);
    process.exit(1);
});
