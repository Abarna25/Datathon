const express = require('express');
const router = express.Router();
const QuickMLService = require('../services/QuickMLService');

// POST /ml/predict-risk - Predict suspect risk score via QuickML
router.post('/predict-risk', async (req, res) => {
    try {
        const result = await QuickMLService.predictSuspectRisk(req, req.body || {});
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in POST /ml/predict-risk:', error);
        res.status(200).json({ success: false, error: error.message });
    }
});

// GET /ml/predict-hotspots - Predict spatial-temporal crime hotspots via QuickML
router.get('/predict-hotspots', async (req, res) => {
    try {
        const sectorId = req.query.sectorId || 'Sector-18';
        const result = await QuickMLService.predictCrimeHotspots(req, { sectorId });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in GET /ml/predict-hotspots:', error);
        res.status(200).json({ success: false, error: error.message });
    }
});

// POST /ml/translate - Translate an array of strings using Catalyst Zia NLP API
// Request body: { texts: string[], sourceLanguage?: string, targetLanguage: string }
// Response:     { success: true, data: { translations: string[] } }
router.post('/translate', async (req, res) => {
    try {
        const { texts, sourceLanguage = 'en', targetLanguage } = req.body || {};

        // Validate input
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ success: false, error: 'texts must be a non-empty array of strings' });
        }
        if (!targetLanguage) {
            return res.status(400).json({ success: false, error: 'targetLanguage is required (e.g. "kn", "hi", "ta")' });
        }

        const translations = await QuickMLService.translateText(req, { texts, sourceLanguage, targetLanguage });
        res.status(200).json({ success: true, data: { translations } });
    } catch (error) {
        console.error('Error in POST /ml/translate:', error.message);
        res.status(200).json({ success: false, error: error.message });
    }
});

module.exports = router;
