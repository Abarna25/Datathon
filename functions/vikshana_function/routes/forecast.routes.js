const express = require('express');
const router = express.Router();
const ForecastController = require('../controllers/ForecastController');

router.get('/overview', ForecastController.getForecast);
router.get('/early-warnings', ForecastController.getEarlyWarnings);

module.exports = router;
