const CrimeForecastService = require('../services/CrimeForecastService');
const EarlyWarningService = require('../services/EarlyWarningService');

class ForecastController {
    static async getForecast(req, res) {
        try {
            const result = await CrimeForecastService.getForecast(req);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Error in getForecast controller:", error);
            res.status(500).json({ success: false, error: 'Failed to generate crime forecast.' });
        }
    }

    static async getEarlyWarnings(req, res) {
        try {
            const result = await EarlyWarningService.getWarnings(req);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Error in getEarlyWarnings controller:", error);
            res.status(500).json({ success: false, error: 'Failed to evaluate early warnings.' });
        }
    }
}

module.exports = ForecastController;
