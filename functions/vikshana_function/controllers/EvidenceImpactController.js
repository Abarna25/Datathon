const EvidenceImpactService = require('../services/EvidenceImpactService');
const datastoreClient = require('../queries/datastoreClient');
const HypothesisEngineService = require('../services/HypothesisEngineService');

class EvidenceImpactController {
    static async getImpactHistory(req, res) {
        try {
            const { caseId } = req.params;
            const history = await EvidenceImpactService.getImpactHistory(req, caseId);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Allow adding generic evidence to test impact
    static async addEvidence(req, res) {
        try {
            const { caseId } = req.params;
            const { SourceType, Description, Verified } = req.body;
            
            const evidence = {
                ROWID: 'EVID-' + Math.random().toString(36).substr(2, 9),
                EvidenceID: 'EVID-' + Math.random().toString(36).substr(2, 9),
                CaseMasterID: caseId,
                SourceType: SourceType || 'Other',
                Description: Description || 'General evidence',
                Verified: Verified === undefined ? true : Verified,
                Timestamp: new Date().toISOString()
            };

            await datastoreClient.insertRow(req, 'Evidence', evidence);

            // Re-evaluate all hypotheses for this case to track impact
            const hypotheses = await HypothesisEngineService.getHypothesesForCase(req, caseId);
            const impacts = [];
            
            for (const hr of hypotheses) {
                // If it materially changes, the engine naturally recalculates. 
                // To track the change, we fetch the DB state (old) vs evaluated state (new).
                const rowId = hr.hypothesis.ROWID;
                const dbHyp = await datastoreClient.getRows(req, 'InvestigationHypothesis', { where: { ROWID: rowId } });
                
                if (dbHyp && dbHyp.length > 0) {
                    const oldHyp = dbHyp[0];
                    if (oldHyp.EvidenceSupportScore !== hr.hypothesis.EvidenceSupportScore) {
                        const imp = await EvidenceImpactService.recordImpact(
                            req, caseId, rowId, evidence.EvidenceID, 
                            oldHyp.EvidenceSupportScore, oldHyp.Status, 
                            hr.hypothesis.EvidenceSupportScore, hr.hypothesis.Status
                        );
                        impacts.push(imp);
                        // Update hypothesis in DB
                        await datastoreClient.updateRow(req, 'InvestigationHypothesis', rowId, {
                            EvidenceSupportScore: hr.hypothesis.EvidenceSupportScore,
                            Status: hr.hypothesis.Status
                        });
                    }
                }
            }

            res.json({ success: true, data: { evidence, impacts } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = EvidenceImpactController;
