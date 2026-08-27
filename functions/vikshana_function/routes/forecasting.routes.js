const express = require('express');
const router = express.Router();
const ForecastingController = require('../controllers/ForecastingController');

router.get('/dashboard', ForecastingController.getDashboard);
router.get('/hotspots', ForecastingController.getHotspots);
router.get('/early-warning', ForecastingController.getEarlyWarning);
router.get('/geospatial', ForecastingController.getGeospatial);
router.post('/explain-prediction', ForecastingController.explainPrediction);

module.exports = router;
