const datastoreClient = require('../queries/datastoreClient');
const RelationshipAgent = require('../agents/RelationshipAgent');

class RelationshipService {
    static async getNetwork(req) {
        try {
            const caseId = req.query.caseId;
            if (!caseId) {
                return { nodes: [], edges: [] };
            }

            // Fetch a broader set of records to identify cross-case networks
            const [
                cases,
                victims,
                accused,
                complainants,
                arrests,
                chargesheets,
                evidence
            ] = await Promise.all([
                datastoreClient.getRows(req, 'CaseMaster', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Victim', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Accused', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'ComplainantDetails', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'ArrestSurrender', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'ChargesheetDetails', { maxRows: 500 }).catch(() => []),
                datastoreClient.getRows(req, 'Evidence', { maxRows: 500 }).catch(() => [])
            ]);

            let rawData = {
                cases: (cases || []).map(r => ({
                    id: r.CaseMasterID,
                    crimeNo: r.CrimeNo,
                    briefFacts: r.BriefFacts,
                    category: r.CaseCategoryID,
                    officerId: r.PolicePersonID,
                    lat: r.latitude,
                    lng: r.longitude
                })),
                victims: (victims || []).map(r => ({
                    id: r.VictimMasterID,
                    caseId: r.CaseMasterID,
                    name: r.VictimName,
                    age: r.AgeYear,
                    gender: r.GenderID
                })),
                suspects: (accused || []).map(r => ({
                    id: r.AccusedMasterID,
                    caseId: r.CaseMasterID,
                    name: r.AccusedName,
                    age: r.AgeYear,
                    personId: r.PersonID
                })),
                witnesses: (complainants || []).map(r => ({
                    id: r.ComplainantID,
                    caseId: r.CaseMasterID,
                    name: r.ComplainantName,
                    age: r.AgeYear
                })),
                arrests: (arrests || []).map(r => ({
                    id: r.ArrestSurrenderID,
                    caseId: r.CaseMasterID,
                    accusedId: r.AccusedMasterID,
                    date: r.ArrestSurrenderDate,
                    type: r.ArrestSurrenderTypeID === 1 ? 'Arrest' : 'Surrender'
                })),
                chargesheets: (chargesheets || []).map(r => ({
                    id: r.CSID,
                    caseId: r.CaseMasterID,
                    date: r.csdate,
                    officerId: r.PolicePersonID
                })),
                evidence: (evidence || []).map(r => ({
                    id: r.EvidenceID || r.ROWID,
                    caseId: r.CaseMasterID,
                    type: r.EvidenceType || r.Type,
                    description: r.EvidenceDescription || r.Description,
                    location: r.RecoveryLocation || r.Location
                }))
            };

            // Ensure rawData arrays are empty arrays if undefined.

            // Pass records to the deterministic builder
            const graph = await RelationshipAgent.getNetwork(rawData, caseId);
            return graph;
        } catch (error) {
            console.error('Relationship Fetch Error:', error);
            throw error;
        }
    }
}

module.exports = RelationshipService;
