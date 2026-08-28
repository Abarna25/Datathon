const express = require('express');
const router = express.Router();
const SociologicalAssistantController = require('../controllers/SociologicalAssistantController');

// POST /sociological/ask - Socioeconomic crime analysis and policy recommendations
router.post('/ask', SociologicalAssistantController.ask);

module.exports = router;
