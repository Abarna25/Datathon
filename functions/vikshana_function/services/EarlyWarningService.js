const CrimeForecastService = require('./CrimeForecastService');

class EarlyWarningService {
    static async getWarnings(req) {
        try {
            const forecastResult = await CrimeForecastService.getForecast(req);

            if (forecastResult.status === "INSUFFICIENT_DATA") {
                return {
                    status: "INSUFFICIENT_DATA",
                    data: [],
                    evidence: forecastResult.evidence,
                    limitations: forecastResult.limitations
                };
            }

            const forecastData = forecastResult.data;
            const warnings = [];

            // Rule 1: Elevated Trend Warning
            if (forecastData.trend === 'INCREASING' && forecastData.trendPercentage > 15) {
                warnings.push({
                    alert_id: `EW-TREND-${Date.now()}`,
                    status: "ACTIVE",
                    type: "TREND",
                    category: "ALL", // Modify if filtering by specific crime category later
                    severity: forecastData.trendPercentage > 50 ? "CRITICAL" : "ELEVATED",
                    observed_change: forecastData.trendPercentage,
                    baseline: forecastData.baseline,
                    recent_average: forecastData.recentAverage,
                    reason: "Recent case activity significantly exceeds historical baseline.",
                    rule: "RECENT_AVERAGE_ABOVE_BASELINE",
                    generated_at: new Date().toISOString()
                });
            }

            // Rule 2: Anomaly Detection
            const chartData = forecastData.chartData || [];
            let sum = 0;
            chartData.forEach(d => sum += d.actualCases);
            const mean = chartData.length > 0 ? (sum / chartData.length) : 0;
            
            let varianceSum = 0;
            chartData.forEach(d => varianceSum += Math.pow(d.actualCases - mean, 2));
            const stdDev = Math.sqrt(chartData.length > 0 ? varianceSum / chartData.length : 0);

            // Check if most recent period is an anomaly (> 1.5 StdDev for demo purposes)
            if (chartData.length > 0) {
                const latestPeriod = chartData[chartData.length - 1];
                if (latestPeriod.actualCases > (mean + (1.5 * stdDev))) {
                    warnings.push({
                        alert_id: `EW-ANOMALY-${Date.now()}`,
                        status: "ACTIVE",
                        type: "ANOMALY",
                        category: "ALL",
                        severity: "CRITICAL",
                        observed_change: latestPeriod.actualCases,
                        baseline: parseFloat(mean.toFixed(1)),
                        recent_average: latestPeriod.actualCases,
                        reason: `Activity in ${latestPeriod.period} exceeded standard deviation bounds.`,
                        rule: "COUNT_EXCEEDS_STDDEV_THRESHOLD",
                        generated_at: new Date().toISOString()
                    });
                }
            }

            return {
                status: "AVAILABLE",
                data: warnings,
                evidence: forecastResult.evidence,
                method: "Deterministic threshold evaluation against historical baselines",
                limitations: ["Warnings highlight statistical deviations. They do not claim causation or identify specific future suspects."]
            };

        } catch (error) {
            console.error("Error in getWarnings:", error);
            throw error;
        }
    }
}

module.exports = EarlyWarningService;
