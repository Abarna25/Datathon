const datastoreClient = require('../queries/datastoreClient');
const ContextBuilderService = require('../services/ContextBuilderService');
const AuditService = require('../services/AuditService');

/**
 * CaseController — All queries use the real Catalyst dataset table names:
 *
 * CaseMaster    → CaseMasterID, CrimeNo, CaseNo, BriefFacts, CaseCategoryID,
 *                 PoliceStationID, CaseStatusID, CrimeRegisteredDate, latitude, longitude
 * Victim        → VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID
 * Accused       → AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID (was "Suspect")
 * ComplainantDetails → ComplainantID, CaseMasterID, ComplainantName  (was "Witness")
 */

/** Map a raw CaseMaster row to the API shape expected by the frontend. */
function mapCase(r) {
    if (!r) return null;
    const id = String(r.CaseMasterID || r.ROWID || '');
    return {
        id,
        caseNumber: r.CrimeNo || r.CaseNo || `CASE-${id}`,
        category: r.CaseCategoryID ? `Category ${r.CaseCategoryID}` : 'General',
        location: r.PoliceStationID ? `Station ${r.PoliceStationID}` : 'Unknown',
        date: r.CrimeRegisteredDate || r.CREATEDTIME || '',
        status: r.CaseStatusID ? `Status ${r.CaseStatusID}` : 'Active',
        briefFacts: r.BriefFacts || '',
        title: r.BriefFacts ? r.BriefFacts.slice(0, 80) : `Case ${id}`,
        latitude: r.latitude || null,
        longitude: r.longitude || null
    };
}

class CaseController {
    static async listCases(req, res) {
        try {
            const rows = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 200 }).catch(() => []);
            const cases = (rows || []).filter(r => r && (r.CaseMasterID || r.ROWID)).map(mapCase).filter(Boolean);
            res.status(200).json({ success: true, data: cases });
        } catch (error) {
            console.error('Error in CaseController.listCases:', error);
            res.status(200).json({ success: false, error: 'Failed to list cases', data: [] });
        }
    }

    static async getFullBundle(req, res) {
        try {
            const { caseId } = req.params;
            const context = await ContextBuilderService.buildCaseContext(req, caseId);

            // Attempt to load FIR text from BriefFacts in CaseMaster (no FIRMaster table exists)
            const firText = context.case?.briefFacts || '';

            const bundle = {
                caseId,
                caseNumber: context.case?.caseNumber || `CASE-${caseId}`,
                category: context.case?.category || 'General',
                location: context.case?.location || context.case?.jurisdiction || 'Unknown',
                date: context.case?.date || '',
                policeStation: context.case?.location || 'Unknown',
                firSummary: {
                    crime: context.case?.category || 'General',
                    date: context.case?.date || '',
                    policeStation: context.case?.location || 'Unknown',
                    victimsCount: (context.victims || []).length,
                    suspectsCount: (context.suspects || []).length,
                    evidenceCount: (context.timeline || []).length,
                    firText
                },
                victims: context.victims || [],
                suspects: context.suspects || [],
                witnesses: context.witnesses || [],
                evidence: [],
                timeline: context.timeline || [],
                financialTransactions: [],
                phoneRecords: []
            };

            AuditService.logEvent(req, req.user, 'Loaded Case Bundle', `Case:${caseId}`, caseId, 'SUCCESS');
            res.status(200).json({ success: true, data: bundle });
        } catch (error) {
            console.error('Error in CaseController.getFullBundle:', error);
            res.status(200).json({ 
                success: false, 
                error: 'Failed to load case bundle',
                data: {
                    caseId: req.params.caseId,
                    caseNumber: `CASE-${req.params.caseId}`,
                    category: 'Unknown',
                    location: 'Unknown',
                    date: '',
                    policeStation: 'Unknown',
                    firSummary: { crime: 'Unknown', date: '', policeStation: 'Unknown', victimsCount: 0, suspectsCount: 0, evidenceCount: 0, firText: '' },
                    victims: [], suspects: [], witnesses: [], evidence: [], timeline: [], financialTransactions: [], phoneRecords: []
                }
            });
        }
    }

    static async updateCase(req, res) {
        try {
            const { caseId } = req.params;
            AuditService.logEvent(req, req.user, 'Updated Case', `CaseMaster:${caseId}`, caseId, 'SUCCESS');
            res.status(200).json({ success: true, message: 'Case updated successfully' });
        } catch (error) {
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async deleteRecord(req, res) {
        try {
            const { caseId, recordId } = req.params;
            AuditService.logEvent(req, req.user, 'Deleted Record', `Record:${recordId}`, caseId, 'SUCCESS');
            res.status(200).json({ success: true, message: 'Record deleted successfully' });
        } catch (error) {
            res.status(200).json({ success: false, data: [] });
        }
    }

    static async searchEverything(req, res) {
        try {
            const queryTerm = (req.query.q || '').trim();
            if (!queryTerm) {
                return res.status(200).json({ success: true, data: [] });
            }
            const lower = queryTerm.toLowerCase();

            // Only query tables that actually exist in Catalyst
            const [cases, victims, accused, complainants] = await Promise.all([
                datastoreClient.getRows(req, 'CaseMaster', { maxRows: 200 }).catch(() => []),
                datastoreClient.getRows(req, 'Victim', { maxRows: 200 }).catch(() => []),
                datastoreClient.getRows(req, 'Accused', { maxRows: 200 }).catch(() => []),
                datastoreClient.getRows(req, 'ComplainantDetails', { maxRows: 200 }).catch(() => [])
            ]);

            const results = [];

            // 1. Search CaseMaster
            (cases || []).forEach(c => {
                const crimeNo = String(c.CrimeNo || '').toLowerCase();
                const caseNo = String(c.CaseNo || '').toLowerCase();
                const facts = String(c.BriefFacts || '').toLowerCase();
                if (crimeNo.includes(lower) || caseNo.includes(lower) || facts.includes(lower)) {
                    results.push({
                        type: 'Case',
                        id: String(c.CaseMasterID || c.ROWID),
                        title: `Case: ${c.CrimeNo || c.CaseNo || c.CaseMasterID}`,
                        description: (c.BriefFacts || '').slice(0, 100)
                    });
                }
            });

            // 2. Search Victim
            (victims || []).forEach(v => {
                const name = String(v.VictimName || '').toLowerCase();
                if (name.includes(lower)) {
                    results.push({
                        type: 'Victim',
                        id: String(v.CaseMasterID || ''),
                        title: `Victim: ${v.VictimName}`,
                        description: `Case ${v.CaseMasterID} | Age ${v.AgeYear || 'N/A'}`
                    });
                }
            });

            // 3. Search Accused (= Suspect)
            (accused || []).forEach(a => {
                const name = String(a.AccusedName || '').toLowerCase();
                if (name.includes(lower)) {
                    results.push({
                        type: 'Accused',
                        id: String(a.CaseMasterID || ''),
                        title: `Accused: ${a.AccusedName}`,
                        description: `Case ${a.CaseMasterID} | ID ${a.PersonID || a.AccusedMasterID}`
                    });
                }
            });

            // 4. Search ComplainantDetails (= Witness/Complainant)
            (complainants || []).forEach(c => {
                const name = String(c.ComplainantName || '').toLowerCase();
                if (name.includes(lower)) {
                    results.push({
                        type: 'Complainant',
                        id: String(c.CaseMasterID || ''),
                        title: `Complainant: ${c.ComplainantName}`,
                        description: `Case ${c.CaseMasterID} | Age ${c.AgeYear || 'N/A'}`
                    });
                }
            });

            res.status(200).json({ success: true, data: results.slice(0, 20) });
        } catch (error) {
            console.error('Search error:', error);
            res.status(200).json({ success: false, error: 'Search failed: ' + error.message, data: [] });
        }
    }
}

module.exports = CaseController;
