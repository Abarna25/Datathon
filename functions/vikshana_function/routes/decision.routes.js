const express = require('express');
const router = express.Router();
const DecisionSupportController = require('../controllers/DecisionSupportController');

router.get('/summary', DecisionSupportController.getSummary);
router.get('/summary/:caseId', DecisionSupportController.getSummary);

router.get('/completeness', DecisionSupportController.getCaseCompleteness);
router.get('/completeness/:caseId', DecisionSupportController.getCaseCompleteness);

router.get('/timeline', DecisionSupportController.getTimeline);
router.get('/timeline/:caseId', DecisionSupportController.getTimeline);

router.get('/similar-cases', DecisionSupportController.getSimilarCases);
router.get('/similar-cases/:caseId', DecisionSupportController.getSimilarCases);

router.get('/full-case', DecisionSupportController.getFullCaseSupport);
router.get('/full-case/:caseId', DecisionSupportController.getFullCaseSupport);

router.get('/contradictions', DecisionSupportController.getContradictions);
router.get('/contradictions/:caseId', DecisionSupportController.getContradictions);

router.get('/lead-recommendations', DecisionSupportController.getLeadRecommendations);
router.get('/lead-recommendations/:caseId', DecisionSupportController.getLeadRecommendations);
router.post('/lead-recommendations', DecisionSupportController.getLeadRecommendations);

router.post('/executive-summary', DecisionSupportController.generateExecutiveSummary);
router.post('/query-assistant', DecisionSupportController.queryAIAssistant);

module.exports = router;
