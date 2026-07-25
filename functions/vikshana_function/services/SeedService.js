class SeedService {
    /** Fast parallelized case seeding. */
    static async seedCase(req, caseId) {
        const targetCaseId = caseId || '1';
        const result = { caseId: targetCaseId, inserted: {} };

        await Promise.all(
            SEED_TABLES.map(async ({ table, build }) => {
                try {
                    const existing = await datastoreClient.getRowsByCase(req, table, targetCaseId, { maxRows: 1 });
                    if (existing && existing.length > 0) {
                        result.inserted[table] = 0;
                        return;
                    }
                    const rows = build(targetCaseId);
                    const inserted = await datastoreClient.insertRows(req, table, rows);
                    result.inserted[table] = (inserted || []).length;
                } catch (err) {
                    console.warn(`Seeding table ${table} warning:`, err.message);
                    result.inserted[table] = 0;
                }
            })
        );

        return result;
    }

    static async seedUsers(req) {
        const demoUsers = [
            { name: 'Administrator', email: 'admin@vikshana.ai', role: 'Administrator', department: 'HQ', password_hash: hashPassword('password123'), status: 'ACTIVE' },
            { name: 'Investigator', email: 'investigator@vikshana.ai', role: 'Investigator', department: 'Field Ops', password_hash: hashPassword('password123'), status: 'ACTIVE' },
            { name: 'Analyst', email: 'analyst@vikshana.ai', role: 'Analyst', department: 'Intelligence', password_hash: hashPassword('password123'), status: 'ACTIVE' },
            { name: 'Supervisor', email: 'supervisor@vikshana.ai', role: 'Supervisor', department: 'HQ Ops', password_hash: hashPassword('password123'), status: 'ACTIVE' },
            { name: 'Policymaker', email: 'policymaker@vikshana.ai', role: 'Policymaker', department: 'Government', password_hash: hashPassword('password123'), status: 'ACTIVE' }
        ];

        const results = { inserted: 0, existing: 0 };
        for (const user of demoUsers) {
            const existing = await datastoreClient.getRowsWhere(req, 'UserMaster', { email: user.email }, { maxRows: 1 }).catch(() => []);
            if (existing && existing.length > 0) {
                results.existing++;
            } else {
                await datastoreClient.insertRow(req, 'UserMaster', user).catch(() => null);
                results.inserted++;
            }
        }
        return results;
    }

    static async seedAllCases(req, targetCaseId) {
        // Seed users first
        const userResults = await SeedService.seedUsers(req).catch(() => ({ inserted: 0, existing: 0 }));

        if (targetCaseId) {
            return { userSeeding: userResults, caseSeeding: [await SeedService.seedCase(req, targetCaseId)] };
        }

        let cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 10 }).catch(() => []);
        
        if (!cases || cases.length === 0) {
            const dummyCases = [
                { Status: 'Open', Jurisdiction: 'Indiranagar PS' },
                { Status: 'Under Investigation', Jurisdiction: 'Koramangala PS' }
            ];
            await datastoreClient.insertRows(req, 'CaseMaster', dummyCases).catch(() => []);
            cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 10 }).catch(() => []);
        }

        const results = [];
        for (const caseRow of cases) {
            if (!caseRow || !caseRow.ROWID) continue;
            results.push(await SeedService.seedCase(req, caseRow.ROWID));
        }
        return { userSeeding: userResults, caseSeeding: results };
    }
}

module.exports = SeedService;
