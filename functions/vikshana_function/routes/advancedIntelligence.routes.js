const express = require('express');
const router = express.Router();
const AdvancedIntelligenceController = require('../controllers/AdvancedIntelligenceController');

router.get('/full-scan/:caseId', AdvancedIntelligenceController.getFullScan);

module.exports = router;
