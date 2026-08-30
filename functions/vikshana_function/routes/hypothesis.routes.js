const express = require('express');
const HypothesisController = require('../controllers/HypothesisController');

const router = express.Router({ mergeParams: true });

router.post('/', HypothesisController.createHypothesis);
router.get('/', HypothesisController.getHypotheses);

module.exports = router;
