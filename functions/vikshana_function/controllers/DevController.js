const SeedService = require('../services/SeedService');
const datastoreClient = require('../queries/datastoreClient');

class DevController {
    static async seed(req, res) {
        try {
            const caseId = (req.body && req.body.caseId) || req.query.caseId || '';
            const results = await SeedService.seedAllCases(req, caseId);
            res.status(200).json({ success: true, data: results });
        } catch (error) {
            console.error('Error in DevController.seed:', error);
            res.status(500).json({ success: false, error: error.message, stack: error.stack });
        }
    }

    static async seedTest(req, res) {
        try {
            const results = await SeedService.seedUsers(req);
            res.status(200).json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, stack: error.stack });
        }
    }
    
    static async checkTables(req, res) {
        try {
            const coreTables = [
                'CaseMaster', 'Victim', 'Accused', 'ComplainantDetails', 'ArrestSurrender', 
                'Employee', 'ChargesheetDetails', 'ActSectionAssociation', 'Court', 'Unit'
            ];
            
            const results = {};
            const missing = [];
            for (const table of coreTables) {
                try {
                    await datastoreClient.getRows(req, table, { maxRows: 1 });
                    results[table] = 'Exists';
                } catch (err) {
                    results[table] = `Missing or Error: ${err.message}`;
                    missing.push(table);
                }
            }
            
            res.status(200).json({ 
                success: true, 
                data: results,
                diagnostic: missing.length > 0 
                    ? `Missing critical Karnataka Police operational tables: ${missing.join(', ')}.` 
                    : 'All core Catalyst tables verified successfully.'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async listEmployees(req, res) {
        try {
            const rows = await datastoreClient.getRows(req, 'Employee', { maxRows: 50 }).catch(() => []);
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = DevController;
