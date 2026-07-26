const firIntelligenceService = require('../services/FIRIntelligenceService');
const datastoreClient = require('../queries/datastoreClient');

class FIRIntelligenceController {
    async analyze(req, res) {
        try {
            const { firText, caseId } = req.body || {};
            
            let narrative = (firText || '').trim();

            // Load existing FIR narrative from BriefFacts inside CaseMaster if caseId is provided
            if (caseId) {
                const caseRow = await datastoreClient.getRowById(req, 'CaseMaster', caseId).catch(() => null);
                if (caseRow && caseRow.BriefFacts) {
                    narrative = caseRow.BriefFacts;
                }
            }

            if (!narrative) {
                return res.status(400).json({ error: 'No FIR narrative found. Please provide narrative text.' });
            }

            const analysis = await firIntelligenceService.analyzeFIR(req, narrative, caseId);

            return res.status(200).json({
                success: true,
                data: analysis
            });
        } catch (error) {
            console.error('[FIRIntelligenceController] Analyze error:', error.message);
            return res.status(200).json({ success: false, error: error.message || 'AI Intelligence extraction failed.' });
        }
    }
}

module.exports = new FIRIntelligenceController();
