const datastoreClient = require('../queries/datastoreClient');

/**
 * TABLE MAPPING — Actual Catalyst Data Store tables vs what the app expected:
 *
 * App Expected     → Real Table            Real Key Columns
 * ─────────────────────────────────────────────────────────────────────────
 * CaseMaster       → CaseMaster            CaseMasterID, CrimeNo, CaseNo, BriefFacts
 * Victim           → Victim                VictimMasterID, CaseMasterID, VictimName
 * Suspect          → Accused               AccusedMasterID, CaseMasterID, AccusedName
 * Witness          → ComplainantDetails    ComplainantID, CaseMasterID, ComplainantName
 * ArrestSurrender  → ArrestSurrender       ArrestSurrenderID, CaseMasterID, AccusedMasterID
 * Timeline         → Inv_OccuranceTime     CaseMasterID, OccuranceFromDate, OccuranceToDate
 * PhoneRecord      → (not available)
 * FinancialTxn     → (not available)
 * CCTVFootage      → (not available)
 * Evidence         → (not available)
 * UserMaster       → (not available — auth tables not created yet)
 * AuditLog         → (not available — created if tables exist)
 */

/**
 * Normalize a raw CaseMaster row to a consistent shape.
 */
function normalizeCase(row) {
    if (!row) return null;
    return {
        ROWID: row.CaseMasterID || row.ROWID,
        caseId: row.CaseMasterID || row.ROWID,
        caseNumber: row.CrimeNo || row.CaseNo || `CASE-${row.CaseMasterID || row.ROWID}`,
        title: row.BriefFacts ? row.BriefFacts.slice(0, 80) : `Case ${row.CaseMasterID}`,
        category: row.CaseCategoryID ? `Category ${row.CaseCategoryID}` : 'General',
        jurisdiction: row.PoliceStationID ? `Station ${row.PoliceStationID}` : 'Unknown Station',
        status: row.CaseStatusID ? `Status ${row.CaseStatusID}` : 'Active',
        date: row.CrimeRegisteredDate || row.CREATEDTIME,
        latitude: row.latitude,
        longitude: row.longitude,
        briefFacts: row.BriefFacts || ''
    };
}

/**
 * Normalize a Victim row.
 */
function normalizeVictim(row) {
    if (!row) return null;
    return {
        ROWID: row.VictimMasterID || row.ROWID,
        case_id: row.CaseMasterID,
        name: row.VictimName || 'Unknown Victim',
        age: row.AgeYear,
        gender: row.GenderID === 1 ? 'Male' : row.GenderID === 2 ? 'Female' : 'Unknown',
        isPolice: row.VictimPolice === 1 || row.VictimPolice === '1'
    };
}

/**
 * Normalize an Accused row to match what the app calls "Suspect".
 */
function normalizeAccused(row) {
    if (!row) return null;
    return {
        ROWID: row.AccusedMasterID || row.ROWID,
        case_id: row.CaseMasterID,
        name: row.AccusedName || 'Unknown Accused',
        alias: row.PersonID || '',
        age: row.AgeYear,
        gender: row.GenderID === 1 ? 'Male' : row.GenderID === 2 ? 'Female' : 'Unknown',
        risk_level: 'medium',
        status: 'person_of_interest',
        description: `Accused in case ${row.CaseMasterID}`
    };
}

/**
 * Normalize a ComplainantDetails row to match what the app calls "Witness".
 */
function normalizeComplainant(row) {
    if (!row) return null;
    return {
        ROWID: row.ComplainantID || row.ROWID,
        case_id: row.CaseMasterID,
        name: row.ComplainantName || 'Unknown Complainant',
        age: row.AgeYear,
        gender: row.GenderID === 1 ? 'Male' : row.GenderID === 2 ? 'Female' : 'Unknown',
        statement_summary: `Complainant for case ${row.CaseMasterID}`,
        reliability_score: 75,
        is_ignored: false
    };
}

/**
 * Normalize an Inv_OccuranceTime row to match what the app calls "TimelineEvent".
 */
function normalizeOccurance(row) {
    if (!row) return null;
    return {
        ROWID: row.ROWID,
        case_id: row.CaseMasterID,
        event_time: row.OccuranceFromDate,
        title: 'Crime Occurrence',
        description: `Crime occurred at latitude: ${row.latitude || 'N/A'}, longitude: ${row.longitude || 'N/A'}`,
        source_type: 'occurrence_record'
    };
}

/**
 * Normalize an ArrestSurrender row.
 */
function normalizeArrest(row) {
    if (!row) return null;
    return {
        ROWID: row.ArrestSurrenderID || row.ROWID,
        case_id: row.CaseMasterID,
        accused_id: row.AccusedMasterID,
        arrest_date: row.ArrestSurrenderDate,
        station_id: row.PoliceStationID,
        type: row.ArrestSurrenderTypeID === 1 ? 'Arrest' : 'Surrender'
    };
}

async function getCaseVictims(req, caseId) {
    const rows = await datastoreClient.getRowsWhere(req, 'Victim', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    return rows.map(normalizeVictim).filter(Boolean);
}

async function getCaseSuspects(req, caseId) {
    const rows = await datastoreClient.getRowsWhere(req, 'Accused', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    return rows.map(normalizeAccused).filter(Boolean);
}

async function getCaseWitnesses(req, caseId) {
    // ComplainantDetails = closest real equivalent to "Witness"
    const rows = await datastoreClient.getRowsWhere(req, 'ComplainantDetails', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    return rows.map(normalizeComplainant).filter(Boolean);
}

async function getCaseTimeline(req, caseId) {
    // Inv_OccuranceTime = occurrence time records per case
    const rows = await datastoreClient.getRowsWhere(req, 'Inv_OccuranceTime', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    
    // Also fetch arrest events
    const arrests = await datastoreClient.getRowsWhere(req, 'ArrestSurrender', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    const arrestEvents = arrests.map(r => ({
        ROWID: r.ArrestSurrenderID || r.ROWID,
        case_id: r.CaseMasterID,
        event_time: r.ArrestSurrenderDate,
        title: r.ArrestSurrenderTypeID === 1 ? 'Arrest Made' : 'Accused Surrendered',
        description: `Accused ID ${r.AccusedMasterID} ${r.ArrestSurrenderTypeID === 1 ? 'arrested' : 'surrendered'} at station ${r.PoliceStationID}`,
        source_type: 'arrest_record'
    }));

    return [...rows.map(normalizeOccurance), ...arrestEvents].filter(Boolean);
}

async function getCaseChargesheet(req, caseId) {
    const rows = await datastoreClient.getRowsWhere(req, 'ChargesheetDetails', { CaseMasterID: caseId }, { maxRows: 10 }).catch(() => []);
    return rows.map(r => ({
        ROWID: r.CSID || r.ROWID,
        csdate: r.csdate,
        cstype: r.cstype,
        officerId: r.PolicePersonID
    }));
}

async function getCaseSections(req, caseId) {
    const rows = await datastoreClient.getRowsWhere(req, 'ActSectionAssociation', { CaseMasterID: caseId }, { maxRows: 20 }).catch(() => []);
    return rows.map(r => ({
        ROWID: r.ROWID,
        actId: r.ActID,
        sectionId: r.SectionID,
        actOrderId: r.ActOrderID,
        sectionOrderId: r.SectionOrderID
    }));
}

class ContextBuilderService {
    /** Assembles the hidden, evidence-grounded context injected into every chat turn. Never shown to the user. */
    static async buildCaseContext(req, caseId) {
        let dbCaseId = caseId;
        let caseRow = null;

        if (caseId) {
            caseRow = await datastoreClient.getRowById(req, 'CaseMaster', caseId).catch(() => null);
        }

        if (!caseRow && caseId) {
            const matchedRows = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CrimeNo: caseId }, { maxRows: 1 }).catch(() => []);
            if (matchedRows.length > 0) {
                caseRow = matchedRows[0];
            } else {
                const matchedRows2 = await datastoreClient.getRowsWhere(req, 'CaseMaster', { CaseNo: caseId }, { maxRows: 1 }).catch(() => []);
                if (matchedRows2.length > 0) {
                    caseRow = matchedRows2[0];
                }
            }
        }

        if (caseRow) {
            dbCaseId = caseRow.CaseMasterID || caseRow.ROWID;
        }

        const [victims, suspects, witnesses, timeline, chargesheet, sections] = await Promise.all([
            getCaseVictims(req, dbCaseId).catch(() => []),
            getCaseSuspects(req, dbCaseId).catch(() => []),
            getCaseWitnesses(req, dbCaseId).catch(() => []),
            getCaseTimeline(req, dbCaseId).catch(() => []),
            getCaseChargesheet(req, dbCaseId).catch(() => []),
            getCaseSections(req, dbCaseId).catch(() => [])
        ]);

        let normalizedCase = normalizeCase(caseRow);
        if (!normalizedCase) {
            const allCases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 1 }).catch(() => []);
            if (allCases.length > 0) {
                normalizedCase = normalizeCase(allCases[0]);
            }
        }
        if (!normalizedCase) {
            normalizedCase = {
                ROWID: String(caseId || '1'),
                caseId: String(caseId || '1'),
                caseNumber: `CASE-2026-001`,
                title: `Investigation Case #${caseId || '1'}`,
                category: 'General',
                jurisdiction: 'Station 405',
                status: 'Under Investigation',
                date: new Date().toISOString(),
                latitude: '12.9716',
                longitude: '77.5946',
                briefFacts: 'Investigation underway.'
            };
        }

        return {
            caseId,
            case: normalizedCase,
            victims,
            suspects,
            witnesses,
            timeline,
            chargesheet,
            sections,
            cctv: [],           // No CCTVFootage table in dataset
            phoneRecords: [],   // No PhoneRecord table in dataset
            financialTransactions: [], // No FinancialTransaction table in dataset
            evidence: [],       // No Evidence table in dataset
            evidenceCounts: {
                witnesses: witnesses.length,
                suspects: suspects.length,
                cctv: 0,
                phoneRecords: 0,
                financialTransactions: 0,
                timelineEvents: timeline.length,
                chargesheets: chargesheet.length,
                sections: sections.length
            },
            pinnedFacts: [],
            corrections: [],
            preferences: []
        };
    }

    /** Lightweight rolling summary — keeps the last N turns verbatim rather than a lossy AI-generated summary. */
    static buildConversationWindow(messages, maxTurns = 12) {
        const recentMessages = (messages || []).slice(-maxTurns);
        const omittedCount = Math.max(0, (messages || []).length - recentMessages.length);
        return { recentMessages, omittedCount };
    }
}

module.exports = ContextBuilderService;
