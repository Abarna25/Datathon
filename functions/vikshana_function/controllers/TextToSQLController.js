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

            // Step 4: Generate Explanation based on results
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
                results: results,
                explanation: explanation,
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

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new TextToSQLController();
