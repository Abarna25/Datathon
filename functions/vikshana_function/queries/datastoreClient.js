const catalyst = require('zcatalyst-sdk-node');
const tablesSchema = require('./tables');

function unwrapRow(row) {
    if (!row) return null;
    if (Object.prototype.hasOwnProperty.call(row, 'ROWID')) return row;
    const values = Object.values(row);
    return values.length ? values[0] : {};
}

function getTable(req, tableName) {
    validateTable(tableName);
    return catalyst.initialize(req).datastore().table(tableName);
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
        if (!matchingTable) {
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

async function getRows(req, tableName, { maxRows = 50 } = {}) {
    try {
        validateTable(tableName);
        const actualMaxRows = Math.min(Number(maxRows) || 50, 300);
        const response = await getTable(req, tableName).getPagedRows({ maxRows: actualMaxRows });
        const rows = (response.data || []).map(unwrapRow);
        
        console.log(`DATA_SOURCE=Catalyst | TABLE=${tableName} | ROW_COUNT=${rows.length} | QUERY=getPagedRows`);
        if (rows.length === 0) console.log(`[datastoreClient] EMPTY_TABLE: No rows returned for ${tableName}`);
        
        return rows;
    } catch (err) {
        if (req && req.requireRealData) {
            const e = new Error("Case completeness cannot be calculated because the investigation datastore is currently unavailable.");
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        
        console.error(`[datastoreClient DIAGNOSTICS] getRows EXACT ERROR for ${tableName}:`, err.message || err);
        throw wrapError(err, tableName);
    }
}

async function getRowById(req, tableName, id) {
    if (!id) return null;
    try {
        validateTable(tableName);
        const row = await getTable(req, tableName).getRow(id);
        const unwrapped = unwrapRow(row);
        
        console.log(`DATA_SOURCE=Catalyst | TABLE=${tableName} | ROW_COUNT=${unwrapped ? 1 : 0} | QUERY=getRowById(${id})`);
        if (!unwrapped || Object.keys(unwrapped).length === 0) {
            console.log(`[datastoreClient] EMPTY_TABLE: Row ID ${id} not found in ${tableName}`);
        }
        
        return unwrapped;
    } catch (err) {
        if (tableName === 'CaseMaster') {
            try {
                const rows = await getRowsWhere(req, 'CaseMaster', { CaseMasterID: id }, { maxRows: 1 });
                if (rows.length > 0) return rows[0];
                const rows2 = await getRowsWhere(req, 'CaseMaster', { CrimeNo: id }, { maxRows: 1 });
                if (rows2.length > 0) return rows2[0];
                const rows3 = await getRowsWhere(req, 'CaseMaster', { CaseNo: id }, { maxRows: 1 });
                if (rows3.length > 0) return rows3[0];
            } catch (fallbackErr) {
                console.error(`[datastoreClient] Fallback query failed for CaseMaster ${id}:`, fallbackErr.message);
            }
        }
        
        if (req && req.requireRealData) {
            if (err.message && (err.message.includes('Invalid Row ID') || err.message.includes('not found') || err.message.includes('no such table'))) {
                return null;
            }
            const e = new Error("Case completeness cannot be calculated because the investigation datastore is currently unavailable.");
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        console.error(`[datastoreClient DIAGNOSTICS] getRowById EXACT ERROR for ${tableName} ID ${id}:`, err.message || err);
        throw wrapError(err, tableName);
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
        
        const tableMatch = /FROM\s+([A-Za-z0-9_]+)/i.exec(sql);
        const tableName = tableMatch ? tableMatch[1] : 'UnknownTable';
        const count = rows ? rows.length : 0;
        
        console.log(`DATA_SOURCE=Catalyst | TABLE=${tableName} | ROW_COUNT=${count} | QUERY=${sql}`);
        if (count === 0) console.log(`[datastoreClient] EMPTY_TABLE: No matching records for query in ${tableName}`);

        return rows || [];
    } catch (err) {
        if (req && req.requireRealData) {
            const e = new Error("Case completeness cannot be calculated because the investigation datastore is currently unavailable.");
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }

        const tableMatch = /FROM\s+([A-Za-z0-9_]+)/i.exec(sql);
        const tableName = tableMatch ? tableMatch[1] : 'UnknownTable';
        
        console.error(`[datastoreClient DIAGNOSTICS] query EXACT ERROR for ${tableName}, SQL [${sql}]:`, err.message || err);
        throw wrapError(err, tableName);
    }
}

async function getRowsWhere(req, tableName, conditions = {}, { maxRows = 50, orderBy, order = 'DESC' } = {}) {
    try {
        validateTable(tableName);
        const columns = Object.keys(conditions);
        if (orderBy) columns.push(orderBy);
        validateColumns(tableName, columns);

        const clauses = Object.entries(conditions)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k} = '${escapeVal(v)}'`);
        const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
        const orderClause = orderBy ? ` ORDER BY ${orderBy} ${order}` : '';
        const actualMaxRows = Math.min(Number(maxRows) || 50, 300);
        const sql = `SELECT * FROM ${tableName}${where}${orderClause} LIMIT ${actualMaxRows}`;
        const rows = await query(req, sql);
        return rows.map((r) => r[tableName] || unwrapRow(r));
    } catch (err) {
        console.error(`[datastoreClient DIAGNOSTICS] getRowsWhere EXACT ERROR for ${tableName}:`, err.message || err);
        if (req && req.requireRealData) {
            const e = new Error("Case completeness cannot be calculated because the investigation datastore is currently unavailable.");
            e.code = 'DATASTORE_UNAVAILABLE';
            throw e;
        }
        throw wrapError(err, tableName);
    }
}

function normalizeRow(row, tableName) {
    if (!row) return row;
    const unwrapped = unwrapRow(row);
    if (!unwrapped || typeof unwrapped !== 'object') return unwrapped;

    const copy = { ...unwrapped };

    if (tableName === 'Victim') {
        copy.name = copy.VictimName || `Victim #${copy.ROWID || copy.VictimMasterID || ''}`;
        copy.age = copy.AgeYear;
        copy.gender = copy.GenderID;
    } else if (tableName === 'Accused' || tableName === 'ArrestSurrender') {
        copy.name = copy.AccusedName || `Accused #${copy.ROWID || ''}`;
    }

    return copy;
}

async function getRowsByCase(req, tableName, caseMasterId, { maxRows = 25, orderBy } = {}) {
    if (!caseMasterId) return [];
    validateTable(tableName);

    // Strictly check for and query CaseMasterID since that's the only valid foreign key in the official schema
    try {
        if (tablesSchema[tableName].includes('CaseMasterID')) {
            const rows = await getRowsWhere(req, tableName, { CaseMasterID: caseMasterId }, { maxRows, orderBy });
            return (rows || []).map(r => normalizeRow(r, tableName));
        }
    } catch (e) {
        console.error(`[datastoreClient] getRowsByCase error for ${tableName}:`, e.message);
    }
    return [];
}

async function insertRow(req, tableName, data) {
    try {
        validateTable(tableName);
        validateColumns(tableName, Object.keys(data));
        const row = await getTable(req, tableName).insertRow(data);
        return unwrapRow(row);
    } catch (err) {
        throw wrapError(err, tableName);
    }
}

async function insertRows(req, tableName, rows) {
    try {
        validateTable(tableName);
        if (rows.length > 0) {
            validateColumns(tableName, Object.keys(rows[0]));
        }
        const inserted = await getTable(req, tableName).insertRows(rows);
        return (inserted || []).map(unwrapRow);
    } catch (err) {
        throw wrapError(err, tableName);
    }
}

async function updateRow(req, tableName, id, data) {
    try {
        validateTable(tableName);
        validateColumns(tableName, Object.keys(data));
        const row = await getTable(req, tableName).updateRow({ ROWID: id, ...data });
        return unwrapRow(row);
    } catch (err) {
        throw wrapError(err, tableName);
    }
}

async function deleteRow(req, tableName, id) {
    try {
        validateTable(tableName);
        return await getTable(req, tableName).deleteRow(id);
    } catch (err) {
        throw wrapError(err, tableName);
    }
}

module.exports = {
    unwrapRow,
    query,
    getRows,
    getRowById,
    getRowsWhere,
    getRowsByCase,
    insertRow,
    insertRows,
    updateRow,
    deleteRow
};
