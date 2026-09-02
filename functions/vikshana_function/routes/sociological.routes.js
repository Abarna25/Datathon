const express = require('express');
const router = express.Router();
const SociologicalIntelligenceController = require('../controllers/SociologicalIntelligenceController');
const SocialRiskController = require('../controllers/SocialRiskController');

router.get('/overview', SociologicalIntelligenceController.getOverview);
router.get('/demographics', SociologicalIntelligenceController.getDemographics);
router.get('/correlation', SocialRiskController.getSocialRiskCorrelation);
router.get('/socioeconomic', async (req, res) => {
    try {
        const SocioEconomicDataProvider = require('../services/SocioEconomicDataProvider');
        const data = await SocioEconomicDataProvider.getSocioEconomicData();
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
