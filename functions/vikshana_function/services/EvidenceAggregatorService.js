const datastoreClient = require('../queries/datastoreClient');
const AuditService = require('./AuditService');

/**
 * EvidenceAggregatorService — Uses ONLY real Catalyst dataset tables.
 *
 * ✅ Accused            → AccusedMasterID, CaseMasterID, AccusedName
 * ✅ ArrestSurrender    → ArrestSurrenderID, CaseMasterID, AccusedMasterID, ArrestSurrenderDate
 * ✅ ChargesheetDetails → CSID, CaseMasterID, csdate, cstype
 * ✅ ActSectionAssociation → CaseMasterID, ActID, SectionID
 * ✅ Victim             → VictimMasterID, CaseMasterID, VictimName
 *
 * ❌ Removed: Evidence, CCTVFootage, PhoneRecord, FinancialTransaction, Weapon, Vehicle, ForensicReport
 *    — none of these tables exist in the dataset
 */

class EvidenceAggregatorService {

    async getAggregatedEvidence(req, caseId) {
        const [
            accused,
            arrests,
            chargesheet,
            actSections,
            victims
        ] = await Promise.all([
            datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }, { maxRows: 100 }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'ArrestSurrender', { CaseMasterID: caseId }, { maxRows: 100 }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'ChargesheetDetails', { CaseMasterID: caseId }, { maxRows: 100 }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'ActSectionAssociation', { CaseMasterID: caseId }, { maxRows: 100 }).catch(() => []),
            datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }, { maxRows: 100 }).catch(() => [])
        ]);

        // Unify into a common schema that the frontend Evidence Intelligence page can render
        const unified = [
            ...accused.map(r => ({
                id: r.AccusedMasterID || r.ROWID,
                source: 'Accused',
                type: 'Person',
                title: `Accused: ${r.AccusedName || 'Unknown'}`,
                description: `Age: ${r.AgeYear || 'N/A'} | PersonID: ${r.PersonID || 'N/A'}`,
                date: null,
                caseId: r.CaseMasterID
            })),
            ...arrests.map(r => ({
                id: r.ArrestSurrenderID || r.ROWID,
                source: 'ArrestSurrender',
                type: r.ArrestSurrenderTypeID === 1 ? 'Arrest' : 'Surrender',
                title: `${r.ArrestSurrenderTypeID === 1 ? 'Arrest' : 'Surrender'} Record`,
                description: `Accused ID ${r.AccusedMasterID} at Station ${r.PoliceStationID}`,
                date: r.ArrestSurrenderDate,
                caseId: r.CaseMasterID
            })),
            ...chargesheet.map(r => ({
                id: r.CSID || r.ROWID,
                source: 'ChargesheetDetails',
                type: 'Chargesheet',
                title: `Chargesheet #${r.CSID}`,
                description: `Type: ${r.cstype || 'N/A'} | Filed: ${r.csdate || 'N/A'}`,
                date: r.csdate,
                caseId: r.CaseMasterID
            })),
            ...actSections.map(r => ({
                id: r.ROWID,
                source: 'ActSectionAssociation',
                type: 'Legal',
                title: `Act ${r.ActID} — Section ${r.SectionID}`,
                description: `Applicable law sections for case ${r.CaseMasterID}`,
                date: null,
                caseId: r.CaseMasterID
            })),
            ...victims.map(r => ({
                id: r.VictimMasterID || r.ROWID,
                source: 'Victim',
                type: 'Victim',
                title: `Victim: ${r.VictimName || 'Unknown'}`,
                description: `Age: ${r.AgeYear || 'N/A'}`,
                date: null,
                caseId: r.CaseMasterID
            }))
        ];

        // RBAC masking
        const role = (req.user?.role || '').toUpperCase();
        if (role === 'POLICYMAKER') {
            const counts = {};
            unified.forEach(u => { counts[u.type] = (counts[u.type] || 0) + 1; });
            return { isAggregated: true, counts };
        }

        // Compute new metrics
        const totalCount = unified.length;
        
        let linkedEntitiesCount = 0;
        let incompleteRecordsCount = 0;
        let duplicateRecordsCount = 0;

        const seenSignatures = new Set();

        unified.forEach(u => {
            // Check for linked entities (has a person relationship)
            if (u.type === 'Person' || u.type === 'Victim' || u.source === 'ArrestSurrender') {
                linkedEntitiesCount++;
            }

            // Check for incomplete metadata
            if ((u.source === 'ArrestSurrender' && !u.date) || 
                (u.source === 'ChargesheetDetails' && !u.date) ||
                (u.source === 'Accused' && u.description.includes('N/A')) ||
                (u.source === 'Victim' && u.description.includes('N/A'))) {
                incompleteRecordsCount++;
            }

            // Check for duplicates
            const signature = `${u.source}_${u.title}_${u.date}`;
            if (seenSignatures.has(signature)) {
                duplicateRecordsCount++;
            }
            seenSignatures.add(signature);
        });

        await AuditService.logEvent(req, req.user, 'Accessed Evidence Workspace', 'EvidenceIntelligence', caseId, 'SUCCESS');

        return {
            caseId,
            summary: {
                total_evidence: totalCount,
                linked_entities: linkedEntitiesCount,
                incomplete_records: incompleteRecordsCount,
                duplicate_records: duplicateRecordsCount
            },
            evidence: unified
        };
    }
}

module.exports = new EvidenceAggregatorService();
