/**
 * VIKSHANA Copilot UX & Query Pipeline Verification Suite
 * Validates the Intent+Entity routing, query validation, and clean natural-language answers.
 */

const textToSQLService = require('../services/TextToSQLService');
const datastoreClient = require('../queries/datastoreClient');

const TEST_CASES = [
    {
        query: 'Show all FIRs',
        expectedIntent: 'ALL_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'List all cases',
        expectedIntent: 'ALL_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'Show all registered cases',
        expectedIntent: 'ALL_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'Show all FIRs registered in 2021',
        expectedIntent: 'CASES_BY_YEAR',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('2021%')
    },
    {
        query: 'Show all FIRs registered in 2022',
        expectedIntent: 'CASES_BY_YEAR',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('2022%')
    },
    {
        query: 'Show all cases from 2023',
        expectedIntent: 'CASES_BY_YEAR',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('2023%')
    },
    {
        query: 'Show cases registered today',
        expectedIntent: 'CASES_TODAY',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'Show the latest cases',
        expectedIntent: 'LATEST_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('ORDER BY CrimeRegisteredDate DESC') && !sql.includes('AgeYear')
    },
    {
        query: 'Show the oldest cases',
        expectedIntent: 'OLDEST_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('ORDER BY CrimeRegisteredDate ASC') && !sql.includes('Accused')
    },
    {
        query: 'Show the most recent 10 FIRs',
        expectedIntent: 'LATEST_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('ORDER BY CrimeRegisteredDate DESC LIMIT 10')
    },
    {
        query: 'Show all open cases',
        expectedIntent: 'OPEN_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('CaseStatusID')
    },
    {
        query: 'Show all closed cases',
        expectedIntent: 'CLOSED_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('CaseStatusID')
    },
    {
        query: 'Show all pending cases',
        expectedIntent: 'PENDING_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'Show cases currently under investigation',
        expectedIntent: 'OPEN_CASES',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster'
    },
    {
        query: 'Find case number 3572',
        expectedIntent: 'CASE_LOOKUP',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('3572')
    },
    {
        query: 'Show complete details of case 3572',
        expectedIntent: 'CASE_DETAILS',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('3572')
    },
    {
        query: 'Give me a summary of case 3572',
        expectedIntent: 'CASE_SUMMARY',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('3572')
    },
    {
        query: 'What is the status of case 3572?',
        expectedIntent: 'CASE_STATUS',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('3572')
    },
    {
        query: 'When was FIR 101 registered?',
        expectedIntent: 'FIR_DATE',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('101')
    },
    {
        query: 'Which police station registered FIR 101?',
        expectedIntent: 'FIR_POLICE_STATION',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('101')
    },
    {
        query: 'Show all cases handled by Ballari Town PS',
        expectedIntent: 'CASES_BY_POLICE_STATION',
        expectedEntity: 'CaseMaster',
        expectedTable: 'CaseMaster',
        validateSql: (sql) => sql.includes('Ballari')
    }
];

async function runVerification() {
    console.log('================================================================');
    console.log('  VIKSHANA COPILOT UX & QUERY PIPELINE VERIFICATION SUITE');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < TEST_CASES.length; i++) {
        const tc = TEST_CASES[i];
        console.log(`[Test ${i + 1}/${TEST_CASES.length}] "${tc.query}"`);

        try {
            // 1. Classification
            const classified = textToSQLService.classifyIntentAndEntity(tc.query);
            if (classified.intent !== tc.expectedIntent) {
                throw new Error(`Intent mismatch: Expected '${tc.expectedIntent}', got '${classified.intent}'`);
            }
            if (classified.entity !== tc.expectedEntity) {
                throw new Error(`Entity mismatch: Expected '${tc.expectedEntity}', got '${classified.entity}'`);
            }

            // 2. Query Generation & Entity Validation
            const sql = await textToSQLService.generateSQL(tc.query);
            if (!sql.toUpperCase().includes(`FROM ${tc.expectedTable.toUpperCase()}`)) {
                throw new Error(`SQL table mismatch: Expected table '${tc.expectedTable}', but SQL was: ${sql}`);
            }
            if (tc.validateSql && !tc.validateSql(sql)) {
                throw new Error(`Custom SQL validation failed for query: ${sql}`);
            }

            // 3. Execution against Datastore
            const results = await textToSQLService.executeSQL({}, sql);

            // 4. Answer Generation (Zero Internal Logic / SQL Leakage)
            const answer = await textToSQLService.generateAnswer({}, tc.query, sql, results, null, classified);
            
            // Check that internal SQL / ZCQL or technical headers are NOT leaked in user-facing answer
            if (answer.includes('Synthesized ZCQL Query') || answer.includes('AI Rationale:') || answer.includes('Filters Applied:')) {
                throw new Error(`Internal execution logic was leaked in user-facing answer markdown!`);
            }

            // 5. Trace Generation
            const trace = textToSQLService.generateTrace(tc.query, sql, results, classified, 1);
            if (!trace.intent || !trace.primaryEntity || !trace.sql) {
                throw new Error(`Trace object missing essential properties: ${JSON.stringify(trace)}`);
            }

            console.log(`  ✅ [PASS] Intent: ${classified.intent} | Entity: ${classified.entity} | Records: ${results.length}`);
            console.log(`     Sample Answer: "${answer.split('\n')[0].slice(0, 75)}..."\n`);
            passed++;

        } catch (err) {
            console.error(`  ❌ [FAIL] ${err.message}\n`);
            failed++;
        }
    }

    console.log('================================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runVerification();
