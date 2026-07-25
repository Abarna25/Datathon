const DashboardService = require('../services/DashboardService');

class DashboardController {
    static async getDashboard(req, res) {
        try {
            const data = await DashboardService.getDashboardData(req);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Error in DashboardController:", error);
            res.status(500).json({ success: false, error: "Internal Server Error", details: error.message, stack: error.stack });
        }
    }
}

module.exports = DashboardController;
