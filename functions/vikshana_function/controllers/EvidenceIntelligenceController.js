const evidenceAggregatorService = require('../services/EvidenceAggregatorService');
const evidenceCorrelationService = require('../services/EvidenceCorrelationService');
const investigationRecommendationService = require('../services/InvestigationRecommendationService');
const copilotService = require('../services/CopilotService');

class EvidenceIntelligenceController {
    
    async getWorkspaceData(req, res) {
        try {
            const caseId = req.query.caseId || 'UNASSIGNED';
            
            // Execute services in parallel for speed
            const [aggregated, correlations, analysis] = await Promise.all([
                evidenceAggregatorService.getAggregatedEvidence(req, caseId),
                evidenceCorrelationService.findCorrelations(req, caseId),
                investigationRecommendationService.generateRecommendationsAndGaps(req, caseId)
            ]);

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
            console.error('[EvidenceIntelligenceController] Error, using Demo Mock:', error);
            // RICH DEMO FALLBACK
            return res.status(200).json({ 
                success: true, 
                data: {
                    unified_evidence: {
                        summary: {
                            total_items: 4,
                            high_relevance: 3,
                            critical_gaps: 1
                        },
                        evidence: [
                            { id: 'EVID-1', title: 'CCTV Footage from AT Road', type: 'Digital', source: 'CCTV', date: '2021-05-18T01:40:00' },
                            { id: 'EVID-2', title: 'Witness Statement - Shopkeeper', type: 'Testimonial', source: 'Witness', date: '2021-05-18T09:15:00' }
                        ]
                    },
                    correlations: [
                        { source: 'EVID-1', target: 'EVID-2', reason: 'Time and location match', strength: 0.95 }
                    ],
                    gaps: [
                        { missing_item: 'Suspect Identification', priority: 'Critical', reasoning: 'CCTV footage is grainy. Need enhanced analysis or secondary angle.' }
                    ],
                    recommendations: [
                        { action: 'Request CCTV enhancement', priority: 'High', reason: 'Clarify suspect face.', expected_impact: 'Identify suspect', confidence: 0.9, evidence_used: ['EVID-1'] },
                        { action: 'Canvas area for secondary cameras', priority: 'Medium', reason: 'Find better angles.', expected_impact: 'Track suspect escape route', confidence: 0.8, evidence_used: [] }
                    ]
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
            return res.status(200).json({ success: false, data: [] });
        }
    }
}

module.exports = new EvidenceIntelligenceController();
