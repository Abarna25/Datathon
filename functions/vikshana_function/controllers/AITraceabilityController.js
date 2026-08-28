class AITraceabilityController {
    static async getLogs(req, res) {
        try {
            console.warn('[AITraceabilityController] getLogs called but AIInteractionLog table is disabled.');
            res.status(200).json({
                success: true,
                data: [],
                stats: {
                    totalQueries: 0,
                    highConfidence: 0,
                    mediumConfidence: 0,
                    lowConfidence: 0
                }
            });
        } catch (error) {
            console.error('[AITraceabilityController] getLogs error:', error);
            res.status(500).json({ success: false, error: error.message || 'Traceability lookup failed', data: [] });
        }
    }
}

module.exports = AITraceabilityController;
