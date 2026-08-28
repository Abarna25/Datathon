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
            res.status(500).json({ success: false, error: error.message || 'Failed to list cases', data: [] });
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
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Failed to load case bundle',
                data: null
            });
        }
    }

    static async updateCase(req, res) {
        try {
            const { caseId } = req.params;
            const payload = req.body || {};
            
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'Case ID parameter is required' });
            }

            let existing = await datastoreClient.getRowById(req, 'CaseMaster', caseId).catch(() => null);
            if (!existing) {
                const rows = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseMasterID: caseId }, { maxRows: 1 }).catch(() => []);
                existing = rows[0] || null;
            }

            if (!existing) {
                return res.status(404).json({ success: false, error: `Case #${caseId} not found in Datastore` });
            }

            // Clean mutation payload with allowed fields only
            const allowedFields = ['BriefFacts', 'CaseCategoryID', 'CaseStatusID', 'PoliceStationID', 'CrimeNo', 'CaseNo', 'latitude', 'longitude'];
            const updateData = {};
            allowedFields.forEach(f => {
                if (payload[f] !== undefined) updateData[f] = payload[f];
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, error: 'No valid update fields provided' });
            }

            const targetRowId = existing.ROWID || caseId;
            const updated = await datastoreClient.updateRow(req, 'CaseMaster', targetRowId, updateData);

            await AuditService.logEvent(req, req.user, 'Updated Case', `CaseMaster:${caseId}`, caseId, 'SUCCESS');
            return res.status(200).json({ 
                success: true, 
                message: 'Case updated successfully in Catalyst Datastore',
                data: { ...existing, ...updateData, ROWID: targetRowId }
            });
        } catch (error) {
            console.error('Error in CaseController.updateCase:', error);
            await AuditService.logEvent(req, req.user, 'Failed Case Update', `CaseMaster:${req.params?.caseId}`, req.params?.caseId, 'FAILED');
            return res.status(500).json({ success: false, error: error.message || 'Failed to update case record' });
        }
    }

    static async deleteRecord(req, res) {
        try {
            const { caseId, recordId } = req.params;
            const table = req.query.table || 'CaseMaster';

            if (!recordId) {
                return res.status(400).json({ success: false, error: 'Record ID parameter is required' });
            }

            let existing = await datastoreClient.getRowById(req, table, recordId).catch(() => null);
            if (!existing) {
                const rows = await datastoreClient.getRowsWhere(req, table, { CaseMasterID: recordId }, { maxRows: 1 }).catch(() => []);
                existing = rows[0] || null;
            }

            if (!existing) {
                return res.status(404).json({ success: false, error: `Record #${recordId} not found in ${table}` });
            }

            const targetRowId = existing.ROWID || recordId;
            await datastoreClient.deleteRow(req, table, targetRowId);

            await AuditService.logEvent(req, req.user, 'Deleted Record', `${table}:${recordId}`, caseId, 'SUCCESS');
            return res.status(200).json({ success: true, message: `Record deleted successfully from ${table}` });
        } catch (error) {
            console.error('Error in CaseController.deleteRecord:', error);
            return res.status(500).json({ success: false, error: error.message || 'Failed to delete record' });
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

            // 3. Search Accused
            (accused || []).forEach(a => {
                const name = String(a.AccusedName || '').toLowerCase();
                if (name.includes(lower)) {
                    results.push({
                        type: 'Accused',
                        id: String(a.CaseMasterID || ''),
                        title: `Accused: ${a.AccusedName}`,
                        description: `Case ${a.CaseMasterID} | Age ${a.AgeYear || 'N/A'}`
                    });
                }
            });

            // 4. Search Complainants
            (complainants || []).forEach(cp => {
                const name = String(cp.ComplainantName || '').toLowerCase();
                if (name.includes(lower)) {
                    results.push({
                        type: 'Complainant',
                        id: String(cp.CaseMasterID || ''),
                        title: `Complainant: ${cp.ComplainantName}`,
                        description: `Case ${cp.CaseMasterID} | Age ${cp.AgeYear || 'N/A'}`
                    });
                }
            });

            res.status(200).json({ success: true, data: results });
        } catch (error) {
            console.error('Error in CaseController.searchEverything:', error);
            res.status(500).json({ success: false, error: error.message, data: [] });
        }
    }
}

module.exports = CaseController;
