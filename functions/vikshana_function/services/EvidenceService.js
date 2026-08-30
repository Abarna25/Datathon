const datastoreClient = require('../queries/datastoreClient');
const EvidenceAgent = require('../agents/EvidenceAgent');

class EvidenceService {
    static async getEvidence(req, caseId) {
        try {
            if (!caseId) {
                caseId = req.query?.caseId || req.params?.caseId || 'UNASSIGNED';
            }
            if (caseId === 'UNASSIGNED' || !caseId) {
                return { cases: [], accused: [], arrests: [], victims: [], chargesheeted: [] };
            }
            const [
                cases,
                accused,
                arrests,
                victims,
                chargesheeted
            ] = await Promise.all([
                datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseMasterID: caseId }, { maxRows: 1 }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }, { maxRows: 50 }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'ArrestSurrender', { CaseMasterID: caseId }, { maxRows: 50 }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }, { maxRows: 50 }).catch(() => []),
                datastoreClient.getRowsWhere(req, 'ChargesheetDetails', { CaseMasterID: caseId }, { maxRows: 50 }).catch(() => [])
            ]);

            const rawData = {
                cases: (cases || []).map(r => ({
                    id: r.CaseMasterID,
                    crimeNo: r.CrimeNo,
                    category: r.CaseCategoryID,
                    briefFacts: r.BriefFacts
                })),
                accused: (accused || []).map(r => ({
                    id: r.AccusedMasterID,
                    caseId: r.CaseMasterID,
                    name: r.AccusedName,
                    age: r.AgeYear
                })),
                arrests: (arrests || []).map(r => ({
                    id: r.ArrestSurrenderID,
                    caseId: r.CaseMasterID,
                    accusedId: r.AccusedMasterID,
                    date: r.ArrestSurrenderDate,
                    type: r.ArrestSurrenderTypeID === 1 ? 'Arrest' : 'Surrender'
                })),
                victims: (victims || []).map(r => ({
                    id: r.VictimMasterID,
                    caseId: r.CaseMasterID,
                    name: r.VictimName,
                    age: r.AgeYear
                })),
                chargesheeted: (chargesheeted || []).map(r => ({
                    id: r.CSID,
                    caseId: r.CaseMasterID,
                    date: r.csdate,
                    type: r.cstype
                }))
            };

            // Pass the real data to the GLM Evidence Agent for AI correlation
            const evidences = await EvidenceAgent.correlateEvidence(rawData);
            return evidences;
        } catch (error) {
            console.error('Evidence Fetch Error:', error);
            throw error;
        }
    }
}

module.exports = EvidenceService;
