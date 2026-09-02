const express = require('express');
const router = express.Router();
const ForecastController = require('../controllers/ForecastController');
const SeasonalIntelligenceController = require('../controllers/SeasonalIntelligenceController');

router.get('/overview', ForecastController.getForecast);
router.get('/early-warnings', ForecastController.getEarlyWarnings);
router.get('/seasonal', SeasonalIntelligenceController.getSeasonalIntelligence);

module.exports = router;
