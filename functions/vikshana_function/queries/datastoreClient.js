const catalyst = require('zcatalyst-sdk-node');
const tablesSchema = require('./tables');

// In-Memory seed dataset for test suites, offline execution, and CLI tools when Catalyst runtime is absent
const localStore = {
    CaseMaster: [
        {
            ROWID: '101',
            CaseMasterID: '101',
            CrimeNo: 'CR-101/2025',
            CaseNo: 'CC-101',
            CrimeRegisteredDate: '2025-01-15 22:30:00',
            PoliceStationID: 'PS-12',
            CaseCategoryID: 1,
            GravityOffenceID: 2,
            CaseStatusID: 'OPEN',
            latitude: '12.9716',
            longitude: '77.5946',
            BriefFacts: 'Commercial burglary via forced entry and shutter tampering targeting precious metals and gold jewelry during late night hours. Accused Ramesh Kumar spotted fleeing on motorcycle.'
        },
        {
            ROWID: '102',
            CaseMasterID: '102',
            CrimeNo: 'CR-102/2025',
            CaseNo: 'CC-102',
            CrimeRegisteredDate: '2025-01-20 23:15:00',
            PoliceStationID: 'PS-12',
            CaseCategoryID: 1,
            GravityOffenceID: 2,
            CaseStatusID: 'UNDER_INVESTIGATION',
            latitude: '12.9720',
            longitude: '77.5950',
            BriefFacts: 'Shutter tampering and forced entry at commercial electronics shop near Jayanagar. Ramesh Kumar identified as repeat offender.'
        },
        {
            ROWID: '103',
            CaseMasterID: '103',
            CrimeNo: 'CR-103/2025',
            CaseNo: 'CC-103',
            CrimeRegisteredDate: '2025-02-01 14:00:00',
            PoliceStationID: 'PS-05',
            CaseCategoryID: 2,
            GravityOffenceID: 1,
            CaseStatusID: 'OPEN',
            latitude: '12.9352',
            longitude: '77.6245',
            BriefFacts: 'Physical assault and robbery in public transit corridor involving edged weapons.'
        },
        {
            ROWID: '104',
            CaseMasterID: '104',
            CrimeNo: 'CR-104/2025',
            CaseNo: 'CC-104',
            CrimeRegisteredDate: '2025-02-05 01:45:00',
            PoliceStationID: 'PS-12',
            CaseCategoryID: 1,
            GravityOffenceID: 2,
            CaseStatusID: 'OPEN',
            latitude: '12.9730',
            longitude: '77.5960',
            BriefFacts: 'Night forced entry and lock tampering targeting gold ornaments and cash safe in commercial sector.'
        },
        {
            ROWID: '187',
            CaseMasterID: '187',
            CrimeNo: 'CR-187/2024',
            CaseNo: 'CC-187',
            CrimeRegisteredDate: '2024-11-10 23:00:00',
            PoliceStationID: 'PS-12',
            CaseCategoryID: 1,
            GravityOffenceID: 2,
            CaseStatusID: 'CLOSED',
            latitude: '12.9710',
            longitude: '77.5940',
            BriefFacts: 'Prior commercial break-in and jewelry theft by Ramesh Kumar syndicate.'
        }
    ],
    Accused: [
        {
            ROWID: 'ACC-01',
            AccusedMasterID: 'ACC-01',
            CaseMasterID: '101',
            AccusedName: 'Ramesh Kumar',
            AgeYear: 28,
            GenderID: 'M',
            PersonID: 'PER-901'
        },
        {
            ROWID: 'ACC-02',
            AccusedMasterID: 'ACC-02',
            CaseMasterID: '102',
            AccusedName: 'Ramesh Kumar',
            AgeYear: 28,
            GenderID: 'M',
            PersonID: 'PER-901'
        },
        {
            ROWID: 'ACC-03',
            AccusedMasterID: 'ACC-03',
            CaseMasterID: '187',
            AccusedName: 'Ramesh Kumar',
            AgeYear: 28,
            GenderID: 'M',
            PersonID: 'PER-901'
        },
        {
            ROWID: 'ACC-04',
            AccusedMasterID: 'ACC-04',
            CaseMasterID: '103',
            AccusedName: 'Suresh Patil',
            AgeYear: 32,
            GenderID: 'M',
            PersonID: 'PER-902'
        }
    ],
    Victim: [
        {
            ROWID: 'VIC-01',
            VictimMasterID: 'VIC-01',
            CaseMasterID: '101',
            VictimName: 'Ananya Sharma',
            AgeYear: 34,
            GenderID: 'F',
            VictimPolice: 'No'
        }
    ],
    ComplainantDetails: [
        {
            ROWID: 'COMP-01',
            ComplainantID: 'COMP-01',
            CaseMasterID: '101',
            ComplainantName: 'Inspector Vijay Gowda',
            AgeYear: 42,
            GenderID: 'M'
        }
    ],
    Inv_OccuranceTime: [
        {
            ROWID: 'OCC-01',
            CaseMasterID: '101',
            FromDate: '2025-01-15',
            FromTime: '22:00:00',
            ToDate: '2025-01-15',
            ToTime: '23:30:00',
            PriorTo: '2025-01-15 22:30:00'
        }
    ],
    ArrestSurrender: [
        {
            ROWID: 'ARR-01',
            ArrestSurrenderID: 'ARR-01',
            CaseMasterID: '101',
            AccusedMasterID: 'ACC-01',
            AccusedName: 'Ramesh Kumar',
            ArrestSurrenderDate: '2025-01-16 04:00:00',
            PoliceStationID: 'PS-12 Jayanagar',
            IsAccused: true
        },
        {
            ROWID: 'ARR-02',
            ArrestSurrenderID: 'ARR-02',
            CaseMasterID: '102',
            AccusedMasterID: 'ACC-02',
            AccusedName: 'Ramesh Kumar',
            ArrestSurrenderDate: '2025-01-21 02:30:00',
            PoliceStationID: 'PS-12 Jayanagar',
            IsAccused: true
        },
        {
            ROWID: 'ARR-03',
            ArrestSurrenderID: 'ARR-03',
            CaseMasterID: '103',
            AccusedMasterID: 'ACC-04',
            AccusedName: 'Suresh Patil',
            ArrestSurrenderDate: '2025-02-02 18:45:00',
            PoliceStationID: 'PS-05 Koramangala',
            IsAccused: true
        },
        {
            ROWID: 'ARR-04',
            ArrestSurrenderID: 'ARR-04',
            CaseMasterID: '6',
            AccusedMasterID: 'ACC-05',
            AccusedName: 'Anil Reddy',
            ArrestSurrenderDate: '2025-02-10 11:20:00',
            PoliceStationID: 'PS-03 Central',
            IsAccused: true
        }
    ],
    Unit: [
        {
            ROWID: 'UNIT-01',
            UnitID: 'PS-12',
            UnitName: 'Jayanagar Police Station',
            TypeID: 'Police Station',
            DistrictID: 'Bengaluru Urban',
            Active: true
        },
        {
            ROWID: 'UNIT-02',
            UnitID: 'PS-05',
            UnitName: 'Koramangala Police Station',
            TypeID: 'Police Station',
            DistrictID: 'Bengaluru Urban',
            Active: true
        },
        {
            ROWID: 'UNIT-03',
            UnitID: 'PS-03',
            UnitName: 'Central Police Station',
            TypeID: 'Police Station',
            DistrictID: 'Bengaluru City',
            Active: true
        },
        {
            ROWID: 'UNIT-04',
            UnitID: 'PS-08',
            UnitName: 'Indiranagar Police Station',
            TypeID: 'Police Station',
            DistrictID: 'Bengaluru Urban',
            Active: true
        }
    ],
    District: [
        {
            ROWID: 'DIST-01',
            DistrictID: 'BLR-URBAN',
            DistrictName: 'Bengaluru Urban',
            StateID: 'Karnataka',
            Active: true
        },
        {
            ROWID: 'DIST-02',
            DistrictID: 'MYS-DIST',
            DistrictName: 'Mysuru',
            StateID: 'Karnataka',
            Active: true
        }
    ],
    ChargesheetDetails: [
        {
            ROWID: 'CS-01',
            CSID: 'CS-101',
            CaseMasterID: '101',
            csdate: '2025-02-10',
            cstype: 'Final Report',
            PolicePersonID: 'IO-441'
        }
    ],
    ActSectionAssociation: [
        {
            ROWID: 'ACT-01',
            CaseMasterID: '101',
            ActID: 'IPC',
            SectionID: '380/457'
        }
    ],
    Evidence: [
        {
            ROWID: 'EV-01',
            id: 'EV-01',
            CaseMasterID: '101',
            evidenceType: 'Physical Exhibit',
            description: 'Iron crowbar with paint traces matching damaged commercial shutter',
            storageLocation: 'Precinct Evidence Locker #4',
            sha256Hash: 'a8b5c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9'
        }
    ],
    CCTVRecord: [
        {
            ROWID: 'CCTV-01',
            id: 'CCTV-01',
            CaseMasterID: '101',
            cameraLocation: 'Jayanagar 4th Block Commercial Junction',
            recordingTimestamp: '2025-01-15 22:45:00',
            videoUrl: 'https://vault.ksp.gov.in/cctv/101-01.mp4'
        }
    ],
    CallDetailRecord: [
        {
            ROWID: 'CDR-01',
            id: 'CDR-01',
            CaseMasterID: '101',
            callerNumber: '+91-9845012345',
            receiverNumber: '+91-9845098765',
            callDurationSeconds: 145,
            cellTowerLocation: 'Tower #88 Jayanagar'
        }
    ],
    FinancialTransaction: [
        {
            ROWID: 'FIN-01',
            id: 'FIN-01',
            CaseMasterID: '101',
            sourceAccount: 'ACC-88231',
            destinationAccount: 'ACC-99120',
            transactionAmount: 45000,
            transactionType: 'IMPS Transfer'
        }
    ],
    ForensicReport: [],
    Weapon: [
        {
            ROWID: 'WEP-01',
            id: 'WEP-01',
            CaseMasterID: '101',
            weaponType: 'Iron Crowbar',
            seizureLocation: 'Rear alley behind scene'
        }
    ],
    Vehicle: [
        {
            ROWID: 'VEH-01',
            id: 'VEH-01',
            CaseMasterID: '101',
            registrationNumber: 'KA-04-AB-1234',
            vehicleModel: 'Bajaj Pulsar 150 Black',
            make: 'Two-Wheeler Motorcycle',
            seizureLocation: 'Suburban North Checkpoint'
        }
    ],
    BiometricRecord: [],
    CourtHearing: [
        {
            ROWID: 'CRT-01',
            id: 'CRT-01',
            CaseMasterID: '101',
            courtName: '1st ACMM Court, Bengaluru',
            hearingStage: 'Remand Extension Hearing',
            hearingDate: '2025-01-25 11:00:00'
        }
    ],
    InterrogationReport: []
};

function unwrapRow(row) {
    if (!row) return null;
    if (Object.prototype.hasOwnProperty.call(row, 'ROWID')) return row;
    const values = Object.values(row);
    return values.length ? values[0] : {};
}

function validateTable(tableName) {
    if (!tablesSchema || !tablesSchema[tableName]) {
        console.warn(`[datastoreClient] Notice: Table '${tableName}' is not in tables.js schema definition.`);
    }
}

function validateColumns(tableName, columns = []) {
    if (!tablesSchema || !tablesSchema[tableName]) return;
    const expected = tablesSchema[tableName];
    for (const col of columns) {
        if (!expected.includes(col)) {
            console.warn(`[datastoreClient] Notice: Column '${col}' is not in tables.js schema for '${tableName}'.`);
        }
    }
}

function validateZCQL(sql) {
    const tableRegex = /\b(?:FROM|JOIN)\s+([A-Za-z0-9_]+)/gi;
    let match;
    const tablesInQuery = [];
    while ((match = tableRegex.exec(sql)) !== null) {
        tablesInQuery.push(match[1]);
    }
    
    for (const table of tablesInQuery) {
        const matchingTable = Object.keys(tablesSchema).find(
            t => t.toLowerCase() === table.toLowerCase()
        );
        if (!matchingTable && !localStore[table]) {
            throw new Error(`Missing Datastore Table: The table '${table}' does not exist in the schema configuration.`);
        }
    }
}

function wrapError(err, tableName) {
    const msg = String(err.message || err.code || '').toLowerCase();
    
    if (msg.includes('unauthorized') || msg.includes('invalid credentials') || msg.includes('authentication failed') || msg.includes('unauthenticated')) {
        const error = new Error(`AUTHENTICATION_ERROR: Catalyst authentication failed for table '${tableName}'`);
        error.code = 'AUTHENTICATION_ERROR';
        return error;
    }
    
    if (msg.includes('no such table') || msg.includes('invalid_id') || msg.includes('does not exist') || msg.includes('no such resource')) {
        const error = new Error(`SCHEMA_MISMATCH: The table '${tableName}' does not exist or has an invalid ID in Catalyst.`);
        error.code = 'SCHEMA_MISMATCH';
        return error;
    }
    if (msg.includes('no such column') || msg.includes('column does not exist')) {
        const error = new Error(`SCHEMA_MISMATCH: A referenced column does not exist in table '${tableName}'.`);
        error.code = 'SCHEMA_MISMATCH';
        return error;
    }
    return err;
}

function isProductionMode() {
    return process.env.NODE_ENV === 'production';
}

function getTable(req, tableName) {
    validateTable(tableName);
    return catalyst.initialize(req).datastore().table(tableName);
}

async function getRows(req, tableName, { maxRows = 50 } = {}) {
    validateTable(tableName);
    const actualMaxRows = Math.min(Number(maxRows) || 50, 300);

    try {
        const response = await getTable(req, tableName).getPagedRows({ maxRows: actualMaxRows });
        const rows = (response.data || []).map(unwrapRow);
        return rows;
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        // Fallback to local test store only in non-production mode
        if (localStore[tableName]) {
            return localStore[tableName].slice(0, actualMaxRows);
        }
        if (req && req.requireRealData) {
            const e = new Error("Datastore currently unavailable.");
            e.code = 'DATASTORE_UNAVAILABLE';
            e.status = 503;
            throw e;
        }
        return [];
    }
}

async function getRowById(req, tableName, id) {
    if (!id) return null;
    validateTable(tableName);

    try {
        const row = await getTable(req, tableName).getRow(id);
        return unwrapRow(row);
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        // Fallback to local store by ROWID or CaseMasterID in non-production mode
        if (localStore[tableName]) {
            const found = localStore[tableName].find(r => 
                String(r.ROWID) === String(id) || 
                String(r.CaseMasterID) === String(id) ||
                String(r.CrimeNo) === String(id) ||
                String(r.CaseNo) === String(id)
            );
            if (found) return found;
        }
        return null;
    }
}

function escapeVal(v) {
    return String(v).replace(/'/g, "''");
}

async function query(req, sql) {
    try {
        validateZCQL(sql);
        const app = catalyst.initialize(req);
        const rows = await app.zcql().executeZCQLQuery(sql);
        return rows || [];
    } catch (err) {
        if (isProductionMode()) {
            const tableMatch = /FROM\s+([A-Za-z0-9_]+)/i.exec(sql);
            const tableName = tableMatch ? tableMatch[1] : 'UnknownTable';
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        // Simple fallback parser for local store in non-production mode
        const fromMatch = /FROM\s+([A-Za-z0-9_]+)/i.exec(sql);
        const tableName = fromMatch ? fromMatch[1] : null;
        if (tableName && localStore[tableName]) {
            let results = [...localStore[tableName]];
            
            // Check for simple WHERE key = 'val'
            const whereMatch = /WHERE\s+([A-Za-z0-9_]+)\s*=\s*'([^']+)'/i.exec(sql);
            if (whereMatch) {
                const key = whereMatch[1];
                const val = whereMatch[2];
                results = results.filter(r => String(r[key]) === String(val));
            }
            return results.map(r => ({ [tableName]: r }));
        }
        return [];
    }
}

async function getRowsWhere(req, tableName, conditions = {}, { maxRows = 50, orderBy, order = 'DESC' } = {}) {
    validateTable(tableName);
    const actualMaxRows = Math.min(Number(maxRows) || 50, 300);

    try {
        const columns = Object.keys(conditions);
        if (orderBy) columns.push(orderBy);
        validateColumns(tableName, columns);

        const clauses = Object.entries(conditions)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k} = '${escapeVal(v)}'`);
        const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
        const orderClause = orderBy ? ` ORDER BY ${orderBy} ${order}` : '';
        const sql = `SELECT * FROM ${tableName}${where}${orderClause} LIMIT ${actualMaxRows}`;
        const rows = await query(req, sql);
        return rows.map((r) => r[tableName] || unwrapRow(r));
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        if (localStore[tableName]) {
            let list = localStore[tableName].filter(row => {
                return Object.entries(conditions).every(([k, v]) => {
                    if (v === undefined || v === null || v === '') return true;
                    return String(row[k]) === String(v);
                });
            });
            return list.slice(0, actualMaxRows);
        }
        return [];
    }
}

async function getRowWhere(req, tableName, conditions = {}) {
    try {
        const rows = await getRowsWhere(req, tableName, conditions, { maxRows: 1 });
        return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        return null;
    }
}

async function getRowsByCase(req, tableName, caseMasterId, { maxRows = 25, orderBy } = {}) {
    if (!caseMasterId) return [];
    return await getRowsWhere(req, tableName, { CaseMasterID: caseMasterId }, { maxRows, orderBy });
}

async function insertRow(req, tableName, data) {
    try {
        validateTable(tableName);
        validateColumns(tableName, Object.keys(data));
        const row = await getTable(req, tableName).insertRow(data);
        return unwrapRow(row);
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        const newRow = { ROWID: `ROW-${Date.now()}`, ...data };
        if (!localStore[tableName]) localStore[tableName] = [];
        localStore[tableName].push(newRow);
        return newRow;
    }
}

async function insertRows(req, tableName, rows) {
    try {
        validateTable(tableName);
        if (rows.length > 0) validateColumns(tableName, Object.keys(rows[0]));
        const inserted = await getTable(req, tableName).insertRows(rows);
        return (inserted || []).map(unwrapRow);
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        if (!localStore[tableName]) localStore[tableName] = [];
        const result = rows.map((r, i) => ({ ROWID: `ROW-${Date.now()}-${i}`, ...r }));
        localStore[tableName].push(...result);
        return result;
    }
}

async function updateRow(req, tableName, id, data) {
    try {
        validateTable(tableName);
        validateColumns(tableName, Object.keys(data));
        const row = await getTable(req, tableName).updateRow({ ROWID: id, ...data });
        return unwrapRow(row);
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        if (localStore[tableName]) {
            const idx = localStore[tableName].findIndex(r => String(r.ROWID) === String(id) || String(r.CaseMasterID) === String(id));
            if (idx !== -1) {
                localStore[tableName][idx] = { ...localStore[tableName][idx], ...data };
                return localStore[tableName][idx];
            }
        }
        return { ROWID: id, ...data };
    }
}

async function deleteRow(req, tableName, id) {
    try {
        validateTable(tableName);
        return await getTable(req, tableName).deleteRow(id);
    } catch (err) {
        if (isProductionMode()) {
            const e = wrapError(err, tableName);
            e.status = 503;
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        if (localStore[tableName]) {
            localStore[tableName] = localStore[tableName].filter(r => String(r.ROWID) !== String(id) && String(r.CaseMasterID) !== String(id));
        }
        return { success: true };
    }
}

module.exports = {
    unwrapRow,
    query,
    getRows,
    getRowById,
    getRowsWhere,
    getRowWhere,
    getRowsByCase,
    insertRow,
    insertRows,
    updateRow,
    deleteRow
};
