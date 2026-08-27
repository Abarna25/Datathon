const datastoreClient = require('../queries/datastoreClient');
const ReportAgent = require('../agents/ReportAgent');

class ReportService {
    static async getReports(req) {
        try {
            const cases = await datastoreClient.getRows(req, 'CaseMaster', { maxRows: 10 }).catch(() => []);
            let reports = [];

            if (cases.length > 0) {
                cases.forEach((caseRow) => {
                    const id = String(caseRow.CaseMasterID || caseRow.ROWID);
                    reports.push({
                        id,
                        title: `Case Report: FIR #${caseRow.CrimeNo || id}`,
                        summary: `AI generated intelligence report for case in Station ${caseRow.PoliceStationID || 'Unknown'}`,
                        date: caseRow.CrimeRegisteredDate || caseRow.CREATEDTIME,
                        status: caseRow.CaseStatusID ? `Status ${caseRow.CaseStatusID}` : 'Active',
                    });
                });
            }

            return reports;
        } catch (error) {
            console.error("Report Fetch Error:", error);
            throw error;
        }
    }

    static async generateReport(req) {
        const { caseId } = req.body;

        try {
            const ContextBuilderService = require('./ContextBuilderService');
            const context = await ContextBuilderService.buildCaseContext(req, caseId).catch(() => null);
            
            if (!context || !context.case) throw new Error("Case not found");

            // Call GLM ReportAgent to synthesize a professional PDF-ready markdown document
            const markdownReport = await ReportAgent.generateReport(context);
            
            return { markdown: markdownReport };
        } catch (error) {
            console.error("Report Generation Error:", error);
            const fallbackMsg = `
# Investigation Report
**Case ID:** ${caseId}  
**Date Generated:** ${new Date().toLocaleDateString()}  

*Error generating full report due to missing AI/database capabilities.*
`;
            return { markdown: fallbackMsg };
        }
    }
}

module.exports = ReportService;
