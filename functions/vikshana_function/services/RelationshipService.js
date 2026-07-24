const datastoreClient = require('../queries/datastoreClient');
const RelationshipAgent = require('../agents/RelationshipAgent');

class RelationshipService {
    static async getNetwork(req) {
        try {
            const [
                cases,
                victims,
                accused,
                complainants,
                arrests
            ] = await Promise.all([
                datastoreClient.getRows(req, 'CaseMaster', { maxRows: 50 }).catch(() => []),
                datastoreClient.getRows(req, 'Victim', { maxRows: 50 }).catch(() => []),
                datastoreClient.getRows(req, 'Accused', { maxRows: 50 }).catch(() => []),
                datastoreClient.getRows(req, 'ComplainantDetails', { maxRows: 50 }).catch(() => []),
                datastoreClient.getRows(req, 'ArrestSurrender', { maxRows: 50 }).catch(() => [])
            ]);

            const rawData = {
                cases: (cases || []).map(r => ({
                    id: r.CaseMasterID,
                    crimeNo: r.CrimeNo,
                    briefFacts: r.BriefFacts,
                    category: r.CaseCategoryID
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
                }))
            };

            // Pass real records to the GLM Agent for graph network compilation
            const graph = await RelationshipAgent.getNetwork(rawData);
            return graph;
        } catch (error) {
            console.error('Relationship Fetch Error:', error);
            throw error;
        }
    }
}

module.exports = RelationshipService;
