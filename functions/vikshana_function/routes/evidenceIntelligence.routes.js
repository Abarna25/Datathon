const express = require('express');
const router = express.Router();
const evidenceIntelligenceController = require('../controllers/EvidenceIntelligenceController');

router.get('/workspace', evidenceIntelligenceController.getWorkspaceData);
router.post('/copilot', evidenceIntelligenceController.chatWithCopilot);
router.get('/copilot/history/:caseId', evidenceIntelligenceController.getConversationHistory);

module.exports = router;
