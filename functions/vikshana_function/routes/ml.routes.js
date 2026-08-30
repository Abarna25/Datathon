const express = require('express');
const router = express.Router();
const QuickMLService = require('../services/QuickMLService');

// POST /ml/predict-risk - Predict suspect risk score via evidence analytics
router.post('/predict-risk', async (req, res) => {
    try {
        const result = await QuickMLService.predictSuspectRisk(req, req.body || {});
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in POST /ml/predict-risk:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /ml/predict-hotspots - Spatial-temporal crime density cluster analysis
router.get('/predict-hotspots', async (req, res) => {
    try {
        const sectorId = req.query.sectorId || 'Sector-18';
        const result = await QuickMLService.predictCrimeHotspots(req, { sectorId });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in GET /ml/predict-hotspots:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /ml/translate - Translate an array of strings using Zia NLP / Dual-LLM Translation
// Request body: { texts?: string[], text?: string | string[], sourceLanguage?: string, targetLanguage: string }
// Response:     { success: true, data: { translations: string[] } }
router.post('/translate', async (req, res) => {
    try {
        const body = req.body || {};
        const rawTexts = body.texts || body.text || [];
        const texts = Array.isArray(rawTexts) ? rawTexts : (typeof rawTexts === 'string' ? [rawTexts] : []);
        const sourceLanguage = body.sourceLanguage || body.source_language || 'en';
        const targetLanguage = body.targetLanguage || body.target_language || 'kn';

        if (texts.length === 0) {
            return res.status(200).json({ success: true, data: { translations: [] } });
        }

        const translations = await QuickMLService.translateText(req, { texts, sourceLanguage, targetLanguage });
        res.status(200).json({ success: true, data: { translations } });
    } catch (error) {
        console.error('Error in POST /ml/translate:', error.message);
        if (error.code === 'TRANSLATION_UNAVAILABLE') {
            return res.status(200).json({
                success: false,
                code: "TRANSLATION_UNAVAILABLE",
                sourceLanguage: error.sourceLanguage || "en",
                targetLanguage: error.targetLanguage || "kn"
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ML Pipeline Endpoints
const MLPipelineController = require('../controllers/MLPipelineController');
router.get('/pipeline/health', MLPipelineController.getHealth);
router.post('/pipeline/hotspots', MLPipelineController.clusterHotspots);
router.post('/pipeline/forecast', MLPipelineController.forecastCrime);

// Semantic Vector RAG Endpoints
router.post('/rag/search', MLPipelineController.semanticSearch);
router.post('/rag/query', MLPipelineController.groundedQuery);

module.exports = router;

