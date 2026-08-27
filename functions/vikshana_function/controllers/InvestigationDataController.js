const ContextBuilderService = require('../services/ContextBuilderService');
const datastoreClient = require('../queries/datastoreClient');
const TimelineIntelligenceService = require('../services/TimelineIntelligenceService');

/** Simple evidence-density heuristic for the UI's risk & confidence indicators. Uses real dataset tables. */
function computeRiskAndConfidence(context) {
    // No PhoneRecord/FinancialTransaction in dataset — use suspect (Accused) and timeline (Inv_OccuranceTime) counts
    const suspectCount = (context.suspects || []).length;
    const timelineCount = (context.timeline || []).length;

    const riskScore = suspectCount + Math.floor(timelineCount / 2);
    const riskLevel = riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low';

    const totalEvidence = Object.values(context.evidenceCounts || {}).reduce((sum, n) => sum + (n || 0), 0);
    const confidence = Math.min(95, 30 + totalEvidence * 6);

    return { riskLevel, confidence };
}

class InvestigationDataController {
    static async getCaseSummary(req, res) {
        try {
            const { caseId } = req.params;
            const context = await ContextBuilderService.buildCaseContext(req, caseId);
            const attachments = [];
            const { riskLevel, confidence } = computeRiskAndConfidence(context);

            res.status(200).json({
                success: true,
                data: {
                    case: context.case,
                    victims: context.victims,
                    suspects: context.suspects,
                    witnesses: context.witnesses,
                    timeline: context.timeline,
                    evidenceCounts: context.evidenceCounts,
                    pinnedFacts: context.pinnedFacts,
                    recentAttachments: attachments,
                    riskLevel,
                    confidence
                }
            });
        } catch (error) {
            console.error('Error in InvestigationDataController.getCaseSummary:', error);
            res.status(200).json({ success: false, data: [] });
        }
    }

    static makeListHandler(table) {
        return async (req, res) => {
            try {
                const rows = await datastoreClient.getRowsByCase(req, table, req.params.caseId, { maxRows: 50 });
                res.status(200).json({ success: true, data: rows });
            } catch (error) {
                console.error(`Error in InvestigationDataController(${table}):`, error);
                res.status(200).json({ success: false, data: [] });
            }
        };
    }

    static async getTimelineIntelligence(req, res) {
        try {
            const { caseId } = req.params;

            // Strict validation: caseId must be numeric
            if (!caseId || !/^\d+$/.test(caseId)) {
                return res.status(400).json({ success: false, error: 'Invalid case ID' });
            }

            const intelligence = await TimelineIntelligenceService.getTimelineIntelligence(req, caseId);
            
            if (intelligence._error === '404') {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Case not found',
                    caseId: caseId,
                    dataSource: "Catalyst"
                });
            }
            if (intelligence._error === '500') {
                return res.status(500).json({ success: false, error: 'Datastore error' });
            }

            if (intelligence._insufficient) {
                return res.status(200).json({
                    success: true,
                    caseId,
                    dataSource: "Catalyst",
                    timeline: [],
                    gaps: [],
                    contradictions: [],
                    missingRecords: [],
                    alibiInformationGaps: [],
                    nextBestActions: [],
                    dataCompleteness: { score: 0 },
                    generatedAt: new Date().toISOString(),
                    message: "Insufficient timeline data for gap analysis."
                });
            }

            res.status(200).json({
                success: true,
                caseId,
                dataSource: "Catalyst",
                timeline: intelligence.timeline || [],
                gaps: intelligence.gaps || [],
                contradictions: intelligence.contradictions || [],
                missingRecords: intelligence.missingRecords || [],
                alibiInformationGaps: intelligence.alibiInformationGaps || [],
                nextBestActions: intelligence.nextBestActions || [],
                dataCompleteness: intelligence.dataCompleteness || { score: 0 },
                generatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in InvestigationDataController.getTimelineIntelligence:', error);
            res.status(500).json({ success: false, error: 'Datastore error' });
        }
    }
}

// Map API handler names to the real Catalyst dataset tables
InvestigationDataController.getWitnesses = InvestigationDataController.makeListHandler('ComplainantDetails'); // was 'Witness'
InvestigationDataController.getSuspects = InvestigationDataController.makeListHandler('Accused');             // was 'Suspect'
InvestigationDataController.getCctv = async (req, res) => res.json({ success: true, data: [] });             // CCTVFootage not in dataset
InvestigationDataController.getPhoneRecords = async (req, res) => res.json({ success: true, data: [] });     // PhoneRecord not in dataset
InvestigationDataController.getFinancialTransactions = async (req, res) => res.json({ success: true, data: [] }); // FinancialTransaction not in dataset
InvestigationDataController.getTimeline = InvestigationDataController.makeListHandler('Inv_OccuranceTime');  // was 'TimelineEvent'

module.exports = InvestigationDataController;
