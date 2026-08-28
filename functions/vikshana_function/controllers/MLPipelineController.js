/**
 * MLPipelineController.js
 * Controller exposing Python ML Pipeline, DBSCAN Spatial Clustering,
 * Time-Series Forecasting, and Semantic Vector RAG APIs.
 */

const PythonMLBridge = require('../services/PythonMLBridge');
const VectorRAGService = require('../services/VectorRAGService');
const datastoreClient = require('../queries/datastoreClient');

class MLPipelineController {
    static async getHealth(req, res) {
        try {
            const health = await PythonMLBridge.getHealth();
            res.status(200).json({ success: true, data: health });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async clusterHotspots(req, res) {
        try {
            let { coordinates, epsKm, minSamples } = req.body || {};

            // If coordinates not provided, fetch real GPS coordinates from CaseMaster table
            if (!coordinates || coordinates.length === 0) {
                const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 300 }).catch(() => []);
                coordinates = cases
                    .filter(c => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude))
                    .map(c => ({
                        lat: parseFloat(c.latitude),
                        lng: parseFloat(c.longitude),
                        caseId: c.CaseMasterID,
                        crimeNo: c.CrimeNo
                    }));
            }

            const result = await PythonMLBridge.clusterHotspots(coordinates, epsKm, minSamples);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async forecastCrime(req, res) {
        try {
            let { historicalCounts, periodsAhead } = req.body || {};

            // If historical counts not provided, build from real CaseMaster registration timestamps
            if (!historicalCounts || historicalCounts.length === 0) {
                const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 300 }).catch(() => []);
                const monthBuckets = {};
                cases.forEach(c => {
                    if (c.CrimeRegisteredDate) {
                        const m = String(c.CrimeRegisteredDate).substring(0, 7); // YYYY-MM
                        monthBuckets[m] = (monthBuckets[m] || 0) + 1;
                    }
                });

                historicalCounts = Object.entries(monthBuckets)
                    .sort((a, b) => a[0] > b[0] ? 1 : -1)
                    .map(([period, count]) => ({ period, count }));
            }

            const result = await PythonMLBridge.forecastCrimeTrends(historicalCounts, periodsAhead);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Semantic Vector RAG Search
    static async semanticSearch(req, res) {
        try {
            const { query, caseId, topK, minScore } = req.body || {};
            if (!query) {
                return res.status(400).json({ success: false, error: 'Query parameter is required.' });
            }
            const result = await VectorRAGService.semanticSearch(req, { query, caseId, topK, minScore });
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Grounded Vector RAG Intelligence Briefing
    static async groundedQuery(req, res) {
        try {
            const { query, caseId } = req.body || {};
            if (!query) {
                return res.status(400).json({ success: false, error: 'Query parameter is required.' });
            }
            const result = await VectorRAGService.answerGroundedQuery(req, { query, caseId });
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = MLPipelineController;
