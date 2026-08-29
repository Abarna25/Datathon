const evidenceAggregatorService = require('../services/EvidenceAggregatorService');
const evidenceCorrelationService = require('../services/EvidenceCorrelationService');
const investigationRecommendationService = require('../services/InvestigationRecommendationService');
const copilotService = require('../services/CopilotService');
const ContextBuilderService = require('../services/ContextBuilderService');
const AnomalyDetectionService = require('../services/AnomalyDetectionService');

class EvidenceIntelligenceController {
    
    async getWorkspaceData(req, res) {
        try {
            const caseId = req.query.caseId || 'UNASSIGNED';
            if (caseId === 'UNASSIGNED') {
                return res.status(200).json({ success: true, data: { unified_evidence: { summary: { total_evidence: 0 }, evidence: [] }, correlations: [], gaps: [], recommendations: [] } });
            }
            
            const context = await ContextBuilderService.buildCaseContext(req, caseId).catch(() => null);
            const anomalies = context ? AnomalyDetectionService.detectAnomalies(context) : [];

            // Execute services in parallel for speed
            const [aggregated, correlations, analysis] = await Promise.all([
                evidenceAggregatorService.getAggregatedEvidence(req, caseId),
                evidenceCorrelationService.findCorrelations(req, caseId),
                investigationRecommendationService.generateRecommendationsAndGaps(req, caseId, context, anomalies)
            ]);
            
            return res.status(200).json({
                success: true,
                data: {
                    unified_evidence: aggregated,
                    correlations: correlations,
                    readiness: analysis.readiness || null,
                    gaps: analysis.gaps || []
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
                            total_evidence: 0,
                            linked_entities: 0,
                            incomplete_records: 0,
                            duplicate_records: 0
                        },
                        evidence: []
                    },
                    correlations: [],
                    readiness: null,
                    gaps: [{ gap: 'Data Unavailable', whyItMatters: 'Evidence intelligence generation failed or is unavailable.', recommendedAction: 'Check system status or case ID.', sourceTables: ['System'], confidence: 'HIGH' }]
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
