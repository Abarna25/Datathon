const express = require('express');
const router = express.Router();
const SociologicalIntelligenceController = require('../controllers/SociologicalIntelligenceController');

router.get('/overview', SociologicalIntelligenceController.getOverview);
router.get('/demographics', SociologicalIntelligenceController.getDemographics);

module.exports = router;
