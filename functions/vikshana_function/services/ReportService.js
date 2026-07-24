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
            const caseRow = await datastoreClient.getRowById(req, 'CaseMaster', caseId).catch(() => null);
            if (!caseRow) throw new Error("Case not found");

            const context = {
                case_details: caseRow
            };

            // Call GLM ReportAgent to synthesize a professional PDF-ready markdown document
            const markdownReport = await ReportAgent.generateReport(context);
            
            return { markdown: markdownReport };
        } catch (error) {
            console.error("AI Generation Error:", error);
            throw error;
        }
    }
}

module.exports = ReportService;
