const textToSQLService = require('../services/TextToSQLService');
const AuditService = require('../services/AuditService');

class TextToSQLController {
    async processQuery(req, res) {
        try {
            const { query, caseId, history } = req.body;
            
            // Check for empty / whitespace-only query
            if (!query || !String(query).trim()) {
                return res.status(200).json({
                    success: true,
                    query: query || '',
                    sql: '',
                    answer: '### 💡 How can I assist your investigation?\n\nPlease enter a search term, suspect name, case number, or legal section. For example:\n- *"Show all cases registered in 2021"*\n- *"Find suspects named Ramesh"*\n- *"Show cases involving IPC section 380"*\n- *"Count cases by police station"*',
                    explanation: 'Prompt was empty or whitespace. Ready for user query.',
                    trace: {
                        intent: 'EMPTY_PROMPT',
                        primaryEntity: 'None',
                        sql: '',
                        confidence: 'N/A'
                    },
                    results: [],
                    count: 0
                });
            }

            const rawQuery = String(query).trim();

            // Check for purely malformed / gibberish / emoji inputs
            if (/^[^a-zA-Z0-9\u0900-\u097F\u0C80-\u0CFF]+$/.test(rawQuery) && rawQuery.length > 0) {
                return res.status(200).json({
                    success: true,
                    query: rawQuery,
                    sql: '',
                    answer: `### ℹ️ Query Input Notice\n\nYour input (\`${rawQuery}\`) contains only symbols or emojis without searchable keywords. Please enter natural language text or specific case criteria to search the Karnataka State Police datastore.`,
                    explanation: 'Input contained only non-alphanumeric symbols or emojis.',
                    trace: {
                        intent: 'INVALID_INPUT',
                        primaryEntity: 'None',
                        sql: '',
                        confidence: 'N/A'
                    },
                    results: [],
                    count: 0
                });
            }

            // Check AI Safety & Hallucination Guard
            const safetyAlert = textToSQLService.checkSafetyIntent(rawQuery);
            if (safetyAlert) {
                return res.status(200).json({
                    success: true,
                    query: rawQuery,
                    sql: 'N/A (AI Safety Guard Triggered)',
                    answer: `### 🛡️ VIKSHANA Intelligence & Safety Notice\n\n${safetyAlert.reason}`,
                    explanation: 'AI safety policy applied. Query addressed within statutory and ethical parameters.',
                    trace: {
                        intent: 'SAFETY_GUARD',
                        primaryEntity: 'Policy',
                        sql: 'N/A',
                        confidence: '100% Policy Compliant'
                    },
                    results: [],
                    count: 0
                });
            }

            const startTime = Date.now();

            // Step 1: Classify intent + primary entity
            const classified = textToSQLService.classifyIntentAndEntity(rawQuery, caseId, history);

            // Step 2: Generate & Validate SQL
            const sql = await textToSQLService.generateSQL(rawQuery, caseId, history);
            textToSQLService.validateSQL(sql);

            // Step 3: Execute query against Catalyst Data Store / in-memory index
            const results = await textToSQLService.executeSQL(req, sql);
            const duration = Date.now() - startTime;

            // Step 4: Generate intelligent direct answer & trace
            const answer = await textToSQLService.generateAnswer(req, rawQuery, sql, results, caseId, classified);
            const explanation = await textToSQLService.explainResults(rawQuery, sql, results);
            const trace = textToSQLService.generateTrace(rawQuery, sql, results, classified, duration);

            // Step 5: Log the execution via AuditService
            await AuditService.logEvent(
                req,
                req.user,
                'Generated AI SQL Query',
                'Text-to-SQL Engine',
                caseId || '',
                'SUCCESS'
            ).catch(() => null);

            res.status(200).json({
                success: true,
                query: rawQuery,
                sql: sql,
                answer: answer,
                explanation: explanation,
                trace: trace,
                results: results,
                count: results.length
            });

        } catch (error) {
            console.error('[TextToSQLController] processQuery error:', error.message);
            
            // Log failure
            await AuditService.logEvent(
                req,
                req.user,
                'Failed AI SQL Query',
                'Text-to-SQL Engine',
                '',
                'FAILED'
            ).catch(() => null);

            res.status(200).json({ 
                success: false, 
                error: error.message || 'An error occurred during query processing',
                answer: `I encountered an issue processing your query: **${error.message}**.\n\nPlease refine your search parameters or select one of the suggested prompts.`
            });
        }
    }
}

module.exports = new TextToSQLController();
