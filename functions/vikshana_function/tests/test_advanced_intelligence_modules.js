/**
 * test_advanced_intelligence_modules.js
 * Verification suite for the 5 Advanced Crime Intelligence Enhancements.
 */

const assert = require('assert');
const SeasonalEventIntelligenceService = require('../services/SeasonalEventIntelligenceService');
const SocioEconomicDataProvider = require('../services/SocioEconomicDataProvider');
const SocialRiskCorrelationService = require('../services/SocialRiskCorrelationService');
const CommunityDetectionService = require('../services/CommunityDetectionService');
const FinancialIntelligenceService = require('../services/FinancialIntelligenceService');

const mockReq = {
    headers: { authorization: 'Bearer test_token' },
    user: { id: 1, role: 'Administrator' }
};

async function runTests() {
    console.log('====================================================');
    console.log('🚀 TESTING ADVANCED CRIME INTELLIGENCE ENHANCEMENTS');
    console.log('====================================================\n');

    let passedCount = 0;
    let totalCount = 0;

    const test = async (name, fn) => {
        totalCount++;
        try {
            await fn();
            console.log(`✅ [PASS] ${name}`);
            passedCount++;
        } catch (err) {
            console.error(`❌ [FAIL] ${name}:`, err.message);
        }
    };

    // 1. MODULE 1: SEASONAL & EVENT INTELLIGENCE
    await test('Module 1: SeasonalEventIntelligenceService returns month trends, daily patterns, and event analysis', async () => {
        const result = await SeasonalEventIntelligenceService.getSeasonalIntelligence(mockReq);
        assert.strictEqual(result.status, 'SUCCESS');
        assert(Array.isArray(result.monthlyTrends), 'monthlyTrends should be an array');
        assert.strictEqual(result.monthlyTrends.length, 12, '12 months expected');
        assert(Array.isArray(result.dailyPatterns), 'dailyPatterns should be an array');
        assert.strictEqual(result.dailyPatterns.length, 7, '7 days expected');
        assert(Array.isArray(result.eventIntelligence), 'eventIntelligence should be an array');
        assert(result.eventIntelligence.length > 0, 'Event intelligence windows expected');
    });

    // 2. MODULE 2: SOCIO-ECONOMIC INTELLIGENCE LAYER
    await test('Module 2: SocioEconomicDataProvider returns demo data with data quality & provenance', async () => {
        const result = await SocioEconomicDataProvider.getSocioEconomicData();
        assert.strictEqual(result.status, 'SUCCESS');
        assert.strictEqual(result.isDemoData, true);
        assert(result.demoBanner.includes('DEMONSTRATION DATA'));
        assert(Array.isArray(result.districts), 'districts should be an array');
        assert(result.districts.length >= 2, 'at least 2 districts expected');
        assert(result.provenance, 'Data provenance metadata expected');
    });

    // 3. MODULE 3: SOCIAL RISK CORRELATION ENGINE
    await test('Module 3: SocialRiskCorrelationService calculates Pearson correlation & causation disclaimer', async () => {
        const result = await SocialRiskCorrelationService.getSocialRiskCorrelation(mockReq);
        assert.strictEqual(result.status, 'SUCCESS');
        assert.strictEqual(result.causationDisclaimer, 'Statistical correlation does not establish causation.');
        assert(Array.isArray(result.correlations), 'correlations should be an array');
        assert(Array.isArray(result.districtRiskIndices), 'districtRiskIndices should be an array');
        assert(result.responsibleAIRule.includes('geographic district-level statistics'));
    });

    // 4. MODULE 4: CRIMINAL NETWORK COMMUNITY DETECTION
    await test('Module 4: CommunityDetectionService detects graph communities with neutral labeling', async () => {
        const result = await CommunityDetectionService.detectCommunities(mockReq);
        assert.strictEqual(result.status, 'SUCCESS');
        assert(Array.isArray(result.communities), 'communities should be an array');
        assert(result.communities.length > 0, 'At least 1 community expected');
        const comm = result.communities[0];
        assert(comm.communityId, 'communityId required');
        assert(comm.explanation?.summary, 'explainability summary required');
        assert(result.neutralLabelingNote.includes('High-Connectivity Clusters'));
    });

    // 5. MODULE 5: FINANCIAL INTELLIGENCE MODULE
    await test('Module 5: FinancialIntelligenceService traces money trails & suspicious patterns with demo banner', async () => {
        const overview = await FinancialIntelligenceService.getFinancialOverview(mockReq);
        assert.strictEqual(overview.status, 'SUCCESS');
        assert.strictEqual(overview.isDemoData, true);
        assert(overview.demoBanner.includes('SIMULATED FINANCIAL DATA'));

        const trails = await FinancialIntelligenceService.analyzeMoneyTrails(mockReq);
        assert.strictEqual(trails.status, 'SUCCESS');
        assert(Array.isArray(trails.trails), 'money trails should be an array');

        const patterns = await FinancialIntelligenceService.detectSuspiciousPatterns(mockReq);
        assert.strictEqual(patterns.status, 'SUCCESS');
        assert(Array.isArray(patterns.patterns), 'suspicious patterns should be an array');
    });

    console.log(`\n====================================================`);
    console.log(`📊 TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
    console.log(`====================================================\n`);

    if (passedCount < totalCount) {
        process.exit(1);
    }
}

runTests();
