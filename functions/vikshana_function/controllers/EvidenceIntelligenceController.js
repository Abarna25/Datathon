const evidenceAggregatorService = require('../services/EvidenceAggregatorService');
const evidenceCorrelationService = require('../services/EvidenceCorrelationService');
const investigationRecommendationService = require('../services/InvestigationRecommendationService');
const copilotService = require('../services/CopilotService');
const ContextBuilderService = require('../services/ContextBuilderService');
const AnomalyDetectionService = require('../services/AnomalyDetectionService');
const ConfidenceEngineService = require('../services/ConfidenceEngineService');

class EvidenceIntelligenceController {
    
    async getWorkspaceData(req, res) {
        try {
            const caseId = req.query.caseId || 'UNASSIGNED';
            
            const context = await ContextBuilderService.buildCaseContext(req, caseId).catch(() => null);
            const anomalies = context ? AnomalyDetectionService.detectAnomalies(context) : [];
            const evidenceStrength = context ? ConfidenceEngineService.calculateScore(context) : null;

            // Execute services in parallel for speed
            const [aggregated, correlations, analysis] = await Promise.all([
                evidenceAggregatorService.getAggregatedEvidence(req, caseId),
                evidenceCorrelationService.findCorrelations(req, caseId),
                investigationRecommendationService.generateRecommendationsAndGaps(req, caseId, context, anomalies)
            ]);
            
            if (aggregated && aggregated.summary) {
                aggregated.summary.anomalies = anomalies;
                aggregated.summary.evidenceStrength = evidenceStrength;
            }

            return res.status(200).json({
                success: true,
                data: {
                    unified_evidence: aggregated,
                    correlations: correlations,
                    gaps: analysis.gaps || [],
                    recommendations: analysis.recommendations || []
                }
            });
        } catch (error) {
            console.error('[EvidenceIntelligenceController] Error:', error);
            // Return a minimal explicit error state indicating data unavailability.
            return res.status(200).json({ 
                success: true, 
                data: {
                    unified_evidence: {
                        summary: {
                            total_items: 0,
                            high_relevance: 0,
                            critical_gaps: 0
                        },
                        evidence: []
                    },
                    correlations: [],
                    gaps: [{ missing_item: 'Data Unavailable', priority: 'Critical', reasoning: 'Evidence intelligence generation failed or is unavailable.' }],
                    recommendations: []
                }
            });
        }
    }

    async chatWithCopilot(req, res) {
        try {
            const { caseId = 'UNASSIGNED', prompt } = req.body;
            if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });

            const response = await copilotService.chat(req, caseId, prompt);
            
            return res.status(200).json({
                success: true,
                data: response
            });
        } catch (error) {
            console.error('[CopilotChat] Error:', error);
            return res.status(500).json({ success: false, error: error.message || 'Copilot interaction failed', data: null });
        }
    }
}

module.exports = new EvidenceIntelligenceController();
