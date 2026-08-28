const textToSQLService = require('../services/TextToSQLService');
const AuditService = require('../services/AuditService');

class TextToSQLController {
    async processQuery(req, res) {
        try {
            const { query, caseId } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required.' });
            }

            // Step 1: Generate SQL from Natural Language, passing the scoped case ID
            const sql = await textToSQLService.generateSQL(query, caseId);

            // Step 2: Validate SQL
            textToSQLService.validateSQL(sql);

            // Step 3: Execute query against Catalyst Data Store
            const results = await textToSQLService.executeSQL(req, sql);

            // Step 4: Generate intelligent direct answer & explanation based on results
            const answer = await textToSQLService.generateAnswer(req, query, sql, results, caseId);
            const explanation = await textToSQLService.explainResults(query, sql, results);

            // Step 5: Log the execution via AuditService
            await AuditService.logEvent(
                req,
                req.user,
                'Generated AI SQL Query',
                `Text-to-SQL Engine`,
                caseId || '', // Bind specific active case id
                'SUCCESS'
            );

            res.status(200).json({
                success: true,
                query: query,
                sql: sql,
                answer: answer,
                explanation: explanation,
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
                `Text-to-SQL Engine`,
                '',
                'FAILED'
            );




            res.status(500).json({ success: false, error: error.message || 'An error occurred during query processing' });
        }
    }
}


module.exports = new TextToSQLController();
