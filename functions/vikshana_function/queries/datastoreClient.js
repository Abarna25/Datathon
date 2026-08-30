const catalyst = require('zcatalyst-sdk-node');
const tablesSchema = require('./tables');
const fs = require('fs');
const path = require('path');

    // In-Memory seed dataset & cache
    const localStore = {
        InvestigationHypothesis: [],
        HypothesisEvidence: [],
        InvestigationAction: [],
        InvestigationDecisionAudit: [],
        EvidenceImpact: [],
        Evidence: [
            { ROWID: 'EVID-001', EvidenceID: 'EVID-001', CaseMasterID: '101', SourceType: 'CCTV', Verified: true, Description: 'Footage showing suspect near store', Timestamp: '2025-01-15 22:00:00' }
        ],
        CaseMaster: [
        {
            ROWID: '101',
            CaseMasterID: '101',
            CrimeNo: '0101/2025',
            CaseNo: 'CC-101',
            CrimeRegisteredDate: '2026-08-15 22:30:00',
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
            CrimeNo: '0102/2025',
            CaseNo: 'CC-102',
            CrimeRegisteredDate: '2026-08-20 23:15:00',
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
            CrimeNo: '0103/2025',
            CaseNo: 'CC-103',
            CrimeRegisteredDate: '2026-08-01 14:00:00',
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
            CrimeNo: '0104/2025',
            CaseNo: 'CC-104',
            CrimeRegisteredDate: '2026-07-25 01:45:00',
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
            CrimeNo: '0187/2024',
            CaseNo: 'CC-187',
            CrimeRegisteredDate: '2026-07-10 23:00:00',
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
        { ROWID: 'ACC-01', AccusedMasterID: 'ACC-01', CaseMasterID: '101', AccusedName: 'Ramesh Kumar', AgeYear: 28, GenderID: 1, PersonID: 'PER-901' },
        { ROWID: 'ACC-02', AccusedMasterID: 'ACC-02', CaseMasterID: '102', AccusedName: 'Ramesh Kumar', AgeYear: 28, GenderID: 1, PersonID: 'PER-901' },
        { ROWID: 'ACC-03', AccusedMasterID: 'ACC-03', CaseMasterID: '187', AccusedName: 'Ramesh Kumar', AgeYear: 28, GenderID: 1, PersonID: 'PER-901' },
        { ROWID: 'ACC-04', AccusedMasterID: 'ACC-04', CaseMasterID: '103', AccusedName: 'Suresh Patil', AgeYear: 32, GenderID: 1, PersonID: 'PER-902' },
        { ROWID: 'ACC-05', AccusedMasterID: 'ACC-05', CaseMasterID: '104', AccusedName: 'Ravi Kumar', AgeYear: 25, GenderID: 1, PersonID: 'PER-903' },
        { ROWID: 'ACC-06', AccusedMasterID: 'ACC-06', CaseMasterID: '105', AccusedName: 'Ravi Shankar', AgeYear: 35, GenderID: 1, PersonID: 'PER-904' },
        { ROWID: 'ACC-07', AccusedMasterID: 'ACC-07', CaseMasterID: '106', AccusedName: 'Anitha Kumar', AgeYear: 29, GenderID: 2, PersonID: 'PER-905' }
    ],

    Victim: [
        { ROWID: 'VIC-01', VictimMasterID: 'VIC-01', CaseMasterID: '101', VictimName: 'Ananya Sharma', AgeYear: 34, GenderID: 2, VictimPolice: 'No' }
    ],
    ComplainantDetails: [
        { ROWID: 'COMP-01', ComplainantID: 'COMP-01', CaseMasterID: '101', ComplainantName: 'Inspector Vijay Gowda', AgeYear: 42, GenderID: 1 }
    ],
    ArrestSurrender: [
        { ROWID: 'ARR-01', ArrestSurrenderID: 'ARR-01', CaseMasterID: '101', AccusedMasterID: 'ACC-01', AccusedName: 'Ramesh Kumar', ArrestSurrenderDate: '2025-01-16 04:00:00', PoliceStationID: 'PS-12', IsAccused: true },
        { ROWID: 'ARR-02', ArrestSurrenderID: 'ARR-02', CaseMasterID: '102', AccusedMasterID: 'ACC-02', AccusedName: 'Ramesh Kumar', ArrestSurrenderDate: '2025-01-21 02:30:00', PoliceStationID: 'PS-12', IsAccused: true },
        { ROWID: 'ARR-03', ArrestSurrenderID: 'ARR-03', CaseMasterID: '103', AccusedMasterID: 'ACC-04', AccusedName: 'Suresh Patil', ArrestSurrenderDate: '2025-02-02 18:45:00', PoliceStationID: 'PS-05', IsAccused: true }
    ],
    ChargesheetDetails: [
        { ROWID: 'CS-01', CSID: 'CS-101', CaseMasterID: '101', csdate: '2025-02-10', cstype: 'A', PolicePersonID: 'IO-441' }
    ],
    ActSectionAssociation: [
        { ROWID: 'ACT-01', CaseMasterID: '101', ActID: 'IPC', SectionID: '380' },
        { ROWID: 'ACT-02', CaseMasterID: '101', ActID: 'IPC', SectionID: '457' },
        { ROWID: 'ACT-03', CaseMasterID: '103', ActID: 'IPC', SectionID: '324' }
    ],
    Unit: [
        { ROWID: 'UNIT-01', UnitID: 'PS-12', UnitName: 'Jayanagar Police Station', TypeID: 'Police Station', DistrictID: 'Bengaluru Urban', Active: true },
        { ROWID: 'UNIT-02', UnitID: 'PS-05', UnitName: 'Koramangala Police Station', TypeID: 'Police Station', DistrictID: 'Bengaluru Urban', Active: true },
        { ROWID: 'UNIT-03', UnitID: 'PS-03', UnitName: 'Central Police Station', TypeID: 'Police Station', DistrictID: 'Bengaluru City', Active: true }
    ],
    District: [
        { ROWID: 'DIST-01', DistrictID: '1', DistrictName: 'Bengaluru City', StateID: 'Karnataka', Active: true },
        { ROWID: 'DIST-02', DistrictID: '2', DistrictName: 'Mysuru City', StateID: 'Karnataka', Active: true },
        { ROWID: 'DIST-03', DistrictID: '8', DistrictName: 'Ballari', StateID: 'Karnataka', Active: true }
    ],
    CaseStatusMaster: [
        { CaseStatusID: '1', CaseStatusName: 'Registered' },
        { CaseStatusID: '2', CaseStatusName: 'Under Investigation' },
        { CaseStatusID: '3', CaseStatusName: 'Chargesheeted' },
        { CaseStatusID: '4', CaseStatusName: 'Pending Trial' },
        { CaseStatusID: '5', CaseStatusName: 'Convicted' },
        { CaseStatusID: '6', CaseStatusName: 'Acquitted' },
        { CaseStatusID: '7', CaseStatusName: 'Closed - False' },
        { CaseStatusID: '8', CaseStatusName: 'Closed - Undetected' }
    ],
    Section: [
        { ActCode: 'IPC', SectionCode: '302', SectionDescription: 'Punishment for murder' },
        { ActCode: 'IPC', SectionCode: '307', SectionDescription: 'Attempt to murder' },
        { ActCode: 'IPC', SectionCode: '380', SectionDescription: 'Theft in dwelling house' },
        { ActCode: 'IPC', SectionCode: '457', SectionDescription: 'Lurking house-trespass or house-breaking by night' },
        { ActCode: 'IPC', SectionCode: '420', SectionDescription: 'Cheating and dishonestly inducing delivery of property' },
        { ActCode: 'IPC', SectionCode: '397', SectionDescription: 'Robbery or dacoity, with attempt to cause death or grievous hurt' },
        { ActCode: 'IPC', SectionCode: '498A', SectionDescription: 'Husband or relative of husband of a woman subjecting her to cruelty' }
    ],
    Investigation_Conversation: [],
    Investigation_Message: [],
    AuditLog: [],
    Evidence: [],
    CCTVRecord: [],
    CallDetailRecord: [],
    FinancialTransaction: [],
    ForensicReport: [],
    Weapon: [],
    Vehicle: [],
    BiometricRecord: [],
    CourtHearing: [],
    InterrogationReport: []
};

let datasetLoaded = false;

/**
 * Loads CSV records from the dataset directory into localStore
 */
function loadDatasetFromCSV() {
    if (datasetLoaded) return;
    datasetLoaded = true;

    try {
        const potentialPaths = [
            'E:/Datathon/Vikshana/dataset', // Hardcoded fallback for local Hackathon environment
            path.join(__dirname, '../../../dataset'),
            path.join(__dirname, '../../../../dataset'), // To escape .build/functions/vikshana_function/queries
            path.join(__dirname, '../../dataset'),
            path.join(process.cwd(), 'dataset'),
            path.join(process.cwd(), 'Vikshana/dataset')
        ];

        let dsPath = null;
        for (const p of potentialPaths) {
            if (fs.existsSync(p) && fs.existsSync(path.join(p, 'CaseMaster.csv'))) {
                dsPath = p;
                break;
            }
        }

        if (!dsPath) {
            console.log('[datastoreClient] Dataset directory not found. Using preloaded seed store.');
            return;
        }

        console.log(`[datastoreClient] Loading dataset from ${dsPath}...`);
        const { parse } = require('csv-parse/sync');

        const csvFiles = [
            { file: 'Unit.csv', table: 'Unit' },
            { file: 'District.csv', table: 'District' },
            { file: 'CaseStatusMaster.csv', table: 'CaseStatusMaster' },
            { file: 'Section.csv', table: 'Section' },
            { file: 'CaseMaster.csv', table: 'CaseMaster', limit: 50000 },
            { file: 'Accused.csv', table: 'Accused', limit: 70000 },
            { file: 'Victim.csv', table: 'Victim', limit: 60000 },
            { file: 'ComplainantDetails.csv', table: 'ComplainantDetails', limit: 60000 },
            { file: 'ArrestSurrender.csv', table: 'ArrestSurrender', limit: 30000 },
            { file: 'ChargesheetDetails.csv', table: 'ChargesheetDetails', limit: 35000 },
            { file: 'ActSectionAssociation.csv', table: 'ActSectionAssociation', limit: 50000 }
        ];

        for (const { file, table, limit } of csvFiles) {
            const filePath = path.join(dsPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const rows = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
                    const sliced = limit ? rows.slice(0, limit) : rows;
                    
                    // Normalize types
                    const normalized = sliced.map((r, idx) => {
                        const row = { ROWID: r.ROWID || `${table}-${idx + 1}`, ...r };
                        if (row.AgeYear !== undefined && row.AgeYear !== '') {
                            row.AgeYear = parseFloat(row.AgeYear) || row.AgeYear;
                        }
                        if (row.GenderID !== undefined && row.GenderID !== '') {
                            row.GenderID = parseFloat(row.GenderID) || row.GenderID;
                        }
                        return row;
                    });

                    // Merge with seed store
                    if (!localStore[table]) localStore[table] = [];
                    const existingIds = new Set(localStore[table].map(r => String(r.ROWID || r.CaseMasterID || r.AccusedMasterID || r.VictimMasterID || r.UnitID)));
                    
                    for (const r of normalized) {
                        const id = String(r.ROWID || r.CaseMasterID || r.AccusedMasterID || r.VictimMasterID || r.UnitID);
                        if (!existingIds.has(id)) {
                            localStore[table].push(r);
                        }
                    }
                    console.log(`[datastoreClient] Loaded ${localStore[table].length} records into table '${table}'.`);
                } catch (parseErr) {
                    console.warn(`[datastoreClient] Error parsing ${file}:`, parseErr.message);
                }
            }
        }
    } catch (e) {
        console.warn('[datastoreClient] Dataset initialization warning:', e.message);
    }
}

// Auto-trigger loading on require
try {
    loadDatasetFromCSV();
} catch (e) {
    // Ignore initialization failure
}

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

// ------------------------------------------------------------------------------------------------
// ADVANCED IN-MEMORY SQL / ZCQL QUERY ENGINE
// ------------------------------------------------------------------------------------------------

/**
 * Parses and evaluates a WHERE clause on a record
 */
function evaluateWhere(row, whereClause) {
    if (!whereClause || !whereClause.trim()) return true;

    // Normalize operators and tokens and strip all enclosing outer parentheses
    let clause = stripOuterParens(whereClause.trim());

    // Check for OR splits at top-level
    const orParts = splitTopLevel(clause, 'OR');
    if (orParts.length > 1) {
        return orParts.some(part => evaluateWhere(row, part));
    }

    // Check for AND splits at top-level
    const andParts = splitTopLevel(clause, 'AND');
    if (andParts.length > 1) {
        return andParts.every(part => evaluateWhere(row, part));
    }

    // Evaluate single condition
    return evaluateSingleCondition(row, clause);
}


function splitTopLevel(clause, operator) {
    const parts = [];
    let current = '';
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = '';

    const tokens = clause.split(/\s+/);
    let i = 0;

    while (i < clause.length) {
        const ch = clause[i];

        if ((ch === "'" || ch === '"') && (i === 0 || clause[i - 1] !== '\\')) {
            if (inQuotes && ch === quoteChar) {
                inQuotes = false;
            } else if (!inQuotes) {
                inQuotes = true;
                quoteChar = ch;
            }
        }

        if (!inQuotes) {
            if (ch === '(') parenDepth++;
            if (ch === ')') parenDepth--;

            if (parenDepth === 0) {
                const rest = clause.slice(i);
                const opRegex = new RegExp(`^\\s+${operator}\\s+`, 'i');
                const match = rest.match(opRegex);
                if (match) {
                    parts.push(current.trim());
                    current = '';
                    i += match[0].length;
                    continue;
                }
            }
        }

        current += ch;
        i++;
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts.length > 1 ? parts : [clause];
}

function stripOuterParens(str) {
    str = str.trim();
    while (str.startsWith('(') && str.endsWith(')')) {
        let depth = 0;
        let balanced = true;
        for (let i = 0; i < str.length - 1; i++) {
            if (str[i] === '(') depth++;
            if (str[i] === ')') depth--;
            if (depth === 0) {
                balanced = false;
                break;
            }
        }
        if (balanced) {
            str = str.slice(1, -1).trim();
        } else {
            break;
        }
    }
    return str;
}

function evaluateSingleCondition(row, condition) {
    condition = condition.trim();

    // 1. IS NULL / IS NOT NULL
    const isNullMatch = condition.match(/^([A-Za-z0-9_.]+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
        const val = getVal(row, isNullMatch[1]);
        return val === null || val === undefined || val === '';
    }

    const isNotNullMatch = condition.match(/^([A-Za-z0-9_.]+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
        const val = getVal(row, isNotNullMatch[1]);
        return val !== null && val !== undefined && val !== '';
    }

    // 2. BETWEEN val1 AND val2
    const betweenMatch = condition.match(/^([A-Za-z0-9_.]+)\s+BETWEEN\s+['"]?([^'"\s]+)['"]?\s+AND\s+['"]?([^'"\s]+)['"]?$/i);
    if (betweenMatch) {
        const val = getVal(row, betweenMatch[1]);
        const low = betweenMatch[2];
        const high = betweenMatch[3];
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && !isNaN(parseFloat(low)) && !isNaN(parseFloat(high))) {
            return numVal >= parseFloat(low) && numVal <= parseFloat(high);
        }
        return String(val) >= low && String(val) <= high;
    }

    // 3. IN (...) / NOT IN (...)
    const inMatch = condition.match(/^([A-Za-z0-9_.]+)\s+(NOT\s+)?IN\s*\(([^)]+)\)$/i);
    if (inMatch) {
        const val = String(getVal(row, inMatch[1])).toLowerCase().trim();
        const isNot = !!inMatch[2];
        const list = inMatch[3].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
        const includes = list.includes(val);
        return isNot ? !includes : includes;
    }

    // 4. LIKE '%...%' / LIKE '...%' / LIKE '%...'
    const likeMatch = condition.match(/^([A-Za-z0-9_.]+)\s+(?:NOT\s+)?LIKE\s+['"]([^'"]+)['"]$/i);
    if (likeMatch) {
        const val = String(getVal(row, likeMatch[1]) || '').toLowerCase();
        let pattern = likeMatch[2].toLowerCase();
        const isNot = /\bNOT\s+LIKE\b/i.test(condition);

        let matches = false;
        if (pattern.startsWith('%') && pattern.endsWith('%')) {
            const term = pattern.slice(1, -1);
            matches = val.includes(term);
        } else if (pattern.startsWith('%')) {
            const term = pattern.slice(1);
            matches = val.endsWith(term);
        } else if (pattern.endsWith('%')) {
            const term = pattern.slice(0, -1);
            matches = val.startsWith(term);
        } else {
            matches = val === pattern;
        }

        return isNot ? !matches : matches;
    }

    // 5. Comparison operators: >=, <=, !=, <>, >, <, =
    const compMatch = condition.match(/^([A-Za-z0-9_.]+)\s*(>=|<=|!=|<>|>|<|=)\s*['"]?([^'"]*?)['"]?$/);
    if (compMatch) {
        const col = compMatch[1];
        const op = compMatch[2];
        const target = compMatch[3];
        const val = getVal(row, col);

        const numVal = parseFloat(val);
        const numTarget = parseFloat(target);
        const isNumeric = !isNaN(numVal) && !isNaN(numTarget) && String(val).trim() !== '' && String(target).trim() !== '';

        if (isNumeric) {
            switch (op) {
                case '=': return numVal === numTarget;
                case '!=':
                case '<>': return numVal !== numTarget;
                case '>': return numVal > numTarget;
                case '<': return numVal < numTarget;
                case '>=': return numVal >= numTarget;
                case '<=': return numVal <= numTarget;
            }
        }

        const strVal = String(val || '').toLowerCase();
        const strTarget = String(target || '').toLowerCase();

        switch (op) {
            case '=': return strVal === strTarget;
            case '!=':
            case '<>': return strVal !== strTarget;
            case '>': return strVal > strTarget;
            case '<': return strVal < strTarget;
            case '>=': return strVal >= strTarget;
            case '<=': return strVal <= strTarget;
        }
    }

    return true;
}

function getVal(row, colName) {
    if (!row) return undefined;
    const cleanCol = colName.includes('.') ? colName.split('.').pop() : colName;
    if (row[cleanCol] !== undefined) return row[cleanCol];
    if (row[colName] !== undefined) return row[colName];

    // Case-insensitive lookup
    const lower = cleanCol.toLowerCase();
    for (const key of Object.keys(row)) {
        if (key.toLowerCase() === lower) return row[key];
    }
    return undefined;
}

/**
 * Execute SQL on localStore with full SQL engine
 */
function executeLocalSQL(sql) {
    loadDatasetFromCSV();

    // 1. Extract main table
    const fromMatch = /\bFROM\s+([A-Za-z0-9_]+)(?:\s+(?:AS\s+)?([A-Za-z0-9_]+))?/i.exec(sql);
    if (!fromMatch) return [];

    const tableName = fromMatch[1];
    let rows = localStore[tableName] ? [...localStore[tableName]] : [];

    // 2. Handle JOINs
    const joinRegex = /\b(?:LEFT\s+)?JOIN\s+([A-Za-z0-9_]+)(?:\s+(?:AS\s+)?([A-Za-z0-9_]+))?\s+ON\s+([A-Za-z0-9_.]+)\s*=\s*([A-Za-z0-9_.]+)/gi;
    let joinMatch;
    while ((joinMatch = joinRegex.exec(sql)) !== null) {
        const joinTable = joinMatch[1];
        const leftCol = joinMatch[3];
        const rightCol = joinMatch[4];

        const joinRows = localStore[joinTable] || [];
        const joined = [];

        for (const r of rows) {
            const leftVal = getVal(r, leftCol);
            const matches = joinRows.filter(jr => String(getVal(jr, rightCol)) === String(leftVal));
            if (matches.length > 0) {
                for (const m of matches) {
                    joined.push({ ...r, ...m });
                }
            } else {
                joined.push(r);
            }
        }
        rows = joined;
    }

    // 3. WHERE clause
    const whereMatch = /\bWHERE\s+([\s\S]+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i.exec(sql);
    if (whereMatch) {
        const whereClause = whereMatch[1];
        rows = rows.filter(r => evaluateWhere(r, whereClause));
    }

    // 4. GROUP BY clause
    const groupMatch = /\bGROUP\s+BY\s+([A-Za-z0-9_,.\s]+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i.exec(sql);
    if (groupMatch) {
        const groupCols = groupMatch[1].split(',').map(s => s.trim().replace(/^.*\./, ''));
        const groups = new Map();

        for (const r of rows) {
            const key = groupCols.map(c => String(getVal(r, c) || '')).join('|||');
            if (!groups.has(key)) {
                groups.set(key, { sample: r, items: [] });
            }
            groups.get(key).items.push(r);
        }

        const groupedResults = [];
        for (const [key, { sample, items }] of groups.entries()) {
            const resultRow = { ...sample };
            resultRow['COUNT(*)'] = items.length;
            resultRow['count'] = items.length;
            groupedResults.push(resultRow);
        }
        rows = groupedResults;
    }

    // 5. Aggregations if no GROUP BY (e.g. SELECT COUNT(*), AVG(AgeYear))
    const isAggOnly = /SELECT\s+(COUNT\(|AVG\(|MIN\(|MAX\(|SUM\()/i.test(sql) && !groupMatch;
    if (isAggOnly) {
        const aggResult = {};
        const countMatch = /COUNT\(([^)]*)\)/i.exec(sql);
        if (countMatch) {
            aggResult['COUNT(*)'] = rows.length;
            aggResult['count'] = rows.length;
        }
        const avgMatch = /AVG\(([^)]+)\)/i.exec(sql);
        if (avgMatch) {
            const col = avgMatch[1].trim();
            const nums = rows.map(r => parseFloat(getVal(r, col))).filter(n => !isNaN(n));
            aggResult[`AVG(${col})`] = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0;
        }
        const minMatch = /MIN\(([^)]+)\)/i.exec(sql);
        if (minMatch) {
            const col = minMatch[1].trim();
            const nums = rows.map(r => parseFloat(getVal(r, col))).filter(n => !isNaN(n));
            aggResult[`MIN(${col})`] = nums.length ? Math.min(...nums) : 0;
        }
        const maxMatch = /MAX\(([^)]+)\)/i.exec(sql);
        if (maxMatch) {
            const col = maxMatch[1].trim();
            const nums = rows.map(r => parseFloat(getVal(r, col))).filter(n => !isNaN(n));
            aggResult[`MAX(${col})`] = nums.length ? Math.max(...nums) : 0;
        }
        return [{ [tableName]: aggResult }];
    }

    // 6. ORDER BY clause
    const orderMatch = /\bORDER\s+BY\s+([A-Za-z0-9_.]+)(?:\s+(ASC|DESC))?/i.exec(sql);
    if (orderMatch) {
        const orderCol = orderMatch[1].replace(/^.*\./, '');
        const orderDir = (orderMatch[2] || 'ASC').toUpperCase();

        rows.sort((a, b) => {
            let vA = getVal(a, orderCol);
            let vB = getVal(b, orderCol);

            const nA = parseFloat(vA);
            const nB = parseFloat(vB);
            if (!isNaN(nA) && !isNaN(nB)) {
                return orderDir === 'DESC' ? nB - nA : nA - nB;
            }

            vA = String(vA || '').toLowerCase();
            vB = String(vB || '').toLowerCase();
            if (vA < vB) return orderDir === 'DESC' ? 1 : -1;
            if (vA > vB) return orderDir === 'DESC' ? -1 : 1;
            return 0;
        });
    }

    // 7. LIMIT and OFFSET
    const limitMatch = /\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i.exec(sql);
    const offset = limitMatch && limitMatch[2] ? parseInt(limitMatch[2], 10) : 0;
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 100;

    const finalRows = rows.slice(offset, offset + limit);
    return finalRows.map(r => ({ [tableName]: r }));
}

async function getRows(req, tableName, { maxRows = 50 } = {}) {
    validateTable(tableName);
    loadDatasetFromCSV();
    const actualMaxRows = Math.min(Number(maxRows) || 50, 500);

    if (!isProductionMode()) {
        if (localStore[tableName]) {
            return localStore[tableName].slice(0, actualMaxRows);
        }
        return [];
    }

    try {
        const response = await getTable(req, tableName).getPagedRows({ maxRows: actualMaxRows });
        const rows = (response.data || []).map(unwrapRow);
        return rows;
    } catch (err) {
        const e = wrapError(err, tableName);
        e.status = 503;
        e.code = 'DATASTORE_UNAVAILABLE';
        throw e;
    }
}

async function getAllRows(req, tableName) {
    try {
        validateTable(tableName);
        const allRows = [];
        let nextToken = null;
        let pageCount = 0;

        do {
            const opts = { maxRows: 100 };
            if (nextToken) opts.nextToken = nextToken;

            const response = await getTable(req, tableName).getPagedRows(opts);
            const rows = (response.data || []).map(unwrapRow);
            allRows.push(...rows);
            
            nextToken = response.next_token;
            pageCount++;
        } while (nextToken && allRows.length < 100000); // safety cap at 100k to prevent OOM

        console.log(`DATA_SOURCE=Catalyst | TABLE=${tableName} | ROW_COUNT=${allRows.length} | PAGES=${pageCount} | QUERY=getAllRows`);
        return allRows;
    } catch (err) {
        console.error(`[datastoreClient] getAllRows error for ${tableName}:`, err.message || err);
        return [];
    }
}

/**
 * Memory-safe streaming of large datasets using Catalyst pagination.
 * Fetches page by page, calls the processor callback, and discards the page.
 */
async function streamRows(req, tableName, processorFn, { maxRowsPerChunk = 200 } = {}) {
    try {
        validateTable(tableName);
        let nextToken = null;
        let totalCount = 0;
        let pageCount = 0;

        do {
            const opts = { maxRows: Math.min(Number(maxRowsPerChunk), 500) };
            if (nextToken) opts.nextToken = nextToken;

            const response = await getTable(req, tableName).getPagedRows(opts);
            const rows = (response.data || []).map(unwrapRow);
            
            if (rows.length > 0) {
                await processorFn(rows, pageCount);
                totalCount += rows.length;
            }
            
            nextToken = response.next_token;
            pageCount++;
        } while (nextToken);

        console.log(`DATA_SOURCE=Catalyst | TABLE=${tableName} | ROW_COUNT=${totalCount} | PAGES=${pageCount} | QUERY=streamRows`);
        return { status: 'SUCCESS', totalCount, pagesProcessed: pageCount };
    } catch (err) {
        console.error(`[datastoreClient DIAGNOSTICS] streamRows EXACT ERROR for ${tableName}:`, err.message || err);
        throw wrapError(err, tableName);
    }
}

async function getRowById(req, tableName, id) {
    if (!id) return null;
    validateTable(tableName);
    loadDatasetFromCSV();

    if (!isProductionMode()) {
        if (localStore[tableName]) {
            const found = localStore[tableName].find(r => 
                String(r.ROWID) === String(id) || 
                String(r.CaseMasterID) === String(id) ||
                String(r.CrimeNo) === String(id) ||
                String(r.CaseNo) === String(id) ||
                String(r.AccusedMasterID) === String(id) ||
                String(r.VictimMasterID) === String(id)
            );
            if (found) return found;
        }
        return null;
    }

    try {
        const row = await getTable(req, tableName).getRow(id);
        return unwrapRow(row);
    } catch (err) {
        const e = wrapError(err, tableName);
        e.status = 503;
        e.code = 'DATASTORE_UNAVAILABLE';
        throw e;
    }
}

function escapeVal(v) {
    return String(v).replace(/'/g, "''");
}

async function query(req, sql) {
    if (!isProductionMode()) {
        return executeLocalSQL(sql);
    }

    try {
        validateZCQL(sql);
        const app = catalyst.initialize(req);
        const rows = await app.zcql().executeZCQLQuery(sql);
        return rows || [];
    } catch (err) {
        const tableMatch = /FROM\s+([A-Za-z0-9_]+)/i.exec(sql);
        const tableName = tableMatch ? tableMatch[1] : 'UnknownTable';
        const e = wrapError(err, tableName);
        e.status = 503;
        e.code = 'DATASTORE_UNAVAILABLE';
        throw e;
    }
}

async function getRowsWhere(req, tableName, conditions = {}, { maxRows = 50, offset = 0, orderBy, order = 'DESC' } = {}) {
    validateTable(tableName);
    loadDatasetFromCSV();
    const actualMaxRows = Math.min(Number(maxRows) || 50, 2000);
    const actualOffset = Number(offset) || 0;

    if (!isProductionMode()) {
        if (localStore[tableName]) {
            let list = localStore[tableName].filter(row => {
                return Object.entries(conditions).every(([k, v]) => {
                    if (v === undefined || v === null || v === '') return true;
                    return String(row[k]) === String(v);
                });
            });
            if (orderBy) {
                list.sort((a, b) => {
                    if (a[orderBy] < b[orderBy]) return order.toUpperCase() === 'ASC' ? -1 : 1;
                    if (a[orderBy] > b[orderBy]) return order.toUpperCase() === 'ASC' ? 1 : -1;
                    return 0;
                });
            }
            return list.slice(actualOffset, actualOffset + actualMaxRows);
        }
        return [];
    }

    try {
        const columns = Object.keys(conditions);
        if (orderBy) columns.push(orderBy);
        validateColumns(tableName, columns);

        const clauses = Object.entries(conditions)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k} = '${escapeVal(v)}'`);
        const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
        const orderClause = orderBy ? ` ORDER BY ${orderBy} ${order}` : '';
        
        // ZCQL standard limit clause format: LIMIT limit OFFSET offset
        let limitClause = ` LIMIT ${actualMaxRows}`;
        if (actualOffset > 0) {
            limitClause += ` OFFSET ${actualOffset}`;
        }
        
        const sql = `SELECT * FROM ${tableName}${where}${orderClause}${limitClause}`;
        const rows = await query(req, sql);
        return rows.map((r) => r[tableName] || unwrapRow(r));
    } catch (err) {
        const e = wrapError(err, tableName);
        e.status = 503;
        e.code = 'DATASTORE_UNAVAILABLE';
        throw e;
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
    loadDatasetFromCSV();
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
    loadDatasetFromCSV();
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
    loadDatasetFromCSV();
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
    loadDatasetFromCSV();
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
    getAllRows,
    streamRows,
    getRowById,
    getRowsWhere,
    getRowWhere,
    getRowsByCase,
    insertRow,
    insertRows,
    updateRow,
    deleteRow,
    localStore,
    loadDatasetFromCSV
};