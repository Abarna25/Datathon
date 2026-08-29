/**
 * test_foresight_e2e.js
 * Comprehensive End-to-End Verification Suite for VIKSHANA 3.0 FORESIGHT
 */

const assert = require('assert');
const ForesightMLService = require('./services/ForesightMLService');
const ForesightAuditService = require('./services/ForesightAuditService');
const ExplainableAIService = require('./services/ExplainableAIService');
const PythonMLBridge = require('./services/PythonMLBridge');

const mockReq = {
    user: {
        id: 'OFFICER-401',
        name: 'Inspector Anand Rao',
        email: 'anand.rao@ksp.gov.in',
        role: 'Investigator'
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'VIKSHANA-E2E-TEST' }
};

let passed = 0;
let failed = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${desc}:`, err.message);
        failed++;
    }
}

async function itAsync(desc, fn) {
    try {
        await fn();
        console.log(`✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`❌ [FAIL] ${desc}:`, err.message);
        failed++;
    }
}

async function runForesightTests() {
    console.log('================================================================');
    console.log('🔮 STARTING VIKSHANA 3.0 FORESIGHT END-TO-END VERIFICATION');
    console.log('================================================================\n');

    // ---------------------------------------------------------
    // TEST SUITE 1: ML Model Inference & Calibrated Scoring
    // ---------------------------------------------------------
    console.log('--- TEST SUITE 1: Supervised ML Inference & Calibrated Scoring ---');
    const testSuspect = 'Prakash Kulkarni';
    const testCaseId = '1';
    
    let assessment = null;
    await itAsync('ML assessment executes and returns calibrated statistical score', async () => {
        assessment = await ForesightMLService.assessAccused(mockReq, { accusedName: testSuspect, caseId: testCaseId });
        assert(assessment, 'Assessment result is null');
        assert(typeof assessment.statisticalScore === 'number', 'statisticalScore must be a number');
        assert(assessment.statisticalScore >= 0 && assessment.statisticalScore <= 100, 'Score must be in [0, 100]');
        assert(typeof assessment.calibratedProbability === 'number', 'calibratedProbability must be a number');
    });

    it('Statistical risk tier is properly assigned', () => {
        assert(['HIGH_STATISTICAL_ASSOCIATION', 'MODERATE_STATISTICAL_ASSOCIATION', 'LOW_STATISTICAL_ASSOCIATION'].includes(assessment.tier));
        assert(assessment.tierLabel, 'tierLabel missing');
        assert(assessment.tierColor, 'tierColor missing');
    });

    it('Calibrated 95% confidence interval is computed', () => {
        assert(assessment.confidenceInterval, 'confidenceInterval missing');
        assert(assessment.confidenceInterval.lower <= assessment.statisticalScore, 'Lower bound must be <= score');
        assert(assessment.confidenceInterval.upper >= assessment.statisticalScore, 'Upper bound must be >= score');
    });

    it('Top contributing factors (SHAP attributions) are computed with directionality', () => {
        assert(Array.isArray(assessment.topContributingFactors), 'topContributingFactors must be an array');
        assert(assessment.topContributingFactors.length > 0, 'Must have at least 1 factor');
        const factor = assessment.topContributingFactors[0];
        assert(factor.feature, 'Factor missing feature name');
        assert(factor.label, 'Factor missing label');
        assert(typeof factor.impactScore === 'number', 'impactScore must be numeric');
        assert(['INCREASING_ASSOCIATION', 'DECREASING_ASSOCIATION'].includes(factor.direction), 'Invalid direction');
    });

    // ---------------------------------------------------------
    // TEST SUITE 2: Evidence Grounding & Traceability
    // ---------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Grounded Historical Evidence Trail ---');
    it('Historical evidence objects are attached with verified sources', () => {
        assert(Array.isArray(assessment.groundedEvidence), 'groundedEvidence must be an array');
        assert(assessment.groundedEvidence.length > 0, 'Must attach grounded evidence');
        const ev = assessment.groundedEvidence[0];
        assert(ev.type, 'Evidence missing type');
        assert(ev.title, 'Evidence missing title');
        assert(ev.source, 'Evidence missing source citation');
    });

    // ---------------------------------------------------------
    // TEST SUITE 3: Certified Model Card Transparency
    // ---------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Model Card & Ethical Transparency ---');
    let modelCard = null;
    await itAsync('Model Card is accessible and exposes out-of-time validation metrics', async () => {
        modelCard = await ForesightMLService.getModelCard(mockReq);
        assert(modelCard, 'Model Card is null');
        assert(modelCard.model_name, 'Missing model_name');
        assert(modelCard.performance_metrics, 'Missing performance_metrics');
        assert(modelCard.performance_metrics.Accuracy, 'Missing Accuracy metric');
        assert(modelCard.performance_metrics.F1_Score, 'Missing F1_Score');
        assert(modelCard.performance_metrics.ROC_AUC, 'Missing ROC_AUC');
        assert(modelCard.performance_metrics.Brier_Score, 'Missing Brier_Score');
    });

    it('Explicit Non-Intended Uses & Limitations are documented', () => {
        assert(Array.isArray(modelCard.intended_use) && modelCard.intended_use.length > 0, 'Missing intended_use');
        assert(Array.isArray(modelCard.non_intended_use) && modelCard.non_intended_use.length > 0, 'Missing non_intended_use');
        assert(Array.isArray(modelCard.known_limitations) && modelCard.known_limitations.length > 0, 'Missing known_limitations');
        assert(modelCard.ethical_oversight?.human_in_the_loop_required === true, 'Human-in-the-loop requirement not declared');
    });

    // ---------------------------------------------------------
    // TEST SUITE 4: Human-in-the-Loop Decision & SHA-256 Digest
    // ---------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Human-in-the-Loop Review & Forensic Hash ---');
    let decisionRecord = null;
    await itAsync('Officer records ACKNOWLEDGE decision with SHA-256 evidence hash', async () => {
        decisionRecord = await ForesightAuditService.recordOfficerDecision(mockReq, {
            assessmentId: assessment.assessmentId,
            accusedName: testSuspect,
            caseId: testCaseId,
            decision: 'ACKNOWLEDGE',
            officerNotes: 'Verified prior docket records at station PS-02.',
            officerName: 'Inspector Anand Rao'
        });

        assert(decisionRecord, 'Decision record is null');
        assert.strictEqual(decisionRecord.decision, 'ACKNOWLEDGE');
        assert(decisionRecord.evidenceDigest.startsWith('SHA256:'), 'evidenceDigest must have SHA256 prefix');
        assert.strictEqual(decisionRecord.evidenceDigest.length, 71, 'SHA-256 digest must be 64 hex chars with prefix');
    });

    await itAsync('Decision audit trail correctly retrieves recorded decisions', async () => {
        const trail = await ForesightAuditService.getDecisionAuditTrail(mockReq, { limit: 10 });
        assert(Array.isArray(trail), 'Audit trail must be an array');
        assert(trail.length > 0, 'Audit trail must contain recorded decision');
        const found = trail.find(d => d.decisionId === decisionRecord.decisionId);
        assert(found, 'Recorded decision not found in audit trail');
    });

    // ---------------------------------------------------------
    // TEST SUITE 5: Explainable AI (XAI) Contract Conformance
    // ---------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Explainable AI (XAI) Contract Conformance ---');
    await itAsync('ExplainableAIService generates 6-facet explanation for Foresight', async () => {
        const xai = await ExplainableAIService.explainInsight(mockReq, {
            insightType: 'foresight',
            caseId: testCaseId,
            insightId: testSuspect
        });

        assert(xai, 'XAI response is null');
        assert.strictEqual(xai.insightType, 'FORESIGHT_PREDICTIVE_INTELLIGENCE');
        assert(xai.what, 'XAI missing what');
        assert(xai.why, 'XAI missing why');
        assert(Array.isArray(xai.evidence) && xai.evidence.length > 0, 'XAI missing evidence');
        assert(typeof xai.confidence === 'number', 'XAI confidence must be numeric');
        assert.strictEqual(xai.isAIInferred, true, 'isAIInferred must be true for ML prediction');
        assert(xai.humanVerificationRequired, 'XAI missing humanVerificationRequired');
        assert(xai.traceableProvenance?.originatingService === 'ForesightMLService', 'Invalid provenance');
    });

    // ---------------------------------------------------------
    // TEST SUITE 6: Multi-Suspect Case Assessment
    // ---------------------------------------------------------
    console.log('\n--- TEST SUITE 6: Multi-Suspect Case Assessment ---');
    await itAsync('Foresight assesses all suspects in a case', async () => {
        const caseAssessments = await ForesightMLService.assessCaseSuspects(mockReq, '1');
        assert(caseAssessments, 'Result is null');
        assert.strictEqual(caseAssessments.caseId, '1');
        assert(Array.isArray(caseAssessments.assessments), 'assessments must be an array');
    });

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------
    console.log('\n================================================================');
    console.log(`🏁 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runForesightTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
