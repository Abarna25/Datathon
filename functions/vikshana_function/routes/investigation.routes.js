const express = require('express');
const InvestigationController = require('../controllers/InvestigationController');

const router = express.Router();

router.post('/', InvestigationController.investigate);
router.post('/hypothesis', InvestigationController.evaluateHypothesis);

module.exports = router;
