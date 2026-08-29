const express = require('express');
const router = express.Router();
const IntelligenceController = require('../controllers/IntelligenceController');

// 1. Investigation Reasoning & Leads
router.get('/case/:caseId/leads', IntelligenceController.getLeads);

// 2. Modus Operandi Intelligence
router.get('/case/:caseId/mo', IntelligenceController.getMOAnalysis);

// 3. Temporal Crime Network
router.get('/case/:caseId/temporal-network', IntelligenceController.getTemporalNetwork);
router.get('/case/:caseId/explain-connection', IntelligenceController.explainConnection);

// 4. Emerging Crime Patterns
router.get('/patterns/emerging', IntelligenceController.getEmergingPatterns);

// 5. Unified Evidence Chain
router.get('/case/:caseId/evidence-chain', IntelligenceController.getEvidenceChain);

// 6. Investigation Gaps & Next Actions
router.get('/case/:caseId/gaps-and-actions', IntelligenceController.getGapsAndActions);

// 7. Explainable AI (XAI)
router.get('/explain/:insightType/:caseId', IntelligenceController.explainInsight);

// Legacy Pattern routes
router.get('/patterns', IntelligenceController.getPatterns);
router.get('/trends', IntelligenceController.getTrends);
router.get('/hotspots', IntelligenceController.getHotspots);
router.get('/emerging', IntelligenceController.getEmerging);
router.get('/offenders', IntelligenceController.getOffenders);
router.get('/gaps', IntelligenceController.getGaps);

module.exports = router;
